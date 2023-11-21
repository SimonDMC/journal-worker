import { Env } from '..';

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

	return new Response(JSON.stringify(entries.results), { status: 200 });
};
