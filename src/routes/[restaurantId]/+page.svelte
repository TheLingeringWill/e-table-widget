<script>
	import WidgetPage from '$lib/Widget/WidgetPage.svelte';

	const { data } = $props();
</script>

<WidgetPage builder={data.builder} {data} />
