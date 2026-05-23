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

<div class="relative {isOpen ? 'bg-white bg-opacity-5' : ''}">
	<div class="px-2 py-1">
		<button
			class="flex items-center justify-between p-2 rounded hover:bg-white hover:bg-opacity-5 cursor-pointer w-full disabled:cursor-not-allowed disabled:opacity-50"
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
