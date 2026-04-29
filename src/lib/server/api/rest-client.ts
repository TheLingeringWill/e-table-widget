// Server-only. Thin fetch wrapper for the REST API at PUBLIC_API_URL.
// Auth: X-API-Key carrying WIDGET_API_SECRET (PRD §6.1).
// Read in widget/src/lib/server/** only — $env/static/private enforces the boundary.

import { WIDGET_API_SECRET } from '$env/static/private';
import { PUBLIC_API_URL } from '$env/static/public';
import type { ApiErrorResult } from './types';

export type RestClientOptions = {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	query?: Record<string, string | number | undefined>;
	body?: unknown;
	restaurantId: number;
};

export type RestResult<T> = { ok: true; data: T } | ({ ok: false } & ApiErrorResult);

const baseUrl = (() => {
	const raw = PUBLIC_API_URL?.replace(/\/+$/, '') ?? '';
	if (!raw) {
		throw new Error('PUBLIC_API_URL is not set');
	}
	return raw;
})();

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
	const url = new URL(`${baseUrl}${path}`);
	if (query) {
		for (const [k, v] of Object.entries(query)) {
			if (v === undefined) continue;
			url.searchParams.set(k, String(v));
		}
	}
	return url.toString();
}

export async function restCall<T>(path: string, opts: RestClientOptions): Promise<RestResult<T>> {
	const method = opts.method ?? 'GET';
	const headers: Record<string, string> = {
		'X-API-Key': WIDGET_API_SECRET,
		'X-Restaurant-Id': String(opts.restaurantId)
	};
	if (opts.body !== undefined) {
		headers['Content-Type'] = 'application/json';
	}
	const res = await fetch(buildUrl(path, opts.query), {
		method,
		headers,
		body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
	});
	if (res.status >= 500) {
		throw new Error(`REST ${method} ${path} failed: ${res.status} ${res.statusText}`);
	}
	if (res.status >= 400) {
		let payload: { code?: string; message?: string } = {};
		try {
			payload = (await res.json()) as { code?: string; message?: string };
		} catch {
			// non-JSON 4xx (rare) — fall through to a generic shape
		}
		return {
			ok: false,
			error: {
				code: payload.code ?? `http_${res.status}`,
				message: payload.message ?? res.statusText
			}
		};
	}
	if (res.status === 204) {
		return { ok: true, data: undefined as unknown as T };
	}
	const data = (await res.json()) as T;
	return { ok: true, data };
}
