import { createRPCClient } from 'svelte-rpc/client';
import type { API } from './api';
import type { Servers } from 'worker/src/index';
import { dev } from '$app/environment';
import { createClient } from 'flarepc/client';
import { get } from 'svelte/store';
import { page } from '$app/stores';

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
