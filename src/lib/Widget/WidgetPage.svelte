<script lang="ts">
	import { useWidget, useZonedDateUtils } from '$lib/context.svelte.js';
	import Widget from '$lib/Widget.svelte';
	import { tz } from '$lib/utils/tz';
	import { ZonedDateUtils } from '$lib/utils/zonedDateUtils';

	const { data, builder } = $props();

	useWidget(data.widget);
	useZonedDateUtils(
		new ZonedDateUtils(
			data.widget.restaurant?.timezone ? tz(data.widget.restaurant.timezone) : 'Europe/Paris'
		)
	);
</script>

<div
	class="flex items-center justify-center w-full {builder
		? 'h-fit'
		: 'min-h-full'} overflow-visible min-h-full"
	id="page"
>
	<Widget {builder} data={data.widget} isEmbedded={data.isEmbedded} />
</div>
