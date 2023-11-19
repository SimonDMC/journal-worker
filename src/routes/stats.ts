import { Env } from '..';

type Row = {
	word_count: number;
	date: string;
	tag: string;
};

type Stats = {
	totalWords: number;
	entries: {
		[date: string]: {
			tags: string[];
		};
	};
};

export const statsHandle = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	// check for auth header
	const auth = request.headers.get('Authorization');

	// if not present, return 401
	if (!auth) {
		return new Response('Unauthorized', { status: 401 });
	}

	// get username from URL
	const url = new URL(request.url);
	const username = url.pathname.split('/')[1];

	// check if session exists
	const session = await env.DB.prepare('SELECT * FROM sessions WHERE token = ? AND user_id = (SELECT id FROM users WHERE username = ?)')
		.bind(auth, username)
		.run();

	if (session.results.length === 0) {
		return new Response('Unauthorized', { status: 401 });
	}

	// get data from database
	const data = await env.DB.prepare(
		'SELECT E.word_count, E.date, T.name AS tag FROM Users U JOIN Entries E ON U.id = E.user_id LEFT JOIN Tags T ON E.id = T.entry_id WHERE U.username = ? GROUP BY U.username, E.id, T.name ORDER BY E.id;'
	)
		.bind(username)
		.run();

	// get into result format
	const stats = {
		totalWords: 0,
		entries: {},
	} as Stats;

	for (const row of data.results as Row[]) {
		const entry = stats.entries[row.date] || { tags: [] };
		if (row.tag) entry.tags.push(row.tag);
		stats.entries[row.date] = entry;
		stats.totalWords += row.word_count;
	}

	return new Response(JSON.stringify(stats), { status: 200 });
};
