import { createRPCClient } from 'svelte-rpc/client';
import type { API } from '$lib/server/rpc-router';
import type { Servers } from 'worker/src/index';
import { dev } from '$app/environment';
import { createClient } from 'flarepc/client';
import { get } from 'svelte/store';
import { page } from '$app/stores';

// Type-only import of the router shape. SvelteKit's $lib/server boundary
// enforcement is keyed on runtime imports — `import type` is erased at
// compile time, so referencing the router's type from this client module
// is safe. The runtime client only ever talks to /api over HTTP.

export const api = createRPCClient<API>({
	endpoint: '/api',
	headers: () => ({
		'X-RESTO': get(page).params.restaurantId || ''
	}),
	onError: (error) => {
		console.log(error);
	}
});

export const worker = createClient<Servers, 'admin'>({
	server: 'admin',
	includeCredentials: false,
	endpoint: dev ? 'http://localhost:8787' : 'https://worker.e-table.co'
});

export type Worker = typeof worker;
