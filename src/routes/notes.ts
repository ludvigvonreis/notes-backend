import { Hono } from "hono";
import type { Env, FailureApiResponse, SuccessApiResponse } from "../types.js";
import { sql } from "../index.js";
import { nanoid } from "nanoid";

export const notesApp = new Hono<Env>();

interface Note {
	note_id: string;
	notebook_id: string;
	user_id: string;
	title: string;
	content: string;
	is_archived: boolean;
	created_at: Date;
	updated_at: Date;

	notebook_name: string;
}

interface Notebook {
	notebook_id: string;
	user_id: string;
	name: string;
	created_at: Date;
	updated_at: Date;
	default: boolean;
}

notesApp.get("/", async (c) => {
	try {
		const user = c.get("user");

		if (!user)
			throw {
				message: "Cannot access notes, you are unathenticated",
				code: 401,
			};

		const notes = await sql<Note[]>`
			SELECT notes.*, notebooks.name as notebook_name
			FROM notes
			JOIN notebooks ON notes.notebook_id = notebooks.notebook_id
			WHERE notes.user_id = ${user.id}
			ORDER BY notes.updated_at DESC;
		`;

		const notesWithContent = notes.map((note) => ({
			...note,
			content:
				typeof note.content === "string"
					? JSON.parse(note.content)
					: note.content,
		}));

		return c.json({
			message: `Fetched all notes from ${user.name}`,
			code: 0xbeeb,
			data: notesWithContent,
		} as SuccessApiResponse);
	} catch (error: any) {
		if (error.message && error.code) {
			return c.json(
				{ message: error.message } as FailureApiResponse,
				error.code
			);
		} else {
			return c.json({ message: String(error) }, 500);
		}
	}
});

notesApp.get("/:noteId", async (c) => {
	try {
		const user = c.get("user");
		const noteId = c.req.param("noteId");

		if (!user)
			throw {
				message: "Cannot access notes, you are unathenticated",
				code: 401,
			};

		const note = await sql<Note[]>`
			SELECT notes.*, notebooks.name as notebook_name
			FROM notes
			JOIN notebooks ON notes.notebook_id = notebooks.notebook_id
			WHERE notes.user_id = ${user.id}
			AND notes.note_id = ${noteId};
		`;

		if (note.length === 0) throw { message: "Note not found", code: 404 };

		return c.json({
			message: `Fetched note with id ${noteId} from ${user.name}`,
			code: 0xb00b,
			data: {
				...note[0],
				content:
					typeof note[0].content === "string"
						? JSON.parse(note[0].content)
						: note[0].content,
			},
		} as SuccessApiResponse);
	} catch (error: any) {
		if (error.message && error.code) {
			return c.json(
				{ message: error.message } as FailureApiResponse,
				error.code
			);
		} else {
			return c.json({ message: String(error) }, 500);
		}
	}
});

notesApp.put("/:noteId", async (c) => {
	try {
		const user = c.get("user");

		if (!user)
			throw {
				message: "Cannot edit notes, you are unathenticated",
				code: 401,
			};

		const noteId = c.req.param("noteId");

		const { title, content, is_archived } = await c.req.json<
			Partial<Note>
		>();

		const existingNote = await sql<Note[]>`
			SELECT * FROM notes
			WHERE note_id = ${noteId}
			AND user_id = ${user.id}
		`;

		if (existingNote.length === 0)
			throw { message: "Note not found or not authorized", code: 404 };

		const updatedNote = await sql<Note[]>`
			UPDATE notes
			SET title = ${title ?? existingNote[0].title}, 
				content = ${content ?? existingNote[0].content}, 
				is_archived = ${is_archived ?? existingNote[0].is_archived}, 
				updated_at = NOW()
			WHERE note_id = ${noteId}
			AND user_id = ${user.id}
			RETURNING *
		`;

		return c.json({
			message: `Updated note with id ${noteId}`,
			code: 0xcafe,
			data: updatedNote[0],
		} as SuccessApiResponse);
	} catch (error: any) {
		if (error.message && error.code) {
			return c.json(
				{ message: error.message } as FailureApiResponse,
				error.code
			);
		} else {
			return c.json({ message: String(error) }, 500);
		}
	}
});

notesApp.post("/", async (c) => {
	try {
		const user = c.get("user");

		if (!user)
			throw {
				message: "Cannot create notes, you are unathenticated",
				code: 401,
			};

		const { title, is_archived } = await c.req.json<Partial<Note>>();

		// Get default notebook. Should always be one.
		const notebook = await sql<Notebook[]>`
			SELECT * 
			FROM notebooks
			WHERE user_id = ${user.id} AND
			"default" = TRUE;
		`;

		if (notebook.length === 0) {
			throw {
				message: "Default notebook not found. Create one first",
				code: 404,
			};
		}

		const newNote = await sql<Note[]>`
			INSERT INTO notes
				(note_id, notebook_id, user_id, title, content, is_archived, created_at, updated_at)
			VALUES
				(
					${nanoid()}, 
					${notebook[0].notebook_id}, 
					${user.id}, 
					${title || "Untitled Note"}, 
					'{}', 
					${is_archived || false}, 
					NOW(), 
					NOW()
				)
			RETURNING *;
		`;

		return c.json({
			message: "Note created",
			code: 0xdead,
			data: newNote[0],
		} as SuccessApiResponse);
	} catch (error: any) {
		if (error.message && error.code) {
			return c.json(
				{ message: error.message } as FailureApiResponse,
				error.code
			);
		} else {
			return c.json({ message: String(error) }, 500);
		}
	}
});

notesApp.delete("/:noteId", async (c) => {
	try {
		const user = c.get("user");

		if (!user)
			throw {
				message: "Cannot delete notes, you are unathenticated",
				code: 401,
			};

		const noteId = c.req.param("noteId");

		const existingNote = await sql<Note[]>`
			SELECT * FROM notes
			WHERE note_id = ${noteId}
			AND user_id = ${user.id}
		`;

		if (existingNote.length === 0)
			throw { message: "Note not found or not authorized", code: 404 };

		await sql`
			DELETE FROM notes
			WHERE note_id = ${noteId}
			AND user_id = ${user.id};
		`;

		return c.json({
			message: `Deleted note with id ${noteId}`,
			code: 0xdead,
		} as SuccessApiResponse);
	} catch (error: any) {
		if (error.message && error.code) {
			return c.json(
				{ message: error.message } as FailureApiResponse,
				error.code
			);
		} else {
			return c.json({ message: String(error) }, 500);
		}
	}
});