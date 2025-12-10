import { Buffer } from "node:buffer";
import { Types } from "mongoose";
import type { FilterQuery } from "mongoose";
import { GmailLabelModel } from "../models/GmailLabel";
import {
	GmailMessageModel,
	type GmailMessageDocument,
} from "../models/GmailMessage";
import { UserModel } from "../models/User";

type UserWithTokens = NonNullable<
	Awaited<ReturnType<typeof loadUserWithTokens>>
>;

const GMAIL_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me";
const GMAIL_HISTORY_TYPES: string[] = [
	"labelAdded",
	"labelRemoved",
	"messageAdded",
	"messageDeleted",
];

const METADATA_HEADERS: string[] = [
	"Subject",
	"From",
	"To",
	"Date",
	"Delivered-To",
];

const RATE_LIMIT_DELAY_MS = Number(
	process.env.GMAIL_RATE_LIMIT_MS ?? "200",
);

const resolveFullSyncLimit = () => {
	const raw = process.env.GMAIL_FULL_SYNC_LIMIT ?? "2000";
	if (typeof raw === "string" && raw.toLowerCase() === "all") {
		return Number.POSITIVE_INFINITY;
	}
	const parsed = Number(raw);
	if (Number.isFinite(parsed) && parsed > 0) {
		return parsed;
	}
	return 2000;
};

const FULL_SYNC_MAX_MESSAGES = resolveFullSyncLimit();

const FULL_SYNC_BATCH_SIZE = Math.min(
	500,
	Math.max(25, Number(process.env.GMAIL_FULL_SYNC_BATCH ?? "250") || 250),
);

const delay = (ms: number) =>
	new Promise(resolve => {
		setTimeout(resolve, ms);
	});

class GmailApiError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

export const urlSafeDecode = (data?: string) => {
	if (!data) return undefined;
	const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
	return Buffer.from(normalized, "base64").toString("utf-8");
};

export const pickHeader = (
	headers: Array<{ name: string; value: string }> | undefined,
	target: string,
) => {
	if (!headers) return undefined;
	const lower = target.toLowerCase();
	return headers.find(
		header => header.name?.toLowerCase() === lower,
	)?.value;
};

export const extractBodies = (
	payload?: GmailApiMessage["payload"],
): { plainBody?: string; htmlBody?: string } => {
	if (!payload) return {};
	const { mimeType, body, parts } = payload;
	const result: { plainBody?: string; htmlBody?: string } = {};

	const appendBody = (type?: string, data?: string) => {
		if (!data) return;
		if (type === "text/plain" && !result.plainBody) {
			result.plainBody = data;
		}
		if (type === "text/html" && !result.htmlBody) {
			result.htmlBody = data;
		}
	};

	if (body?.data) {
		appendBody(mimeType, urlSafeDecode(body.data));
	}

	if (parts?.length) {
		for (const part of parts) {
			const { plainBody, htmlBody } = extractBodies(part);
			if (plainBody && !result.plainBody) result.plainBody = plainBody;
			if (htmlBody && !result.htmlBody) result.htmlBody = htmlBody;
		}
	}

	return result;
};

type OAuthRefreshResponse = {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
};

const ensureAccessToken = async (user: UserWithTokens) => {
	if (
		user.accessToken &&
		user.tokenExpiry &&
		user.tokenExpiry.getTime() - Date.now() > 60_000
	) {
		return user.accessToken;
	}

	if (!user.refreshToken) {
		throw new Error("Missing refresh token for Gmail sync");
	}

	const params = new URLSearchParams({
		client_id: process.env.GOOGLE_CLIENT_ID ?? "",
		client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		grant_type: "refresh_token",
		refresh_token: user.refreshToken,
	});

	const response = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	if (!response.ok) {
		throw new GmailApiError(
			response.status,
			`Failed to refresh token: ${await response.text()}`,
		);
	}

	const payload = (await response.json()) as OAuthRefreshResponse;
	user.accessToken = payload.access_token;
	user.tokenExpiry = new Date(Date.now() + payload.expires_in * 1000);
	if (payload.refresh_token) {
		user.refreshToken = payload.refresh_token;
	}
	await user.save();

	return user.accessToken;
};

type QueryValue = string | number | Array<string | number> | undefined;

