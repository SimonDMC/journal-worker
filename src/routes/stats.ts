import { Env } from '..';

export const statsHandle = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	return new Response('Hello World!');
};
