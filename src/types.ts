import type { Session, User } from "better-auth";

export type Variables = {
	session: Session | null;
	user: User | null;
};

export type Env = {
	Variables: Variables;
};

export interface SuccessApiResponse {
	code?: number;
	message?: string;
	[key: string]: any;
}

export interface FailureApiResponse {
	message?: string;
	code: number;
}