<script lang="ts">
	import Field from '../Field.svelte';
	import { useField } from '../useField.svelte.js';
	import type { TextInputProps } from './textInput.js';

	let {
		type = 'text',
		value = $bindable(null),
		placeholder,
		...fieldProps
	}: TextInputProps = $props();
	let fieldState = useField({
		get value() {
			return value;
		},
		set value(newValue) {
			if (value !== newValue) {
				fieldProps.onChange?.(newValue);
			}
			value = newValue;
		},
		required: fieldProps.required,
		id: fieldProps.id,
		name: fieldProps.name,
		type,
		validate: fieldProps.validate
	});
</script>

<Field
	{...fieldProps}
	type="text"
	inputContainerClass="{fieldProps.inputContainerClass}  ui-text-input-container"
>
	<input
		data-1p-ignore
		type="text"
		id={fieldState.id}
		name={fieldState.name}
		bind:value={fieldState.value}
		bind:this={fieldState.element}
		{placeholder}
		class="ui-text-input"
	/>
</Field>
