<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import Button from '$lib/Widget/Button.svelte';
	import { enhance } from '$app/forms';

	const { data } = $props();

	const { reservation, restaurant, widget } = data;

	let loading = $state(false);
	let success = $state(false);
	let error = $state(false);

	// Format time in restaurant timezone (Europe/Paris)
	const formattedDate = reservation.startDate.toLocaleDateString('fr-FR', {
		timeZone: 'Europe/Paris'
	});
	const formattedTime = reservation.startDate.toLocaleTimeString('fr-FR', {
		timeZone: 'Europe/Paris',
		hour: '2-digit',
		minute: '2-digit'
	});
</script>

<div class="flex flex-col justify-center items-center gap-5 w-full h-full">
	<div class="text-lg font-bold">{restaurant.name}</div>
	<hr />
	<div>
		Réservation du <b>{formattedDate}</b> à
		<b>{formattedTime}</b> pour
		<b>{data.reservation.pax}</b>
		personne(s).
	</div>
	<div class="flex flex-col gap-6">
		{#if success || ['USER_CANCELED', 'RESTAURANT_CANCELED'].includes(reservation.status)}
			<div class="text-green-600 font-semibold">La réservation a été annulée.</div>
			{#if widget}
				<Button
					onclick={() => {
						goto(`/${widget.id}`);
					}}
					revert
					type="button">Faire une autre réservation</Button
				>
			{/if}
		{:else}
			{#if error}
				<div class="text-red-600 font-semibold">
					Une erreur s'est produite lors de l'annulation.
				</div>
			{/if}
			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					error = false;
					return async ({ result }) => {
						loading = false;
						if (result.type === 'success') {
							success = true;
							await invalidate('app:reservation');
						} else {
							error = true;
						}
					};
				}}
			>
				<Button disabled={loading} revert type="submit">
					{loading ? 'Annulation en cours...' : 'Annuler la réservation'}
				</Button>
			</form>
		{/if}
	</div>
</div>