const gmailRequest = async <T>(
	user: UserWithTokens,
	path: string,
	query: Record<string, QueryValue> = {},
	init: RequestInit = {},
): Promise<T> => {
	const token = await ensureAccessToken(user);
	const url = new URL(
		path.startsWith("http") ? path : `${GMAIL_BASE_URL}/${path}`,
	);

	for (const [key, value] of Object.entries(query)) {
		if (value === undefined || value === null) {
			continue;
		}
		if (Array.isArray(value)) {
			value.forEach(item =>
				url.searchParams.append(key, String(item)),
			);
		} else {
			url.searchParams.set(key, String(value));
		}
	}

	const response = await fetch(url, {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			...(init.headers || {}),
		},
	});

	if (!response.ok) {
		throw new GmailApiError(
			response.status,
			`Gmail API error ${response.status}: ${await response.text()}`,
		);
	}

	return response.json() as Promise<T>;
};

export const removeUndefined = <T extends Record<string, unknown>>(obj: T) => {
	return Object.fromEntries(
		Object.entries(obj).filter(([, value]) => value !== undefined),
	) as Partial<T>;
};

const upsertMessage = async (
	user: UserWithTokens,
	message: GmailApiMessage,
	options: { replaceBody?: boolean } = {},
) => {
	const { replaceBody = true } = options;
	const headers = message.payload?.headers;
	const subject = pickHeader(headers, "Subject");
	const from = pickHeader(headers, "From");
	const to = pickHeader(headers, "To");
	const internalDate = message.internalDate
		? new Date(Number(message.internalDate))
		: undefined;
	const { plainBody, htmlBody } = extractBodies(message.payload);

	const doc: Partial<GmailMessageDocument> = {
		user: user._id,
		gmailId: message.id,
		threadId: message.threadId,
		historyId: message.historyId,
		labelIds: message.labelIds ?? [],
		snippet: message.snippet,
		subject,
		from,
		to,
		internalDate,
		sizeEstimate: message.sizeEstimate,
		plainBody,
		htmlBody,
		headers:
			headers && headers.length
				? headers.reduce<Map<string, string>>((acc, header) => {
						if (header.name && header.value) {
							acc.set(header.name, header.value);
						}
						return acc;
				  }, new Map())
				: undefined,
		lastSyncedAt: new Date(),
	};

	const updateDoc = removeUndefined(doc);

	if (!replaceBody) {
		delete updateDoc.plainBody;
		delete updateDoc.htmlBody;
	}

	await GmailMessageModel.findOneAndUpdate(
		{ user: user._id, gmailId: message.id } as FilterQuery<GmailMessageDocument>,
		{ $set: updateDoc },
		{ upsert: true, new: true, setDefaultsOnInsert: true },
	);
};

const upsertLabels = async (
	user: UserWithTokens,
	labels: GmailApiLabel[],
) => {
	if (!labels.length) return;

	await GmailLabelModel.bulkWrite(
		labels.map(label => ({
			updateOne: {
				filter: { user: user._id, labelId: label.id },
				update: {
					$set: {
						name: label.name,
						type: label.type,
						messageListVisibility: label.messageListVisibility,
						labelListVisibility: label.labelListVisibility,
						messagesTotal: label.messagesTotal,
						messagesUnread: label.messagesUnread,
						color: label.color,
						lastSyncedAt: new Date(),
					},
				},
				upsert: true,
			},
		})),
	);
};

const performFullSync = async (user: UserWithTokens) => {
	const profile = await gmailRequest<GmailApiProfile>(user, "profile");
	const labelResponse = await gmailRequest<{ labels: GmailApiLabel[] }>(
		user,
		"labels",
	);

	await upsertLabels(user, labelResponse.labels ?? []);

	let pageToken: string | undefined;
	let fetched = 0;
	const summary = { upserted: 0, deleted: 0 };

	const shouldContinue = () =>
		Number.isFinite(FULL_SYNC_MAX_MESSAGES)
			? fetched < FULL_SYNC_MAX_MESSAGES
			: true;

	while (shouldContinue()) {
		const maxResults = Number.isFinite(FULL_SYNC_MAX_MESSAGES)
			? Math.min(
					FULL_SYNC_BATCH_SIZE,
					Math.max(0, FULL_SYNC_MAX_MESSAGES - fetched),
			  )
			: FULL_SYNC_BATCH_SIZE;

		if (maxResults <= 0) {
			break;
		}

		const listResponse = await gmailRequest<GmailApiMessageList>(
			user,
			"messages",
			{
				maxResults,
				labelIds: "INBOX",
				pageToken,
			},
		);

		const messages = listResponse.messages ?? [];
		if (!messages.length) {
			break;
		}

		for (const messageMeta of messages) {
			await delay(RATE_LIMIT_DELAY_MS);
			const message = await gmailRequest<GmailApiMessage>(
				user,
				`messages/${messageMeta.id}`,
				{
					format: "full",
				},
			);
			await upsertMessage(user, message, { replaceBody: true });
			summary.upserted += 1;
			fetched += 1;

			if (
				Number.isFinite(FULL_SYNC_MAX_MESSAGES) &&
				fetched >= FULL_SYNC_MAX_MESSAGES
			) {
				break;
			}
		}

		if (
			Number.isFinite(FULL_SYNC_MAX_MESSAGES) &&
			fetched >= FULL_SYNC_MAX_MESSAGES
		) {
			break;
		}

		pageToken = listResponse.nextPageToken;
		if (!pageToken) {
			break;
		}
	}

	user.lastHistoryId = profile.historyId;
	user.lastFullSync = new Date();
	await user.save();

	return summary;
};

