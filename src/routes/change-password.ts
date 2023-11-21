import { Env } from '..';
import bcrypt from 'bcryptjs';

type RequestContent = {
	username: string;
	oldPassword: string;
	newPassword: string;
};

export const changePasswordHandle = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	let body: RequestContent;
	try {
		body = (await request.json()) as RequestContent;
	} catch (e) {
		return new Response('Bad request', { status: 400 });
	}

	if (!body.username || !body.oldPassword || !body.newPassword) {
		return new Response('Bad request', { status: 400 });
	}

	const username = body.username;
	const oldPassword = body.oldPassword;
	const newPassword = body.newPassword;

	// check if valid login
	const user = await env.DB.prepare('SELECT password, id FROM Users WHERE username = ?').bind(username).run();

	if (user.results.length === 0) {
		return new Response('Unauthorized', { status: 401 });
	}

	if (!(await bcrypt.compare(oldPassword, user.results[0].password as string))) {
		return new Response('Unauthorized', { status: 401 });
	}

	// get user_id from user query
	const user_id = user.results[0].id;

	// clear all sessions
	await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user_id).run();

	// change password in database
	await env.DB.prepare('UPDATE Users SET password = ? WHERE id = ?')
		.bind(await bcrypt.hash(newPassword, 10), user_id)
		.run();

	return new Response('OK', { status: 200 });
};
