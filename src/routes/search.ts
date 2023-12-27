import { Env } from '..';

type Entry = {
	date: string;
	content: string;
};

export const searchHandle = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	// check for auth header
	const auth = request.headers.get('Authorization');

	// if not present, return 401
	if (!auth) {
		return new Response('Unauthorized', { status: 401 });
	}

	// get search query from URL
	const url = new URL(request.url);
	const query = url.searchParams.get('q');

	if (!query || query.length === 0 || query.length > 50) {
		return new Response('Bad request', { status: 400 });
	}

	// check if session exists
	const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ?').bind(auth).run();

	if (session.results.length === 0) {
		return new Response('Unauthorized', { status: 401 });
	}

	// get user_id from session
	const user_id = session.results[0].user_id;

	// get entries from database
	const entries = await env.DB.prepare('SELECT date, content FROM Entries WHERE user_id = ? AND content LIKE ?')
		.bind(user_id, `%${query}%`)
		.run();

	if (entries.results.length === 0) {
		return new Response('Not found', { status: 404 });
	}

	// add +- 20 characters to the search result
	let results = entries.results.map((e) => {
		const entry = e as Entry; // annoying typescript stuff
		const index = entry.content.toLowerCase().indexOf(query.toLowerCase());
		const start = Math.max(index - 20, 0);
		const end = Math.min(index + query.length + 20, entry.content.length);

		return {
			date: entry.date,
			content: entry.content.slice(start, end),
		};
	});

	return new Response(JSON.stringify(results), { status: 200 });
};
