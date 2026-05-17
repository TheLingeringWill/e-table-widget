<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import Button from '$lib/Widget/Button.svelte';
	import { enhance } from '$app/forms';
	import { formatSlotDate } from '$lib/utils/slotFormat';
	import * as m from '$lib/paraglide/messages';

	const { data } = $props();

	const { reservation, restaurant, widget } = data;

	let loading = $state(false);
	let success = $state(false);
	let error = $state(false);
</script>

<div class="flex flex-col justify-center items-center gap-5 w-full h-full">
	<div class="text-lg font-bold">{restaurant.name}</div>
	<hr />
	<div class="font-semibold">
		{m.done_reservationLine({
			date: formatSlotDate(reservation.startDate.date, 'DD/MM/YYYY'),
			time: reservation.startDate.time,
			pax: data.reservation.pax
		})}
	</div>
	<div class="flex flex-col gap-6">
		{#if success || ['USER_CANCELED', 'RESTAURANT_CANCELED'].includes(reservation.status)}
			<div class="text-green-600 font-semibold">{m.cancel_canceled()}</div>
			{#if widget}
				<Button
					onclick={() => {
						goto(`/${widget.id}`);
					}}
					revert
					type="button">{m.cancel_makeAnother()}</Button
				>
			{/if}
		{:else}
			{#if error}
				<div class="text-red-600 font-semibold">
					{m.cancel_error()}
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
					{loading ? m.cancel_canceling() : m.cancel_cancelButton()}
				</Button>
			</form>
		{/if}
	</div>
</div>
