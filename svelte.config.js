import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ out: 'build' }),
		version: {
			// Poll /_app/version.json in the background. When the build version
			// changes, SvelteKit flips `updated.current` to true (one-way). This
			// does NOT reload by itself — Widget.svelte reacts to the flag and
			// reloads. No-op under `vite dev`. version.name defaults to the build
			// timestamp, which changes every build.
			pollInterval: 60000
		}
	}
};

export default config;
