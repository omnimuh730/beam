import { Schema, model, models, Types } from "mongoose";
import type { InferSchemaType } from "mongoose";

const gmailMessageSchema = new Schema(
	{
		user: { type: Types.ObjectId, ref: "User", required: true, index: true },
		gmailId: { type: String, required: true },
		threadId: { type: String, required: true },
		historyId: { type: String },
		labelIds: [{ type: String }],
		snippet: { type: String },
		subject: { type: String },
		from: { type: String },
		to: { type: String },
		internalDate: { type: Date, index: true },
		sizeEstimate: { type: Number },
		plainBody: { type: String },
		htmlBody: { type: String },
		headers: { type: Map, of: String },
		lastSyncedAt: { type: Date, default: Date.now },
	},
	{
		timestamps: true,
	},
);

gmailMessageSchema.index({ user: 1, gmailId: 1 }, { unique: true });

export type GmailMessageDocument = InferSchemaType<typeof gmailMessageSchema>;

export const GmailMessageModel =
	models.GmailMessage || model("GmailMessage", gmailMessageSchema);
