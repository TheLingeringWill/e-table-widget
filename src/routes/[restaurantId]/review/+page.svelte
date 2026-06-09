<script>
	import Review from '$lib/Review.svelte';
	import { Check } from 'phosphor-svelte';
	import * as m from '$lib/paraglide/messages';

	let { data } = $props();
</script>

{#if data.thankYou}
	<div class="flex flex-col items-center w-full min-h-screen bg-gray-50 px-4 py-6">
		<div class="flex flex-col gap-4 items-center justify-center mt-20">
			<Check size={80} color="green" />
			<div class="text-center text-lg font-medium">{m.leaveReview_thankYou()}</div>
		</div>
	</div>
{:else}
	<Review
		restaurantName={data.restaurantName}
		reservation={data.reservation}
		reservationId={data.reservationId}
		arg={data.arg}
	/>
{/if}
