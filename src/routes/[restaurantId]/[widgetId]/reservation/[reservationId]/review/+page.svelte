<script>
	import Review from '$lib/Review.svelte';

	let { data } = $props();
</script>

<Review restaurantName={data.restaurantName} reservation={data.reservation} />
