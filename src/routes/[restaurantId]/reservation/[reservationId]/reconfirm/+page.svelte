<script lang="ts">
	import { formatSlotDateTime } from '$lib/utils/slotFormat';
	import Check from 'phosphor-svelte/lib/Check';

	let { data } = $props();

	const reservation = $derived(data.reservation);
</script>

{#if reservation}
	<div class="flex flex-col items-center justify-center w-full gap-5 py-20">
		<div class="pb-10 text-lg font-bold">{reservation.restaurant.name}</div>

		<div class="flex flex-col items-center justify-center gap-4">
			<Check size={80} color="green" />
			<div class="text-center">Merci, votre réservation est bien confirmée.</div>
			<div class="text-center">
				Nous vous attendons le
				<div>
					<b
						>{formatSlotDateTime(
							reservation.startDate.date,
							reservation.startDate.time,
							'DD/MM/YYYY à HH:mm'
						)}</b
					>
				</div>
			</div>
		</div>
	</div>
{/if}
