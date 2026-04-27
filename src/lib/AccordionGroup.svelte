<script lang="ts">
	import type { Snippet } from 'svelte';
	import Accordion from './Accordion.svelte';

	type Item = {
		id?: string;
		icon: any;
		title: string;
		contentClass?: string;
		disabled?: boolean;
		loading?: boolean;
		onOpen?: () => void;
		onClose?: () => void;
	};

	let {
		items,
		oneAtATime = false,
		content,
		separator,
		openedAccordion = $bindable(null),
		className
	} = $props<{
		items: Item[];
		oneAtATime?: boolean;
		openedAccordion?: number | null;
		content: Snippet<[Item, Function, Function, Function]>;
		separator: Snippet;
		className?: string;
	}>();

	const next = () => {
		openedAccordion =
			openedAccordion === items.length - 1 ? 0 : openedAccordion !== null ? openedAccordion + 1 : 0;
	};
	const previous = () => {
		openedAccordion =
			openedAccordion === 0
				? items.length - 1
				: openedAccordion !== null
					? openedAccordion - 1
					: items.length - 1;
	};
	const close = () => {
		openedAccordion = null;
	};
</script>

<div class="flex flex-col {className ?? ''}">
	{#each items as item, i (i)}
		<Accordion
			icon={item.icon}
			title={item.title}
			contentClass={item.contentClass}
			disabled={item.disabled}
			loading={item.loading}
			onToggle={(isOpen) => {
				if (oneAtATime) {
					openedAccordion = isOpen ? i : null;
				}
			}}
			onOpen={item.onOpen}
			onClose={item.onClose}
			isOpen={openedAccordion === i}
		>
			{@render content(item, next, previous, close)}
		</Accordion>
		{#if i < items.length - 1}
			{@render separator()}
		{/if}
	{/each}
</div>
