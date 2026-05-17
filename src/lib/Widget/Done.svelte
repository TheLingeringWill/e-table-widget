<script lang="ts">
	import { Check } from 'phosphor-svelte';
	import { selection } from '$lib/states/selection.svelte';
	import { contact } from '$lib/states/contact.svelte';
	import { paymentIntent } from '$lib/states/paymentIntent.svelte';
	import { resetReservation } from '$lib/states/reservation.svelte';
	import { formatSlotDate } from '$lib/utils/slotFormat';
	import * as m from '$lib/paraglide/messages';
	import { onMount } from 'svelte';

	const cameFromPayment = $derived(!!paymentIntent.id);

	onMount(() => {
		resetReservation();
	});
</script>

<div class="flex flex-col gap-4 items-center justify-center">
	<Check size={80} color="green" />
	{#if cameFromPayment}
		<p>{m.done_cardAuthorized()}</p>
	{/if}
	{#if selection.slot}
		<p>
			{m.done_reservationLine({
				date: formatSlotDate(selection.slot.date, 'dddd DD MMMM'),
				time: selection.slot.time,
				pax: selection.pax ?? 0
			})}
		</p>
	{/if}
	{#if !cameFromPayment}
		<p>
			{m.done_emailSent({ email: contact.email ?? '' })}
		</p>
	{/if}
</div>
