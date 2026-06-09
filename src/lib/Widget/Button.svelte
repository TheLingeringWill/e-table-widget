<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		onclick,
		children,
		revert = false,
		type = 'button',
		className = '',
		disabled = false,
		...restProps
	}: {
		onclick?: () => void;
		children: Snippet;
		id?: string;
		title?: string;
		disabled?: boolean;
		revert?: boolean;
		type?: string;
		className?: string;
	} = $props();
</script>

<button
	id="button"
	class="flex items-center gap-2 transition-all w-full text-center py-3 border text-sm font-semibold justify-center hover:brightness-90 focus:brightness-75 {revert
		? 'revert'
		: ''} {className} disabled:cursor-not-allowed disabled:opacity-70"
	{onclick}
	{disabled}
	{...restProps}
>
	{@render children()}
</button>
