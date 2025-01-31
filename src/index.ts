import { serve } from "@hono/node-server";
import * as dotenv from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./auth.js";
import type { Env } from "./types.js";
import postgres from "postgres";
import { notesApp } from "./routes/notes.js";
import { userApp } from "./routes/user.js";
dotenv.config();

const app = new Hono<Env>().basePath("/api");

export const sql = postgres({
	host: process.env.PGHOST,
	port: 5432,
	user: process.env.PGUSER,
	password: process.env.PGPASSWORD,
	database: process.env.PGDATABASE,
	ssl: "allow"
});

// ---- Middleware ----
app.use(logger());
app.use(
	"*",
	cors({
		origin: (origin) => {
			const allowedOrigins = [
			  "http://localhost:3000", // Local dev
			  "https://localhost:3000", // Deployed frontend
			];
			if (!origin || allowedOrigins.includes(origin)) {
			  return origin; // Allow specific origins
			}
			return ""; // Block other origins (prevents wildcard issues)
		  },
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	})
);
app.on(["POST", "GET"], "/auth/**", (c) => auth.handler(c.req.raw));
app.use("*", async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		c.set("user", null);
		c.set("session", null);
		return next();
	}
	c.set("user", session.user);
	c.set("session", session.session);
	return next();
});



// ---- Routes -----

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.route("/notes", notesApp);
app.route("/user", userApp);

// ----------

const port = Number(process.env.PORT);
console.log(`Server is running on http://localhost:${port}`);

serve({
	fetch: app.fetch,
	port,
});