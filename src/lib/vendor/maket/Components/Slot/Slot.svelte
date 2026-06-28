<script lang="ts" generics="Payload extends Record<string, any>| undefined = undefined">
	import { type Slot } from './slot.js';
	import type { Snippet } from 'svelte';

	let {
		render,
		payload,
		class: className = '',
		children,
		style = '',
		attrs = {},
		props = {},
		as = 'div'
	}: {
		class?: string;
		as?: string;
		attrs?: Record<string, any>;
		payload?: Payload;
		children?: Snippet;
		style?: string;
		render?: Slot<{ payload: Payload } & Record<string, any>>;
		props?: Record<string, any>;
	} = $props();
</script>

{#snippet slot()}
	{#if typeof render === 'string'}
		{render}
	{:else}
		{@render render!({ ...props, payload: payload as Payload })}
	{/if}
{/snippet}

<!-- If no class is pass, we assume that we don't want to wrap it inside a div -->
{#if render}
	{#if !className && render}
		{@render slot()}
	{:else if render}
		<svelte:element this={as} {style} {...attrs} class={className}>
			{@render slot()}
		</svelte:element>
	{/if}
{:else if children}
	{#if className}
		<svelte:element this={as} {style} {...attrs} class={className}>
			{@render children()}
		</svelte:element>
	{:else}
		{@render children()}
	{/if}
{/if}
