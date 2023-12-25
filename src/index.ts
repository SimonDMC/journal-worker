import { bootstrapHandle } from './routes/bootstrap';
import { changePasswordHandle } from './routes/change-password';
import { getEntryHandle } from './routes/get-entry';
import { loginHandle } from './routes/login';
import { searchHandle } from './routes/search';
import { setEntryHandle } from './routes/set-entry';
import { overviewHandle } from './routes/overview';

export interface Env {
	DB: D1Database;
}

type Route = [method: string, path: RegExp, handler: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>];

const routes: Route[] = [
	['GET', /^\/overview$/, overviewHandle],
	['GET', /^\/bootstrap$/, bootstrapHandle],
	['GET', /^\/search$/, searchHandle],
	['GET', /^\/entry\/\d{4}-\d{2}-\d{2}$/, getEntryHandle],
	['POST', /^\/entry\/\d{4}-\d{2}-\d{2}$/, setEntryHandle],
	['POST', /^\/login$/, loginHandle],
	['POST', /^\/change-password$/, changePasswordHandle],
];

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		let response;

		// find route by method and path
		const route = routes.find(([m, p]) => m === method && p.test(path));
		const preflight = routes.find(([m, p]) => p.test(path));
		if (route) {
			// execute route handler and await the response
			response = await route[2](request, env, ctx);
		} else if (preflight && method === 'OPTIONS') {
			// accept preflight requests
			response = new Response(null, { status: 204 });
		} else {
			response = new Response('Not found', { status: 404 });
		}

		// append CORS headers
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

		return response;
	},
};
