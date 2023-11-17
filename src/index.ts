import { statsHandle } from './routes/stats';

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

type Route = [method: string, path: RegExp, handler: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>];

const routes: Route[] = [
	['GET', /^.+\/stats$/, statsHandle],
	['GET', /^.+\/entry\/\d{4}-\d{2}-\d{2}$/, getEntryHandle],
	['POST', /^.+\/entry\/\d{4}-\d{2}-\d{2}$/, setEntryHandle],
	['POST', /^login$/, loginHandle],
	['POST', /^change-password$/, changePasswordHandle],
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
