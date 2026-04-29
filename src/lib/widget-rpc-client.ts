import { stringify as devalueStringify, parse as devalueParse } from 'devalue';
import { get } from 'svelte/store';
import { page } from '$app/stores';
import type { router as Router } from '$lib/server/rpc-router';

// PRD §0.4 item a: no `svelte-rpc` imports anywhere in widget source
// (including subpaths like `svelte-rpc/client`). The previous client used
// `createRPCClient` from svelte-rpc and `createClient` from flarepc; the
// hand-rolled dispatcher in hooks.server.ts (devalue-encoded multipart over
// POST /api/<method>) is now the wire format both ends speak. This module
// reproduces the legacy `[result, error]` tuple-returning shape that the UI
// components consume so callers do not change.

type Procedure = {
	call: (event: unknown, input: unknown) => Promise<unknown>;
};

// Static-typing surface: the router's method names + their input/output
// types, derived from the server module via `import type`. The runtime
// client never imports the server module — it only ever speaks HTTP.
type RouterShape = typeof Router;
type ApiClient = {
	[K in keyof RouterShape]: RouterShape[K] extends Procedure
		? (
				input: Parameters<RouterShape[K]['call']>[1]
			) => Promise<[Awaited<ReturnType<RouterShape[K]['call']>>, undefined] | [undefined, Error]>
		: never;
};

const encodeFormRequest = (value: unknown): FormData => {
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

const decodeFormResponse = async (response: Response): Promise<unknown> => {
	const fd = await response.formData();
	const raw = fd.get('value');
	if (typeof raw !== 'string') return undefined;
	return devalueParse(raw, {
		File: (n) => fd.get(String(n)),
		URL: (s) => new URL(String(s))
	});
};

const callRpc = async (method: string, input: unknown): Promise<[unknown, Error | undefined]> => {
	try {
		const restaurantId = get(page).params.restaurantId || '';
		const response = await fetch(`/api/${method}`, {
			method: 'POST',
			body: encodeFormRequest(input),
			headers: {
				'X-RESTO': restaurantId
			}
		});
		if (!response.ok) {
			let message = `HTTP ${response.status}`;
			try {
				const body = (await response.json()) as { message?: string };
				if (body.message) message = body.message;
			} catch {
				// Non-JSON body; keep the HTTP status as the message.
			}
			return [undefined, new Error(message)];
		}
		const data = await decodeFormResponse(response);
		return [data, undefined];
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('[widget-rpc-client]', method, error);
		return [undefined, error];
	}
};

export const api = new Proxy({} as ApiClient, {
	get(_target, prop: string) {
		return (input: unknown) => callRpc(prop, input);
	}
});
