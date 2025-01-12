declare global {
	namespace NodeJS {
		interface ProcessEnv {
			PORT: number;
			BETTER_AUTH_SECRET: string;
			BETTER_AUTH_URL: string;

			POSTGRES_PASSWORD: string;
			POSTGRES_USER: string;
			POSTGRES_DB: string;

			GITHUB_CLIENT_ID: string;
			GITHUB_CLIENT_SECRET: string;
		}
	}
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
