<script lang="ts">
	import { acornBold } from '../Icons/acorn.js';
	import ButtonPrimitive from './ButtonPrimitive.svelte';
	import type { ButtonProps } from './button.js';
	type Payload = $$Generic<Record<string, any> | undefined>;
	let { ref = $bindable(), ...props }: ButtonProps<Payload> = $props();
</script>

<ButtonPrimitive bind:ref {...props} />
