import { bootstrapHandle } from './routes/bootstrap';
import { getEntryHandle } from './routes/get-entry';
import { loginHandle } from './routes/login';
import { setEntryHandle } from './routes/set-entry';
import { statsHandle } from './routes/stats';

export interface Env {
	DB: D1Database;
}

type Route = [method: string, path: RegExp, handler: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>];

const routes: Route[] = [
	['GET', /^\/stats$/, statsHandle],
	['GET', /^\/bootstrap$/, bootstrapHandle],
	//['GET', /^.+\/search$/, searchHandle],
	['GET', /^\/entry\/\d{4}-\d{2}-\d{2}$/, getEntryHandle],
	['POST', /^\/entry\/\d{4}-\d{2}-\d{2}$/, setEntryHandle],
	['POST', /^\/login$/, loginHandle],
	//['POST', /^\/change-password$/, changePasswordHandle],
];

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		// find route by method and path
		const route = routes.find(([m, p]) => m === method && p.test(path));
		if (!route) {
			return new Response('Not found', { status: 404 });
		}

		// execute route handler and await the response
		const response = await route[2](request, env, ctx);

		// append CORS headers
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

		return response;
	},
};
