<script lang="ts" generics="T extends 'calendar' | 'calendar-range'">
	// Widget-local copy of the legacy `shared/utils/ZonedCalendarInput.svelte`.
	// Thin tz-conversion wrapper around `maket/CalendarInput` — preserves the
	// styled inline calendar grid the original Selection.svelte design relies
	// on (Mon-Sun header, day buttons with `data-in-month` / `data-disabled` /
	// `data-selected` attributes the call site styles via Tailwind).

	import CalendarInput from 'maket/CalendarInput';
	import type { ZonedDateUtils } from '$lib/utils/zonedDateUtils';

	type ComponentProps<C> = C extends new (...args: infer Args) => unknown
		? Args[0] extends { props: infer P }
			? P
			: never
		: C extends (...args: infer Args) => unknown
			? Args[0] extends infer P
				? P
				: never
			: Record<string, unknown>;

	let {
		value: v = $bindable(),
		zonedDateUtils,
		...props
	}: ComponentProps<typeof CalendarInput<T>> & { zonedDateUtils: ZonedDateUtils } = $props();

	const value = $derived.by(() => {
		if (!props.value) return props.value;
		return zonedDateUtils.convertToInternalDate(props.value);
	});
	const minDate = $derived.by(() => {
		if (!props.minDate) return props.minDate;
		return zonedDateUtils.convertToInternalDate(props.minDate);
	});
	const onChange = $derived((date: Date) => {
		v = zonedDateUtils.inferDateToZone(date);
		return props.onChange(v);
	});
</script>

<CalendarInput {value} {...props} {minDate} {onChange} />
