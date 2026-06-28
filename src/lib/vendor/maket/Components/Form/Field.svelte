<script lang="ts">
	import { getContext } from 'svelte';
	import Slot from '../Slot/Slot.svelte';
	import { type FieldState } from './useField.svelte.js';
	import type { InputType, FieldProps } from './field.js';
	type Type = $$Generic<InputType>;

	let {
		class: className = '',
		children,
		label,
		labelClass = '',
		description,
		descriptionClass = '',
		helper,
		helperClass,
		actions,
		actionsClass = '',
		headerClass = '',
		errors,
		error,
		errorsClass = '',
		errorClass = '',
		inputContainerClass = '',
		suffix,
		suffixProps,
		labelProps,
		prefix,
		prefixProps,
		prefixClass = '',
		suffixClass = '',
		helperProps,
		errorProps,
		actionsProps,
		descriptionProps,
		footer,
		footerClass = '',
		footerProps,
		header,
		headerProps,
		as = 'div',
		node = $bindable(),
		action = (_node: HTMLElement, _field: FieldState<Type>) => {
			//
		},
		attrs = {}
	}: FieldProps<Type> = $props();

	const field = getContext<FieldState<Type>>('field');
	const allErrors = $derived(field.errors.concat(errors || []));
</script>

<div class="ui-field {className}" bind:this={node}>
	{#if label || actions || header}
		<Slot render={header} payload={field} class="ui-field-header {headerClass}" props={headerProps}>
			<Slot
				as="label"
				attrs={{ for: field.id }}
				class="ui-field-label {labelClass}"
				render={label}
				props={labelProps}
			/>
			<Slot
				class="ui-field-actions {actionsClass}"
				render={actions}
				payload={field}
				props={actionsProps}
			/>
		</Slot>
	{/if}
	<svelte:element
		this={as}
		class="ui-field-input-container {inputContainerClass}"
		use:action={field}
		{...attrs}
	>
		<Slot render={prefix} props={prefixProps} payload={field} class={prefixClass} />
		{@render children()}
		<Slot render={suffix} props={suffixProps} payload={field} class={suffixClass} />
	</svelte:element>
	{#if description || helper || footer}
		<Slot render={footer} payload={field} class="ui-field-footer {footerClass}" props={footerProps}>
			<Slot
				class="ui-field-description {descriptionClass}"
				render={description}
				payload={field}
				props={descriptionProps}
			/>
			<Slot class="ui-field-helper {helperClass}" render={helper} props={helperProps} />
		</Slot>
	{/if}
	{#if allErrors.length > 0}
		<ul class="ui-field-errors {errorsClass}">
			{#each allErrors as err}
				<Slot render={error} class="ui-field-error {errorClass}" payload={field} props={errorProps}>
					{err}
				</Slot>
			{/each}
		</ul>
	{/if}
</div>
