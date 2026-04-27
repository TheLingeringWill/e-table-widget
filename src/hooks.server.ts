// import * as Sentry from '@sentry/sveltekit';
import * as vars from '$env/static/private';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createRPCHandle } from 'svelte-rpc';
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
	createRPCHandle({ router, endpoint: '/api', localsApiKey: 'api' })
);

// export const handleError = Sentry.handleErrorWithSentry();
