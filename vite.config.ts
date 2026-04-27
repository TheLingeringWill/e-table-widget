// import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},

	server: {
		port: 8987
	},
	build: {
		rollupOptions: {
			external: ['cloudflare:sockets']
		}
	},
	resolve: {
		alias: {
			'.prisma/client/default': '@prisma/client'
		}
	}
});
