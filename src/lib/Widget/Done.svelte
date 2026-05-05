<script lang="ts">
	import { Check } from 'phosphor-svelte';
	import { selection } from '$lib/states/selection.svelte';
	import { contact } from '$lib/states/contact.svelte';
	import { paymentIntent } from '$lib/states/paymentIntent.svelte';
	import { resetReservation } from '$lib/states/reservation.svelte';
	import { formatSlotDate } from '$lib/utils/slotFormat';
	import { onMount } from 'svelte';

	const cameFromPayment = $derived(!!paymentIntent.id);

	onMount(() => {
		resetReservation();
	});
</script>

<div class="flex flex-col gap-4 items-center justify-center">
	<Check size={80} color="green" />
	{#if cameFromPayment}
		<p>Carte autorisée — vous recevrez une confirmation par email d'ici quelques instants.</p>
		{#if selection.slot}
			<p>
				Réservation du <b>{formatSlotDate(selection.slot.date, 'dddd DD MMMM')}</b> à
				<b>{selection.slot.time}</b>
				pour <b>{selection.pax}</b> personne{(selection.pax ?? 0) > 1 ? 's' : ''}.
			</p>
		{/if}
	{:else}
		{#if selection.slot}
			<p>
				Votre réservation du <b>{formatSlotDate(selection.slot.date, 'dddd DD MMMM')}</b> à
				<b>{selection.slot.time}</b>
				pour <b>{selection.pax}</b> personne{(selection.pax ?? 0) > 1 ? 's' : ''} a été reçue.
			</p>
		{/if}
		<p>
			Un email vous a été envoyé à {contact.email}.
		</p>
	{/if}
</div>
