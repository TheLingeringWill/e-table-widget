<script lang="ts">
	import { Check } from 'phosphor-svelte';
	import { selection } from '$lib/states/selection.svelte';
	import dayjs from 'dayjs';
	import { contact } from '$lib/states/contact.svelte';
	import { paymentIntent } from '$lib/states/paymentIntent.svelte';
	import { resetReservation } from '$lib/states/reservation.svelte';
	import { onMount } from 'svelte';
	import { useZonedDateUtils } from '$lib/context.svelte';

	const zonedDateUtils = useZonedDateUtils();
	const cameFromPayment = $derived(!!paymentIntent.id);

	onMount(() => {
		resetReservation();
	});
</script>

<div class="flex flex-col gap-4 items-center justify-center">
	<Check size={80} color="green" />
	{#if cameFromPayment}
		<p>Carte autorisée — vous recevrez une confirmation par email d'ici quelques instants.</p>
		<p>
			Réservation du <b>{zonedDateUtils.format('dddd DD MMMM', selection.slot?.date)}</b> à
			<b>{zonedDateUtils.format('HH:mm', selection.slot?.date)}</b>
			pour <b>{selection.pax}</b> personne{selection.pax > 1 ? 's' : ''}.
		</p>
	{:else}
		<p>
			Votre réservation du <b>{zonedDateUtils.format('dddd DD MMMM', selection.slot?.date)}</b> à
			<b>{zonedDateUtils.format('HH:mm', selection.slot?.date)}</b>
			pour <b>{selection.pax}</b> personne{selection.pax > 1 ? 's' : ''} a été reçue.
		</p>
		<p>
			Un email vous a été envoyé à {contact.email}.
		</p>
	{/if}
</div>
