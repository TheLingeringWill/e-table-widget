<script lang="ts">
	import type { CalendarProps } from './calendarInput.js';
	import { useField } from '../useField.svelte.js';
	import Field from '../Field.svelte';
	import CalendarPrimitive from './CalendarPrimitive.svelte';
	import type { CalendarType } from '../../Calendar/useCalendar.svelte.js';
	import { onMount } from 'svelte';

	type T = $$Generic<CalendarType>;

	let {
		value = $bindable(null),
		type = 'calendar',
		disabledDates,
		view,
		weekStartsOnMonday,
		weekdayLength,
		containerClass,
		headerClass,
		dayClass,
		weekdayClass,
		gridClass,
		minDate,
		maxDate,
		cell,
		buttons,
		header,
		headerProps,
		onChange,
		...fieldProps
	}: CalendarProps<never, T> = $props();

	const fieldState =
		type === 'calendar-range'
			? useField({
					type: 'calendar-range',
					get value() {
						return value as [Date | null, Date | null] | null;
					},
					set value(newValue) {
						value = newValue;
					}
				})
			: useField({
					type: 'calendar',
					get value() {
						return value as Date | null;
					},
					set value(newValue) {
						value = newValue;
					}
				});
	$effect(() => {
		fieldState.value = value;
	});
</script>

<Field
	type={(type || 'calendar') as T}
	{...fieldProps}
	class="{fieldProps.class} !max-w-[unset]"
	inputContainerClass="ui-calendar"
>
	<CalendarPrimitive
		onChange={(v) => {
			fieldState.value = v;
			onChange?.(v);
		}}
		value={fieldState.value}
		type={type || 'calendar'}
		{disabledDates}
		{minDate}
		{maxDate}
		{view}
		{weekStartsOnMonday}
		{weekdayLength}
		{containerClass}
		{headerClass}
		{dayClass}
		{weekdayClass}
		{gridClass}
		{cell}
		{buttons}
		{header}
		{headerProps}
	/>
</Field>
