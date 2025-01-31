import { betterAuth } from "better-auth";
import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

export const auth = betterAuth({
	database: new pg.Pool({
		host: process.env.PGHOST,
		port: 5432,
		user: process.env.PGUSER,
		password: process.env.PGPASSWORD,
		database: process.env.PGDATABASE,
		ssl: {
			rejectUnauthorized: false,
		}
	}),
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID ?? "",
			clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
		},
	},
	basePath: "/api/auth",
	trustedOrigins: ["https://notes-frontend-jyzf.onrender.com"],
	// advanced: {
	// 	crossSubDomainCookies: {
	// 		enabled: true,
	// 		domain: "localhost"
	// 	},
	// 	cookies: {
	// 		session_token: {
	// 			attributes: {
	// 				httpOnly: true,
	// 				secure: true,
	// 				sameSite: "none",
	// 				path: "/",	
	// 			}
	// 		}
	// 	}
	// }
});