const performDeltaSync = async (user: UserWithTokens, startHistoryId: string) => {
	let pageToken: string | undefined;
	let latestHistoryId = startHistoryId;
	const summary = { upserted: 0, deleted: 0 };

	do {
		const historyResponse = await gmailRequest<GmailApiHistoryList>(
			user,
			"history",
			{
				startHistoryId,
				pageToken,
				historyTypes: GMAIL_HISTORY_TYPES,
			},
		);

		const historyEntries = historyResponse.history ?? [];
		const idsForFullFetch = new Set<string>();
		const idsForMetadata = new Set<string>();
		const idsToDelete = new Set<string>();

		const queueMeta = (id?: string) => {
			if (!id || idsForFullFetch.has(id)) return;
			idsForMetadata.add(id);
		};

		for (const entry of historyEntries) {
			latestHistoryId = entry.id ?? latestHistoryId;
			entry.messagesAdded?.forEach(item =>
				item.message?.id && idsForFullFetch.add(item.message.id),
			);
			entry.labelsAdded?.forEach(item =>
				queueMeta(item.message?.id),
			);
			entry.labelsRemoved?.forEach(item =>
				queueMeta(item.message?.id),
			);
			entry.messagesDeleted?.forEach(item =>
				item.message?.id && idsToDelete.add(item.message.id),
			);
		}

		if (idsToDelete.size) {
			const result = await GmailMessageModel.deleteMany({
				user: user._id,
				gmailId: { $in: Array.from(idsToDelete) },
			});
			summary.deleted += result.deletedCount ?? 0;
		}

		for (const id of idsForFullFetch) {
			await delay(RATE_LIMIT_DELAY_MS);
			const message = await gmailRequest<GmailApiMessage>(
				user,
				`messages/${id}`,
				{
					format: "full",
				},
			);
			await upsertMessage(user, message, { replaceBody: true });
			summary.upserted += 1;
			idsForMetadata.delete(id);
		}

		for (const id of idsForMetadata) {
			await delay(RATE_LIMIT_DELAY_MS);
			const message = await gmailRequest<GmailApiMessage>(
				user,
				`messages/${id}`,
				{
					format: "metadata",
					metadataHeaders: METADATA_HEADERS,
				},
			);
			await upsertMessage(user, message, { replaceBody: false });
			summary.upserted += 1;
		}

		pageToken = historyResponse.nextPageToken;
	} while (pageToken);

	user.lastHistoryId = latestHistoryId;
	await user.save();

	return summary;
};

export const syncMailboxForUser = async (
	userId: string,
	options: { forceFull?: boolean } = {},
) => {
	const user = await loadUserWithTokens(userId);
	if (!user) {
		throw new Error("Unable to load user for Gmail sync");
	}

	try {
		if (options.forceFull || !user.lastHistoryId) {
			return await performFullSync(user);
		}
		return await performDeltaSync(user, user.lastHistoryId);
	} catch (error) {
		if (
			error instanceof GmailApiError &&
			error.status === 404 &&
			!options.forceFull
		) {
			// History expired, fall back to full sync.
			return await performFullSync(user);
		}
		throw error;
	}
};

const loadUserWithTokens = async (userId: string) =>
	UserModel.findById(userId).select(
		"+accessToken +refreshToken +tokenExpiry +lastHistoryId",
	);

