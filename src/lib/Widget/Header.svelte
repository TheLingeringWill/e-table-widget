<script lang="ts">
	import { Calendar, Clock, ForkKnife } from 'phosphor-svelte';
	import { slide } from 'svelte/transition';
	import { selection } from '$lib/states/selection.svelte';
	import { step, previousStep } from '$lib/states/step.svelte';
	import { reservation } from '$lib/states/reservation.svelte';
	import { useWidget, getTranslation } from '$lib/context.svelte.js';
	import { formatSlotDate } from '$lib/utils/slotFormat';
	let {
		theme,
		showSummary = false
	}: {
		theme: Record<string, any>;
		showSummary?: boolean;
	} = $props();

	const widget = useWidget();

	const title = $derived(getTranslation(widget.title));
	const description = $derived(getTranslation(widget.description));
</script>

<div class="py-3 px-4 top-0 bg-primary flex flex-col space-y-3">
	<div class="flex items-center justify-center gap-5">
		<h1 class="font-normal font-serif text-center" id="title">{title}</h1>
	</div>
	{#if description?.length && step.step === 'SELECTION'}
		<div id="description" style:white-space="pre-line" class="text-center" transition:slide>
			{@html description}
		</div>
	{/if}
	{#if reservation.id && reservation.startDate && step.step !== 'PAYMENT'}
		<div
			class="bg-yellow-100 border rounded-lg px-3 py-2 border-yellow-800 text-sm font-normal text-yellow-900"
			transition:slide
		>
			Modification de votre réservation du <b
				>{formatSlotDate(reservation.startDate.date, 'DD/MM/YYYY')}</b
			>
			à
			<b>{reservation.startDate.time}</b> pour <b>{reservation.pax}</b>
			personne{(reservation.pax ?? 0) > 1 ? 's' : ''}
		</div>
	{/if}
	{#if showSummary}
		<div class="flex items-center justify-between gap-1 flex-wrap" transition:slide>
			<button
				onclick={() => {
					previousStep('SELECTION');
				}}
				class="flex-grow flex items-center gap-3 px-3 py-1 text-sm rounded-lg hover:bg-white hover:bg-opacity-5 border data-[active=true]:bg-white data-[active=true]:bg-opacity-30"
			>
				<div class="flex items-center gap-1">
					<ForkKnife size={24} />
					<b>{selection.pax} {selection.pax > 1 ? 'personnes' : 'personne'}</b>
				</div>
			</button>
			<button
				class="flex-grow flex items-center gap-3 px-3 py-1 text-sm rounded-lg hover:bg-white hover:bg-opacity-5 border data-[active=true]:bg-white data-[active=true]:bg-opacity-30"
				onclick={() => previousStep('SELECTION', 1)}
			>
				<div class="flex items-center gap-1">
					<Calendar size={24} />
					<b>{selection.slot ? formatSlotDate(selection.slot.date, 'D MMMM') : ''}</b>
				</div>
			</button>
			<button
				class="flex-grow flex items-center gap-3 px-3 py-1 text-sm rounded-lg hover:bg-white hover:bg-opacity-5 border data-[active=true]:bg-white data-[active=true]:bg-opacity-30"
				onclick={() => previousStep('SELECTION', 2)}
			>
				<div class="flex items-center gap-1">
					<Clock size={24} /><b>{selection.slot?.time ?? 'Sélectionnez un horaire'}</b>
				</div>
			</button>
		</div>
	{/if}
</div>
