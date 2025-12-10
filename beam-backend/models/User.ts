import { Schema, model, models } from "mongoose";
import type { InferSchemaType } from "mongoose";

const userSchema = new Schema(
	{
		googleId: { type: String, required: true, unique: true },
		displayName: { type: String, required: true },
		email: { type: String },
		photo: { type: String },
		accessToken: { type: String, select: false },
		refreshToken: { type: String, select: false },
		tokenExpiry: { type: Date, select: false },
		lastHistoryId: { type: String },
		lastFullSync: { type: Date },
	},
	{
		timestamps: true,
	},
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const UserModel = models.User || model("User", userSchema);
