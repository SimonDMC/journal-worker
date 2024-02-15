import { Env } from '..';

export const getEntryHandle = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	// check for auth header
	const auth = request.headers.get('Authorization');

	// if not present, return 401
	if (!auth) {
		return new Response('Unauthorized', { status: 401 });
	}

	// check if session exists
	const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ?').bind(auth).all();

	if (session.results.length === 0) {
		return new Response('Unauthorized', { status: 401 });
	}

	// get user_id from session
	const user_id = session.results[0].user_id;

	// get date from URL
	const url = new URL(request.url);
	const date = url.pathname.split('/')[2];

	// get entry from database
	const entry = await env.DB.prepare('SELECT content, mood, location FROM Entries WHERE user_id = ? AND date = ?;')
		.bind(user_id, date)
		.all();

	if (entry.results.length === 0) {
		return new Response('{}', { status: 200 });
	}

	return new Response(JSON.stringify(entry.results[0]), { status: 200 });
};
