<script lang="ts">
	import Theme from 'maket/Theme';
	import '../app.css';
	let { children } = $props();
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
