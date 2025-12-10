import express, { type RequestHandler } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import cors from "cors";
import mongoose from "mongoose";
import { readFileSync } from "node:fs";
import "dotenv/config";

import { UserModel } from "./models/User";
import {
	listStoredLabels,
	listStoredMessages,
	syncMailboxForUser,
	getMessageWithBody,
	applyLabelToMessages,
	getLabelUsageStats,
} from "./services/gmailSync";

declare global {
	namespace Express {
		interface User {
			id: string;
			googleId: string;
			displayName: string;
			email?: string;
			photo?: string;
		}
	}
}

type GoogleCredentials = {
	web: {
		client_id: string;
		client_secret: string;
		redirect_uris?: string[];
		javascript_origins?: string[];
	};
};

const credentials = JSON.parse(
	readFileSync(new URL("./client_secret.json", import.meta.url), "utf-8"),
) as GoogleCredentials;

process.env.GOOGLE_CLIENT_ID ??= credentials.web.client_id;
process.env.GOOGLE_CLIENT_SECRET ??= credentials.web.client_secret;

const CLIENT_URL =
	process.env.CLIENT_URL ||
	credentials.web.javascript_origins?.[0] ||
	"http://localhost:6173";
const GOOGLE_CALLBACK_URL =
	process.env.GOOGLE_CALLBACK_URL ||
	credentials.web.redirect_uris?.[0] ||
	`${CLIENT_URL}/api/auth/callback/google`;
const SESSION_SECRET = process.env.SESSION_SECRET || "beam-dev-secret";
const PORT = Number(process.env.PORT) || 4000;
const MONGO_URI =
	process.env.MONGO_URI || "mongodb://127.0.0.1:27017/beam";

const ensureAuthenticated: RequestHandler = (req, res, next) => {
	if (req.isAuthenticated() && req.user) {
		return next();
	}
	res.status(401).json({ error: "Not authenticated" });
};

function assertAuthenticatedUser(
	req: express.Request,
): asserts req is express.Request & { user: Express.User } {
	if (!req.user) {
		throw new Error(
			"Authenticated request is missing the user payload from session",
		);
	}
}

const serializeMessage = (message: {
	gmailId: string;
	threadId: string;
	historyId?: string;
	labelIds?: string[];
	subject?: string;
	snippet?: string;
	from?: string;
	to?: string;
	internalDate?: Date;
	plainBody?: string;
	htmlBody?: string;
}) => ({
	id: message.gmailId,
	threadId: message.threadId,
	historyId: message.historyId,
	labelIds: message.labelIds,
	subject: message.subject,
	snippet: message.snippet,
	from: message.from,
	to: message.to,
	internalDate: message.internalDate?.toISOString(),
	plainBody: message.plainBody,
	htmlBody: message.htmlBody,
});

const app = express();

app.set("trust proxy", 1);
app.use(
	cors({
		origin: CLIENT_URL,
		credentials: true,
	}),
);
app.use(express.json());
app.use(
	session({
		secret: SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			secure: process.env.NODE_ENV === "production",
		},
	}),
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: Express.User, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
	try {
		const user = await UserModel.findById(id).lean();
		if (!user) {
			return done(null, false);
		}

		done(null, {
			id: user._id.toString(),
			googleId: user.googleId,
			displayName: user.displayName,
			email: user.email,
			photo: user.photo,
		});
	} catch (error) {
		done(error as Error);
	}
});

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			callbackURL: GOOGLE_CALLBACK_URL,
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				const approxExpiry = new Date(Date.now() + 55 * 60 * 1000);

				const update: Record<string, unknown> = {
					googleId: profile.id,
					displayName: profile.displayName,
					email: profile.emails?.[0]?.value,
					photo: profile.photos?.[0]?.value,
				};

				if (accessToken) {
					update.accessToken = accessToken;
					update.tokenExpiry = approxExpiry;
				}

				if (refreshToken) {
					update.refreshToken = refreshToken;
				}

				const user = await UserModel.findOneAndUpdate(
					{ googleId: profile.id },
					{ $set: update },
					{
						upsert: true,
						new: true,
						setDefaultsOnInsert: true,
					},
				);

				if (!user) {
					return done(new Error("Failed to upsert user"));
				}

				done(null, {
					id: user._id.toString(),
					googleId: user.googleId,
					displayName: user.displayName,
					email: user.email,
					photo: user.photo,
				});
			} catch (error) {
				done(error as Error);
			}
		},
	),
);

app.get("/api/health", (_req, res) => {
	res.json({ ok: true });
});

app.get(
	"/api/auth/google",
	passport.authenticate("google", {
		scope: ["profile", "email", "https://www.googleapis.com/auth/gmail.modify"],
		prompt: "consent select_account",
		accessType: "offline",
		includeGrantedScopes: true,
		session: true,
	}),
);

