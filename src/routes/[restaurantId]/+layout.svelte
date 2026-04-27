<script>
	import { ZonedDateUtils } from 'shared/utils/zonedDateUtils';
	import { setContext } from 'svelte';

	let { children, data } = $props();

	setContext(
		'zonedDateUtils',
		new ZonedDateUtils(data.restaurant?.timezone.replace('__', '/') || 'Europe/Paris')
	);
</script>

{@render children()}
