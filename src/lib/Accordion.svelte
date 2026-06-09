<script lang="ts">
	import { CaretDown } from 'phosphor-svelte';
	import { onMount, type Snippet } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import Spinner from './Spinner.svelte';

	let {
		icon: Icon,
		title,
		children,
		contentClass = '',
		isOpen = false,
		loading = false,
		disabled = false,
		onToggle = (isOpen: boolean) => {},
		onOpen = () => {},
		onClose = () => {}
	} = $props<{
		icon?: any;
		title: string | Snippet;
		contentClass?: string;
		isOpen?: boolean;
		loading?: boolean;
		disabled?: boolean;
		onToggle?: (isOpen: boolean) => void;
		onOpen?: () => void;
		onClose?: () => void;
		children: Snippet;
	}>();

	onMount(() => {
		if (isOpen) onOpen();
	});
</script>

<div class="accordion-row relative" data-open={isOpen}>
	<div class="px-2 py-1">
		<button
			class="accordion-header flex items-center justify-between p-2 rounded cursor-pointer w-full disabled:cursor-not-allowed"
			{disabled}
			onclick={() => {
				if (disabled) return;
				isOpen = !isOpen;
				onToggle(isOpen);
				if (isOpen) onOpen();
				else onClose();
			}}
		>
			<div class="flex items-center gap-2">
				{#if Icon}
					<Icon size="24" />
				{/if}
				<span class="font-semibold text-base" transition:fade>{title}</span>
				{#if loading && !isOpen}
					<div class="flex items-center" transition:fade>
						<Spinner size={24} width={3} />
					</div>
				{/if}
			</div>
			<CaretDown size="24" class="transition-all {isOpen ? 'rotate-180' : ''}" />
		</button>
	</div>
	{#if isOpen}
		<div transition:slide>
			{#if loading}
				<div class="flex items-center justify-center p-10" transition:slide>
					<Spinner />
				</div>
			{:else}
				<div transition:slide class={contentClass}>
					{@render children()}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Open/hover tints follow the (theme-driven) foreground via currentColor, so
	   they read on a light brand surface too — the old hardcoded `bg-white`
	   tints were invisible on a light brand. */
	.accordion-row[data-open='true'] {
		background-color: color-mix(in srgb, currentColor 5%, transparent);
	}
	.accordion-header:not(:disabled):hover {
		background-color: color-mix(in srgb, currentColor 6%, transparent);
	}
	/* An inactive (not-yet-available) step is dimmed, but only lightly — at the
	   old opacity-50 the black text washed out to grey on a light brand. */
	.accordion-header:disabled {
		opacity: 0.7;
	}
</style>
