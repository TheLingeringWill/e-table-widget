<script lang="ts">
	import { enhance } from '$app/forms';
	import { useZonedDateUtils } from '$lib/context.svelte';
	import { formatTime } from 'shared/utils/time.js';
	import { Check } from 'phosphor-svelte';

	let { data, form } = $props();

	const zonedDateUtils = useZonedDateUtils();

	let submitting = $state(false);
</script>

{#snippet starIcon(filled: boolean)}
	<svg
		class="size-8"
		fill={filled ? '#fde047' : '#d1d5db'}
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 576 512"
	>
		<path
			d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"
		/>
	</svg>
{/snippet}

<div class="flex flex-col items-center w-full min-h-screen bg-gray-50 px-4 py-6">
	{#if form?.success}
		<!-- Success State -->
		<div class="flex flex-col gap-4 items-center justify-center mt-20">
			<Check size={80} color="green" />
			<div class="text-center text-lg font-medium">Merci pour votre avis !</div>
		</div>
	{:else}
		<!-- Above card -->
		<h1 class="text-xl font-semibold text-gray-900 text-center">{data.restaurantName}</h1>

		<p class="text-base text-gray-500 text-center mt-6">Nous regrettons que votre expérience n'ait pas été à la hauteur de vos attentes.</p>

		{#if data.rating}
			<div class="flex justify-center gap-1 mt-4">
				{#each [1, 2, 3, 4, 5] as star}
					{@render starIcon(star <= data.rating)}
				{/each}
			</div>
		{/if}

		<!-- White Card Container -->
		<div class="w-full max-w-md bg-white rounded-2xl shadow-md p-6 mt-6 space-y-6">
			<!-- Feedback Form -->
			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update();
					};
				}}
			>
				<input type="hidden" name="rating" value={data.rating} />
				{#if data.reservationId}
					<input type="hidden" name="reservationId" value={data.reservationId} />
				{/if}

				<div class="space-y-4">
					<textarea
						name="comment"
						placeholder="Partagez votre avis..."
						class="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg resize-y text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
					></textarea>

					<button
						type="submit"
						disabled={submitting}
						class="flex items-center gap-2 transition-all w-full text-center py-3 border-none text-sm font-semibold justify-center hover:brightness-90 focus:brightness-75 text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 font-medium disabled:cursor-not-allowed disabled:opacity-50"
					>
						{submitting ? 'Envoi en cours...' : 'Envoyer'}
					</button>
				</div>

				{#if form?.error}
					<p class="text-red-500 text-sm text-center mt-2">{form.error}</p>
				{/if}
			</form>
		</div>

		<!-- Reservation Details (Below Card) -->
		{#if data.reservation}
			<div class="text-xs text-gray-500 text-center mt-4 max-w-md">
				Réservation du {zonedDateUtils.format('DD/MM/YYYY', data.reservation.startDate)}
				à {formatTime(zonedDateUtils.dateToTime(data.reservation.startDate))}
				pour {data.reservation.pax} personne(s)
			</div>
		{/if}
	{/if}
</div>
