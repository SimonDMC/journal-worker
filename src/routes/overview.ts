import { Env } from '..';

type Row = {
	word_count: number;
	date: string;
	tag: string;
};

type Stats = {
	totalWords: number;
	entries: string[];
};

export const overviewHandle = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
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

	// get data from database
	const data = await env.DB.prepare(
		'SELECT E.word_count, E.date FROM Users U JOIN Entries E ON U.id = E.user_id WHERE U.id = ? ORDER BY E.date;'
	)
		.bind(user_id)
		.all();

	// get into result format
	const stats = {
		totalWords: 0,
		entries: [],
	} as Stats;

	for (const row of data.results as Row[]) {
		stats.entries.push(row.date);
		stats.totalWords += row.word_count;
	}

	return new Response(JSON.stringify(stats), { status: 200 });
};
