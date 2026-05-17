// import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			// We do detection ourselves in hooks.server.ts and the LanguageSwitcher.
			// Keep paraglide's built-ins minimal so we own the precedence
			// (URL ?lang= > cookie > Accept-Language > fr) and the URL stays
			// in query-string form rather than a path prefix.
			strategy: ['cookie', 'preferredLanguage', 'baseLocale'],
			cookieName: 'widget_lang'
		}),
		sveltekit()
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	server: {
		port: 8987,
		host: '0.0.0.0',
		allowedHosts: ['.e-table.co']
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
