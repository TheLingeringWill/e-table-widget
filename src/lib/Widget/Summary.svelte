<script lang="ts">
	import { getTranslation, useWidget } from '$lib/context.svelte';
	import { gotoSelection, selection } from '$lib/states/selection.svelte';
	import { step } from '$lib/states/step.svelte';
	import { formatSlotDate } from '$lib/utils/slotFormat';
	import { Calendar, CallBell, Clock, ForkKnife, PencilSimple } from 'phosphor-svelte';
	import { onDestroy, onMount } from 'svelte';

	const widget = useWidget();

	let mounted = $state(false);
	let showSummary = $state(false);
	let observer = $state<IntersectionObserver | null>(null);

	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				if (!mounted) return;
				for (let entry of entries) {
					if (entry.isIntersecting) {
						showSummary = false;
					} else {
						showSummary = true;
					}
				}
			},
			{
				threshold: 0.5
			}
		);

		setTimeout(() => {
			const elem = document.querySelector('#summary');
			if (elem) {
				observer?.observe(elem);
			} else {
				// showSummary = true;
			}
		}, 1000);

		mounted = true;
	});

	onDestroy(() => {
		observer?.disconnect();
		showSummary = false;
	});

	const disabled = $derived(step.step === 'BOOKING');
</script>

{#snippet button(index: number, text?: string, Icon: any)}
	<button
		class="flex items-center justify-between gap-2 px-4 py-2 text-sm w-full bg-white hover:bg-opacity-5 border data-[active=true]:bg-white data-[active=true]:bg-opacity-30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
		onclick={() => gotoSelection(index)}
		{disabled}
	>
		<div class="flex items-center gap-2">
			<Icon size={24} />
			<b>{text}</b>
		</div>
		{#if !disabled}
			<PencilSimple size={18} />
		{/if}
	</button>
{/snippet}

<div
	class="flex flex-col md:gap-4 gap-3 flex-shrink text-black md:border md:rounded-lg md:p-5 p-4 bg-gray-100"
>
	<div class="font-light text-md">Votre réservation :</div>
	<div class="flex flex-col gap-1" id="summary">
		{@render button(
			0,
			selection.slot ? formatSlotDate(selection.slot.date, 'D MMMM') : undefined,
			Calendar
		)}
		{@render button(1, selection.service?.name[0].value, CallBell)}
		{@render button(
			2,
			`${selection.pax} personne${(selection?.pax ?? 0 > 1) ? 's' : ''}`,
			ForkKnife
		)}
		{@render button(3, selection.slot?.time ?? 'Sélectionnez un horaire', Clock)}
	</div>

	{#if widget.summaryText?.length > 0}
		<div class="text-sm">
			{getTranslation(widget.summaryText)}
		</div>
	{/if}
</div>
