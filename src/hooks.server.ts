// import * as Sentry from '@sentry/sveltekit';
import * as vars from '$env/static/private';
import type { Handle, RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { stringify as devalueStringify, parse as devalueParse } from 'devalue';
import { router } from './api/api';
import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { createLocals } from 'shared/locals';
import type { IncomingRequestCfProperties } from '@cloudflare/workers-types';
import { createPrismaProxy } from 'prisma-shared/proxy';

// Sentry.init({
// 	dsn: 'https://c23af62b6c8f53b05af288bf5b08ac52@o4508850900893696.ingest.de.sentry.io/4508850921865296',
// 	tracesSampleRate: 1
// });

const corsHandle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/')) {
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': '*'
				}
			});
		}
	}

	const response = await resolve(event);
	if (event.url.pathname.startsWith('/api')) {
		response.headers.append('Access-Control-Allow-Origin', `*`);
	}
	return response;
};

// Hand-rolled dispatcher that replaces the legacy createRPCHandle. The
// wire format (POST /api/<method>, multipart/form-data with a devalue-encoded
// `value` field) is preserved so the existing client.ts (still using the
// /client subpath) keeps working without modification. PRD §0.4 item a
// requires no svelte-rpc import in widget source.
const RPC_ENDPOINT = '/api';

type FormDataResult = FormData;

const encodeFormResponse = (value: unknown): FormDataResult => {
	const fd = new FormData();
	const serialized = devalueStringify(value, {
		File: (v) => {
			if (v instanceof File) {
				fd.append(v.name, v);
				return v.name;
			}
		},
		URL: (v) => {
			if (v instanceof URL) return v.toString();
		}
	});
	fd.append('value', serialized);
	return fd;
};

const decodeFormRequest = (fd: FormData): unknown => {
	const raw = fd.get('value');
	if (typeof raw !== 'string') return undefined;
	return devalueParse(raw, {
		File: (n) => fd.get(String(n)),
		URL: (s) => new URL(String(s))
	});
};

const validate = async <S extends { '~standard': { validate: (v: unknown) => unknown } }>(
	schema: S | undefined,
	input: unknown
) => {
	if (schema === undefined) return input;
	let result: unknown = schema['~standard'].validate(input);
	if (result instanceof Promise) result = await result;
	const r = result as { issues?: unknown; value?: unknown };
	if (r.issues) {
		throw new Error(JSON.stringify(r.issues, null, 2));
	}
	return r.value;
};

const rpcHandle: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith(RPC_ENDPOINT + '/')) {
		return resolve(event);
	}
	const method = event.url.pathname.slice(RPC_ENDPOINT.length + 1).split('/')[0];
	const handler = (router as Record<string, { schema?: unknown; call: (e: RequestEvent, input: unknown) => Promise<unknown> }>)[method];
	if (!handler) {
		return new Response('NOT_FOUND', { status: 404 });
	}
	try {
		const fd = await event.request.formData();
		const raw = decodeFormRequest(fd);
		const input = await validate(handler.schema as never, raw);
		const result = await handler.call(event, input);
		const responseFd = encodeFormResponse(result);
		return new Response(responseFd);
	} catch (err) {
		console.error('[rpcHandle] error in', method, err);
		return new Response(JSON.stringify({ message: (err as Error).message ?? 'unknown' }), {
			status: 500,
			headers: { 'content-type': 'application/json' }
		});
	}
};

export const handle: Handle = sequence(
	// Sentry.sentryHandle(),
	corsHandle,
	async ({ event, resolve }) => {
		const prisma = createPrismaProxy(dev);
		const localsParams = {
			dev,
			vars,
			platform: event.platform,
			request: event.request,
			params: event.params,
			origin: 'WIDGET'
		} as const;

		const { locals } = await createLocals(localsParams, prisma);

		Object.assign(event.locals, locals);

		if (!locals.restaurantId || (!locals.restaurant && !event.url.pathname.startsWith('/tests') && !event.url.pathname.startsWith('/test-api'))) {
			throw error(404, 'Restaurant not found');
		}

		event.locals.countryCode =
			(event.request as Request & { cf: IncomingRequestCfProperties })?.cf?.country || 'FR';

		return resolve(event);
	},
	rpcHandle
);

// export const handleError = Sentry.handleErrorWithSentry();
