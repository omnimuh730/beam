// index.ts
import express from "express";
// import { connectDB } from './db.js'; // You would uncomment this when setting up MongoDB
import "dotenv/config";
// import { google } from 'googleapis'; // Uncomment when implementing Gmail API logic

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// 1. (Future) Connect to MongoDB:
// connectDB();

// 2. Base Route
app.get("/", (req, res) => {
	res.send("Welcome to the Beam Backend. Ready to serve Gmail data.");
});

// 3. Gmail API Route (Placeholder)
app.get("/api/gmail/latest", async (req, res) => {
	try {
		// --- AUTHENTICATION AND API CALL LOGIC GOES HERE ---

		// **Simplified Placeholder Logic:**
		// You would typically:
		// 1. Get an existing OAuth token for the user from your MongoDB.
		// 2. Set up the OAuth2 client and the Gmail API client.
		// 3. Call gmail.users.messages.list({ userId: 'me', maxResults: 5 });

		const placeholderData = {
			status: "Success",
			message: "This endpoint will soon serve data from the Gmail API!",
			instructions: "Implement OAuth2 flow and use googleapis library.",
		};

		res.json(placeholderData);
	} catch (error) {
		console.error("Error fetching Gmail data:", error);
		res.status(500).json({
			error: "Failed to retrieve data from Gmail API.",
		});
	}
});

// Start the server
app.listen(PORT, () => {
	console.log(`🚀 Bun Server running on http://localhost:${PORT}`);
	console.log('Use "bun run dev" for watch mode.');
});

// To run this: bun run dev