export const applyLabelToMessages = async (
	userId: string,
	labelId: string,
	messageIds: string[],
) => {
	if (!labelId || !messageIds?.length) {
		return { modified: 0 };
	}

	const user = await loadUserWithTokens(userId);
	if (!user) {
		throw new Error("Unable to load user for label application");
	}

	await gmailRequest(user, "messages/batchModify", {}, {
		method: "POST",
		body: JSON.stringify({
			ids: messageIds,
			addLabelIds: [labelId],
		}),
	});

	const result = await GmailMessageModel.updateMany(
		{ user: user._id, gmailId: { $in: messageIds } },
		{ $addToSet: { labelIds: labelId } },
	);

	return { modified: result.modifiedCount ?? 0 };
};

export const getLabelUsageStats = async (userId: string) => {
	const userObjectId = new Types.ObjectId(userId);
	const stats = await GmailMessageModel.aggregate<{
		_id: string;
		total: number;
		unread: number;
	}>([
		{ $match: { user: userObjectId } },
		{
			$addFields: {
				isUnread: {
					$in: ["UNREAD", "$labelIds"],
				},
			},
		},
		{ $unwind: "$labelIds" },
		{
			$group: {
				_id: "$labelIds",
				total: { $sum: 1 },
				unread: {
					$sum: {
						$cond: [{ $eq: ["$isUnread", true] }, 1, 0],
					},
				},
			},
		},
	]);

	const result: Record<string, { total: number; unread: number }> = {};
	stats.forEach(entry => {
		if (!entry?._id) return;
		result[String(entry._id)] = {
			total: entry.total ?? 0,
			unread: entry.unread ?? 0,
		};
	});
	return result;
};

type GmailApiProfile = {
	emailAddress: string;
	historyId: string;
	messagesTotal: number;
	threadsTotal: number;
};

type GmailApiLabel = {
	id: string;
	name: string;
	type?: string;
	messageListVisibility?: string;
	labelListVisibility?: string;
	color?: {
		textColor?: string;
		backgroundColor?: string;
	};
	messagesTotal?: number;
	messagesUnread?: number;
};

type GmailApiMessageList = {
	messages?: { id: string; threadId: string }[];
	nextPageToken?: string;
	resultSizeEstimate?: number;
};

type GmailApiMessage = {
	id: string;
	threadId: string;
	historyId?: string;
	labelIds: string[];
	snippet?: string;
	sizeEstimate?: number;
	internalDate: string;
	payload?: {
		partId?: string;
		mimeType?: string;
		filename?: string;
		body?: {
			size?: number;
			data?: string;
		};
		headers?: Array<{ name: string; value: string }>;
		parts?: GmailApiMessage["payload"][];
	};
};

type GmailApiHistoryList = {
	history?: Array<{
		id?: string;
		messagesAdded?: Array<{ message?: GmailApiMessage }>;
		messagesDeleted?: Array<{ message?: GmailApiMessage }>;
		labelsAdded?: Array<{ message?: GmailApiMessage; labelIds?: string[] }>;
		labelsRemoved?: Array<{ message?: GmailApiMessage; labelIds?: string[] }>;
	}>;
	nextPageToken?: string;
};

type ListMessagesOptions = {
	limit: number;
	offset?: number;
	labelId?: string;
};

export const listStoredMessages = async (
	userId: string,
	{ limit, offset = 0, labelId }: ListMessagesOptions,
) => {
	const criteria: FilterQuery<GmailMessageDocument> = {
		user: userId,
	};

	if (labelId) {
		criteria.labelIds = labelId;
	}

	const [messages, total] = await Promise.all([
		GmailMessageModel.find(criteria)
			.sort({ internalDate: -1 })
			.skip(offset)
			.limit(limit)
			.lean(),
		GmailMessageModel.countDocuments(criteria),
	]);

	return { messages, total };
};

export const listStoredLabels = (userId: string) =>
	GmailLabelModel.find({ user: userId }).sort({ name: 1 }).lean();

export const getMessageWithBody = async (userId: string, gmailId: string) => {
	let message = await GmailMessageModel.findOne({
		user: userId,
		gmailId,
	}).lean();

	if (message && (message.plainBody || message.htmlBody)) {
		return message;
	}

	const user = await loadUserWithTokens(userId);
	if (!user) {
		throw new Error("Unable to load user for Gmail fetch");
	}

	const remoteMessage = await gmailRequest<GmailApiMessage>(
		user,
		`messages/${gmailId}`,
		{
			format: "full",
		},
	);

	await upsertMessage(user, remoteMessage, { replaceBody: true });

	message = await GmailMessageModel.findOne({
		user: user._id,
		gmailId,
	}).lean();

	return message;
};
