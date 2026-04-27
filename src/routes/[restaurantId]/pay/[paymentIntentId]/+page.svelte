<script lang="ts">
	import StandalonePayment from '$lib/StandalonePayment.svelte';

	const { data } = $props();
</script>

<StandalonePayment {data} />
