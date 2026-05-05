<script lang="ts">
	import type { SlotTimestamp } from '$lib/api-types';
	import { formatSlotDate } from '$lib/utils/slotFormat';

	let {
		restaurantName,
		reservation,
		reservationId = null
	}: {
		restaurantName: string;
		reservation: { id: string; startDate: SlotTimestamp; pax: number } | null;
		reservationId?: string | null;
	} = $props();
</script>

{#snippet starIcon(filled: boolean)}
	<svg
		class="w-full h-full"
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
	<!-- Above card -->
	<h1 class="text-xl font-semibold text-gray-900 text-center">{restaurantName}</h1>
	<p class="text-base text-gray-500 text-center mt-16">Merci pour votre visite !</p>

	<!-- White Card Container -->
	<div class="w-full max-w-md bg-white rounded-2xl shadow-md p-6 mt-6 space-y-6">
		<p class="text-base text-gray-700 text-center">Évaluez votre expérience</p>

		<!-- Star Rating as Links -->
		<div class="flex justify-center gap-2">
			{#each [1, 2, 3, 4, 5] as star}
				<a
					href={reservationId
						? `?rating=${star}&reservationId=${reservationId}`
						: `?rating=${star}`}
					class="size-12 flex items-center justify-center transition-transform active:scale-90 select-none touch-manipulation"
					aria-label="Note {star} étoile{star > 1 ? 's' : ''}"
				>
					{@render starIcon(false)}
				</a>
			{/each}
		</div>
	</div>

	<!-- Reservation Details (Below Card) -->
	{#if reservation}
		<div class="text-xs text-gray-500 text-center mt-4 max-w-md">
			Réservation du {formatSlotDate(reservation.startDate.date, 'DD/MM/YYYY')}
			à {reservation.startDate.time}
			pour {reservation.pax} personne(s)
		</div>
	{/if}
</div>
