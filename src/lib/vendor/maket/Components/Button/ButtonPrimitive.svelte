<script lang="ts">
	import { loader } from '../../actions/loader.js';

	import Slot from '../Slot/Slot.svelte';
	import type { ButtonPrimitiveProps } from './button.js';

	type Payload = $$Generic<Record<string, any> | undefined>;

	let {
		as,
		payload,
		loading = false,
		onclick = null,
		prefixProps,
		onEnter = null,
		onLeave = null,
		suffixProps,
		href,
		squared,
		class: className,
		color = 'contrast',
		prefix,
		suffix,
		children,
		variant = 'solid',
		size = 'normal',
		ref = $bindable(),
		fullWidth = false,
		disabled = false,
		rel,
		target,
		prefixClass = '',
		suffixClass = ''
	}: ButtonPrimitiveProps<Payload> = $props();
</script>

<svelte:element
	this={as || href ? 'a' : 'button'}
	role={as || href ? 'link' : 'button'}
	{href}
	{rel}
	{target}
	bind:this={ref}
	data-squared={squared ?? !!((!children && prefix && !suffix) || (!children && !prefix && suffix))}
	data-loading={loading}
	data-color={color}
	data-variant={variant}
	data-size={size}
	data-full-width={fullWidth}
	data-disabled={disabled}
	class="ui-button {className}"
	use:loader={{ loading }}
	onclick={() => {
		onclick?.(payload);
	}}
	onpointerenter={() => {
		onEnter?.(payload);
	}}
	onpointerleave={() => {
		onLeave?.(payload);
	}}
>
	<Slot {payload} render={prefix} class="ui-button-prefix {prefixClass}" props={prefixProps} />
	<Slot {payload} render={children} />
	<Slot {payload} render={suffix} class="ui-button-suffix {suffixClass}" props={suffixProps} />
</svelte:element>
