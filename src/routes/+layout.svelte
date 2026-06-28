<script lang="ts">
	import Theme from '$lib/vendor/maket/Components/Theme.svelte';
	import '../app.css';
	import { initLocale } from '$lib/states/locale.svelte';

	let { children, data } = $props();

	// Seed the client-side locale store from the server-detected value so the
	// first client render (and Paraglide's client runtime) matches SSR. Done
	// inline (not in onMount) so $derived bindings already reflect the right
	// locale on the initial paint.
	initLocale(data.locale);
</script>

<svelte:head>
	{@html `
	<s${'cript'}>
		if(typeof __name=== "undefined"){
		var __defProp = Object.defineProperty;
        var __name = (target, value) => __defProp(target, \'name\', { value, configurable: true });
        window.__name = __name;
		}
	</s${'cript'}>

	`}
</svelte:head>

<Theme
	defaultTheme={{
		colorScheme: 'light',
		name: 'light'
	}}
>
	{@render children()}
</Theme>
