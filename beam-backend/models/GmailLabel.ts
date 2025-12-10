import {
	Schema,
	model,
	models,
	InferSchemaType,
	Types,
} from "mongoose";

const gmailLabelSchema = new Schema(
	{
		user: { type: Types.ObjectId, ref: "User", required: true, index: true },
		labelId: { type: String, required: true },
		name: { type: String, required: true },
		type: { type: String },
		messageListVisibility: { type: String },
		labelListVisibility: { type: String },
		color: {
			backgroundColor: String,
			textColor: String,
		},
		messagesTotal: { type: Number },
		messagesUnread: { type: Number },
		lastSyncedAt: { type: Date, default: Date.now },
	},
	{
		timestamps: true,
	},
);

gmailLabelSchema.index({ user: 1, labelId: 1 }, { unique: true });

export type GmailLabelDocument = InferSchemaType<typeof gmailLabelSchema>;

export const GmailLabelModel =
	models.GmailLabel || model("GmailLabel", gmailLabelSchema);
