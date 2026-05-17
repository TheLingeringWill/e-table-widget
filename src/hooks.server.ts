import type { Handle, RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { stringify as devalueStringify, parse as devalueParse } from 'devalue';
import { AsyncLocalStorage } from 'node:async_hooks';
import { router } from '$lib/server/rpc-router';
import { pickLocale } from '$lib/i18n/detect';
import * as paraglideRuntime from '$lib/paraglide/runtime';

// Initialize Paraglide's per-request locale store ONCE. Without this, the
// runtime falls back to the module-global `overwriteGetLocale`, which leaks
// across concurrent requests — e.g. three iframes loaded at once on the same
// parent page would all render in whichever locale resolved last.
// We read `paraglideRuntime.serverAsyncLocalStorage` via namespace access (not
// a named import) so we always see the live binding, even when bundlers
// snapshot named imports at module load.
if (!paraglideRuntime.serverAsyncLocalStorage) {
	paraglideRuntime.overwriteServerAsyncLocalStorage(new AsyncLocalStorage());
}

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
// `value` field) is preserved so widget-rpc-client.ts can speak the same
// protocol without a runtime dependency on svelte-rpc. PRD §0.4 item a
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
	const handler = (
		router as Record<
			string,
			{ schema?: unknown; call: (e: RequestEvent, input: unknown) => Promise<unknown> }
		>
	)[method];
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

// Country code lookup: previously sourced from Cloudflare's `cf.country` (only
// available under adapter-cloudflare). On ECS+ALB, neither is present, so we
// fall back to common upstream geo headers (CloudFront and a custom override).
// ALB does not inject geo headers itself — `locals.countryCode` will be null
// in staging/prod until/unless we put CloudFront (or another geo-aware edge)
// in front of the widget.
const localsHandle: Handle = async ({ event, resolve }) => {
	const country =
		event.request.headers.get('cloudfront-viewer-country') ??
		event.request.headers.get('x-country') ??
		null;
	(event.locals as { countryCode: string | null }).countryCode = country;
	return resolve(event);
};

// Locale detection: ?lang= > widget_lang cookie > Accept-Language > 'fr'.
// We persist explicit user choice (URL override) to the cookie with
// iframe-friendly attributes (SameSite=None + Secure) so the widget keeps
// the language across reloads when embedded on a third-party origin.
// We then run `resolve()` inside Paraglide's AsyncLocalStorage so `m.*()`
// reads the right locale during SSR — without leaking across concurrent
// requests (which `overwriteGetLocale` would).
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~400 days, mirrors Paraglide default

const localeHandle: Handle = async ({ event, resolve }) => {
	const { locale, urlOverride } = pickLocale({
		url: event.url,
		cookieValue: event.cookies.get('widget_lang'),
		acceptLanguage: event.request.headers.get('accept-language')
	});

	event.locals.locale = locale;

	// Persist explicit user choice (only when ?lang= was set to a supported value).
	if (urlOverride && urlOverride !== event.cookies.get('widget_lang')) {
		event.cookies.set('widget_lang', urlOverride, {
			path: '/',
			sameSite: 'none',
			secure: true,
			httpOnly: false,
			maxAge: COOKIE_MAX_AGE
		});
	}

	const render = () =>
		resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});

	const store = paraglideRuntime.serverAsyncLocalStorage;
	return store
		? store.run({ locale, origin: event.url.origin, messageCalls: undefined }, render)
		: render();
};

export const handle: Handle = sequence(corsHandle, localsHandle, localeHandle, rpcHandle);
