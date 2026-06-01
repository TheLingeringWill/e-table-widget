<script lang="ts">
	import { Calendar, Clock, ForkKnife } from 'phosphor-svelte';
	import { slide } from 'svelte/transition';
	import { selection } from '$lib/states/selection.svelte';
	import { step, previousStep } from '$lib/states/step.svelte';
	import { reservation } from '$lib/states/reservation.svelte';
	import { useWidget, getTranslation } from '$lib/context.svelte.js';
	import { currentLocale } from '$lib/states/locale.svelte';
	import { formatSlotDate } from '$lib/utils/slotFormat';
	import * as m from '$lib/paraglide/messages';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	let {
		theme,
		showSummary = false
	}: {
		theme: Record<string, any>;
		showSummary?: boolean;
	} = $props();

	const widget = useWidget();

	// Pass the active runtime locale ('en', 'fr', …) so the header shows the
	// matching translation; getTranslation normalizes case/region and falls
	// back to the first entry when the language has no translation (e.g. the
	// title only has an 'FR' entry).
	const title = $derived(getTranslation(widget.title, currentLocale.value));
	const description = $derived(getTranslation(widget.description, currentLocale.value));

	// The switcher rides along on screens where the user is actively choosing
	// or filling in a booking. We deliberately omit it from DONE/ERROR/PAYMENT
	// to keep terminal states focused.
	const showLanguageSwitcher = $derived(
		step.step === 'SELECTION' || step.step === 'CONTACT' || step.step === 'BOOKING'
	);
</script>

<div class="py-3 px-4 bg-primary flex flex-col space-y-3">
	<div class="flex items-center justify-between gap-3 min-h-[40px]">
		<div class="w-10 shrink-0" aria-hidden="true"></div>
		<h1 class="text-base font-semibold font-serif text-center flex-1" id="title">{title}</h1>
		{#if showLanguageSwitcher}
			<LanguageSwitcher />
		{:else}
			<div class="w-10 shrink-0" aria-hidden="true"></div>
		{/if}
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
			{m.common_modificationBanner({
				date: formatSlotDate(reservation.startDate.date, 'DD/MM/YYYY'),
				time: reservation.startDate.time,
				pax: reservation.pax ?? 0
			})}
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
					<b>{m.header_paxCount({ pax: selection.pax })}</b>
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
					<Clock size={24} /><b>{selection.slot?.time ?? m.header_pickTime()}</b>
				</div>
			</button>
		</div>
	{/if}
</div>