app.get(
	"/api/auth/callback/google",
	passport.authenticate("google", {
		failureRedirect: `${CLIENT_URL}?auth=failed`,
		session: true,
	}),
	(_req, res) => {
		res.redirect(`${CLIENT_URL}?auth=success`);
	},
);

app.get("/api/auth/me", (req, res) => {
	if (req.isAuthenticated()) {
		res.json({
			authenticated: true,
			user: req.user,
		});
		return;
	}

	res.status(401).json({
		authenticated: false,
		user: null,
	});
});

app.post("/api/auth/logout", (req, res, next) => {
	req.logout(err => {
		if (err) {
			return next(err);
		}

		req.session.destroy(sessionErr => {
			if (sessionErr) {
				return next(sessionErr);
			}

			res.clearCookie("connect.sid");
			res.json({ success: true });
		});
	});
});

app.post("/api/gmail/sync", ensureAuthenticated, async (req, res, next) => {
	try {
		assertAuthenticatedUser(req);
		const summary = await syncMailboxForUser(req.user.id, {
			forceFull: req.body?.mode === "full",
		});

		res.json({ ok: true, summary });
	} catch (error) {
		next(error);
	}
});

app.get("/api/gmail/messages", ensureAuthenticated, async (req, res, next) => {
	try {
		assertAuthenticatedUser(req);
		const limit = Math.min(
			Number.parseInt(String(req.query.limit ?? "50"), 10) || 50,
			200,
		);
		const page = Math.max(
			Number.parseInt(String(req.query.page ?? "1"), 10) || 1,
			1,
		);
		const offset = (page - 1) * limit;
		const labelId =
			typeof req.query.labelId === "string" ? req.query.labelId : undefined;

		const { messages, total } = await listStoredMessages(req.user.id, {
			limit,
			offset,
			labelId,
		});
		const payload = messages.map(serializeMessage);
		res.json({ messages: payload, total, page, limit });
	} catch (error) {
		next(error);
	}
});

app.get(
	"/api/gmail/messages/:id",
	ensureAuthenticated,
	async (req, res, next) => {
		try {
			assertAuthenticatedUser(req);
			const messageId =
				typeof req.params.id === "string" ? req.params.id : undefined;
			if (!messageId) {
				res.status(400).json({ error: "message id is required" });
				return;
			}
			const message = await getMessageWithBody(req.user.id, messageId);
			if (!message) {
				res.status(404).json({ error: "Message not found" });
				return;
			}
			res.json({ message: serializeMessage(message) });
		} catch (error) {
			next(error);
		}
	},
);

app.get("/api/gmail/labels", ensureAuthenticated, async (req, res, next) => {
	try {
		assertAuthenticatedUser(req);
		const labels = await listStoredLabels(req.user.id);
		const payload = labels.map(label => ({
			id: label.labelId,
			name: label.name,
			type: label.type,
			messageListVisibility: label.messageListVisibility,
			labelListVisibility: label.labelListVisibility,
			messagesTotal: label.messagesTotal,
			messagesUnread: label.messagesUnread,
			color: label.color,
		}));

		res.json({ labels: payload });
	} catch (error) {
		next(error);
	}
});

app.post(
	"/api/gmail/messages/apply-label",
	ensureAuthenticated,
	async (req, res, next) => {
		try {
			assertAuthenticatedUser(req);
			const { labelId, messageIds } = req.body ?? {};
			if (
				typeof labelId !== "string" ||
				!Array.isArray(messageIds) ||
				!messageIds.length
			) {
				res
					.status(400)
					.json({ error: "labelId and messageIds are required" });
				return;
			}

			const normalizedIds = messageIds
				.map(id => String(id))
				.filter(Boolean);
			if (!normalizedIds.length) {
				res
					.status(400)
					.json({ error: "messageIds must include at least one id" });
				return;
			}

			const result = await applyLabelToMessages(
				req.user.id,
				labelId,
				normalizedIds,
			);

			res.json({ ok: true, modified: result.modified });
		} catch (error) {
			next(error);
		}
	},
);

app.get(
	"/api/gmail/labels/stats",
	ensureAuthenticated,
	async (req, res, next) => {
		try {
			assertAuthenticatedUser(req);
			const stats = await getLabelUsageStats(req.user.id);
			res.json({ stats });
		} catch (error) {
			next(error);
		}
	},
);

app.use((_req, res) => {
	res.status(404).json({
		error: "Not found",
	});
});

app.use(
	(
		error: Error,
		_req: express.Request,
		res: express.Response,
		_next: express.NextFunction,
	) => {
		console.error(error);
		res.status(500).json({ error: error.message });
	},
);

const start = async () => {
	await mongoose.connect(MONGO_URI);
	console.log("Connected to MongoDB");

	app.listen(PORT, () => {
		console.log(`Beam backend listening on http://localhost:${PORT}`);
	});
};

start().catch(error => {
	console.error("Failed to start server", error);
	process.exit(1);
});
