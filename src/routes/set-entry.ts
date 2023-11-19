import { Env } from '..';

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
	const content = await request.text();

	// get entry for today if it exists
	const entry = await env.DB.prepare('SELECT id FROM Entries WHERE user_id = ? AND date = ?;').bind(user_id, date).run();

	if (entry.results.length === 0) {
		// add entry if it doesn't exist
		await env.DB.prepare('INSERT INTO Entries (user_id, date, content, word_count) VALUES (?, ?, ?, ?);')
			.bind(user_id, date, content, content.split(' ').length)
			.run();
	} else {
		// update entry if it does exist
		await env.DB.prepare('UPDATE Entries SET content = ?, word_count = ?, last_modified = ? WHERE user_id = ? AND date = ?;')
			.bind(content, content.split(' ').length, new Date().toISOString(), user_id, date)
			.run();
	}

	return new Response('OK', { status: 200 });
};
