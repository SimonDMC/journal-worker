import { Env } from '..';

type RequestContent = {
	content: string;
	mood?: number;
	location?: string;
};

export const setEntryHandle = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	// check for auth header
	const auth = request.headers.get('Authorization');

	// if not present, return 401
	if (!auth) {
		return new Response('Unauthorized', { status: 401 });
	}

	// check if session exists
	const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ?').bind(auth).run();

	if (session.results.length === 0) {
		return new Response('Unauthorized', { status: 401 });
	}

	// get user_id from session
	const user_id = session.results[0].user_id;

	// get date from URL
	const url = new URL(request.url);
	const date = url.pathname.split('/')[2];

	// get content from request body
	let body: RequestContent;
	try {
		body = (await request.json()) as RequestContent;
	} catch (e) {
		return new Response('Bad request', { status: 400 });
	}

	if (!body.content) {
		return new Response('Bad request', { status: 400 });
	}

	let content = body.content;
	let mood = body.mood ?? null;
	let location = body.location ?? null;

	// get entry for today if it exists
	const entry = await env.DB.prepare('SELECT id FROM Entries WHERE user_id = ? AND date = ?;').bind(user_id, date).run();

	if (entry.results.length === 0) {
		// add entry if it doesn't exist
		await env.DB.prepare('INSERT INTO Entries (user_id, date, content, word_count, mood, location) VALUES (?, ?, ?, ?, ?, ?);')
			.bind(user_id, date, content, content.split(' ').length, mood, location)
			.run();
	} else {
		// update entry if it does exist
		await env.DB.prepare(
			'UPDATE Entries SET content = ?, word_count = ?, mood = ?, location = ?, last_modified = ? WHERE user_id = ? AND date = ?;'
		)
			.bind(content, content.split(' ').length, mood, location, new Date().toISOString(), user_id, date)
			.run();
	}

	return new Response('OK', { status: 200 });
};
