<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import type { SeparatorProps } from './separator.js';

	const {
		children,
		decorative = false,
		class: className = '',
		orientation = 'horizontal',
		color = 'surface',
		size = 1
	}: SeparatorProps = $props();
</script>

<div
	class="ui-separator {className}"
	data-orientation={orientation}
	data-color={color}
	aria-orientation={orientation}
	role={decorative ? 'separator' : 'none'}
	style:height={orientation === 'horizontal' ? size + 'px' : undefined}
	style:width={orientation === 'vertical' ? size + 'px' : undefined}
	style:border-width={size / 2 + 'px'}
>
	<Slot render={children} class="ui-separator-label" />
</div>
