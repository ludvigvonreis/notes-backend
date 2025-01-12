import { Hono } from "hono";
import type { Env, FailureApiResponse, SuccessApiResponse } from "../types.js";
import { sql } from "../index.js";
import { nanoid } from "nanoid";

export const userApp = new Hono<Env>();

userApp.get("/settings", async (c) => {
	try {
		const user = c.get("user");

		if (!user)
			throw {
				message: "Cannot access settings, you are unathenticated",
				code: 401,
			};

		const settings = await sql`
			SELECT settings
			FROM "user"
			WHERE id = ${user.id};
		`;

		return c.json({
			message: `Fetched settings for ${user.name}`,
			code: 0xbaeb,
			data: settings[0].settings,
		});
	} catch (error) {
		return c.json(error as FailureApiResponse);
	}
});

userApp.put("/settings", async (c) => {
	try {
		const user = c.get("user");

		if (!user)
			throw {
				message: "Cannot update settings, you are unathenticated",
				code: 401,
			};

		const settings = await c.req.json();

		await sql`
			UPDATE "user"
			SET settings = ${settings as any}::jsonb
			WHERE id = ${user.id};
		`;

		return c.json({
			message: `Updated settings for ${user.name}`,
			code: 0xbeeb,
			data: settings,
		});
	} catch (error) {
		return c.json(error as FailureApiResponse);
	}
});
