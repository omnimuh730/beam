import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import cors from "cors";
import { readFileSync } from "node:fs";
import "dotenv/config";

declare global {
	namespace Express {
		interface User {
			id: string;
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

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user: Express.User, done) => {
	done(null, user);
});

passport.use(
	new GoogleStrategy(
		{
			clientID: credentials.web.client_id,
			clientSecret: credentials.web.client_secret,
			callbackURL: GOOGLE_CALLBACK_URL,
		},
		(_accessToken, _refreshToken, profile, done) => {
			const user: Express.User = {
				id: profile.id,
				displayName: profile.displayName,
				email: profile.emails?.[0]?.value,
				photo: profile.photos?.[0]?.value,
			};

			done(null, user);
		},
	),
);

app.get("/api/health", (_req, res) => {
	res.json({ ok: true });
});

app.get(
	"/api/auth/google",
	passport.authenticate("google", {
		scope: ["profile", "email"],
		prompt: "select_account",
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

app.use((_req, res) => {
	res.status(404).json({
		error: "Not found",
	});
});

app.listen(PORT, () => {
	console.log(`Beam backend listening on http://localhost:${PORT}`);
});
