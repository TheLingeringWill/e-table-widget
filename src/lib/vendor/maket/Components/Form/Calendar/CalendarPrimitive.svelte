<script lang="ts">
	import type { CalendarPrimitiveProps } from './calendarInput.js';
	import { use_theme } from '../../../theme.svelte.js';
	import Button from '../../Button/Button.svelte';
	import {
		CalendarState,
		type Event,
		type CalendarType
	} from '../../Calendar/useCalendar.svelte.js';
	import Slot from '../../Slot/Slot.svelte';

	type T = $$Generic<CalendarType>;
	type E = $$Generic<Event>;
	let {
		type,
		events,
		value = $bindable(null),
		disabledDates,
		view = 'single',
		weekStartsOnMonday = true,
		weekdayLength = 'narrow',
		containerClass = '',
		headerClass = '',
		dayClass = '',
		weekdayClass = '',
		gridClass = '',
		cell: renderCell,
		buttons,
		minDate,
		maxDate,
		header,
		headerProps,
		onChange
	}: CalendarPrimitiveProps<E, T> = $props();

	// @ts-ignore wtaf?
	const calendar = new CalendarState<E, T>({
		events: (events || []) as E[],
		disabledDates,
		minDate,
		maxDate,
		view,
		weekStartsOnMonday,
		type: type || ('calendar' as T),
		onChange,
		value: value as any
	});

	const theme = use_theme();

	const buttonProps = $derived(
		buttons
			? 'prev' in buttons
				? buttons
				: { prev: buttons, next: buttons }
			: {
					prev: {},
					next: {}
				}
	);

	$effect(() => {
		if (type === 'calendar-range') {
			calendar.setRange(...value);
		} else {
			calendar.setRange(value, null);
		}
	});
</script>

<div
	class="ui-calendar-container {containerClass}"
	style="display: grid; grid-template-columns: repeat({view === 'single'
		? '1'
		: '2'}, minmax(0, 1fr)) "
	use:calendar.calendar
>
	<Slot
		render={header}
		class="ui-calendar-header {headerClass}"
		props={headerProps}
		style={view === 'single' ? '' : 'grid-column-start: 1; grid-column-end: 3;'}
	>
		<Button
			squared
			size="small"
			variant="ghost"
			class="rotate-180"
			children={theme.snippets?.defaultChevronRightIcon}
			{...buttonProps.prev}
			onclick={calendar.goPrevMonth}
		/>
		{calendar.displayedMonthLabel}
		<Button
			squared
			size="small"
			variant="ghost"
			children={theme.snippets?.defaultChevronRightIcon}
			{...buttonProps.next}
			onclick={calendar.goNextMonth}
		/>
	</Slot>
	{@render calendarPart(calendar.rows)}
	{#if view === 'double'}
		{@render calendarPart(calendar.nextMonthRows)}
	{/if}
</div>

{#snippet calendarPart(rows: typeof calendar.rows)}
	<div
		style="grid-template-columns: repeat(7, minmax(0, 1fr)); display: grid; grid-template-rows: repeat({view ===
		'double'
			? Math.max(calendar.rows.length, calendar.nextMonthRows.length) + 1
			: calendar.rows.length + 1}, minmax(0, 1fr));"
		class="ui-calendar-grid {gridClass}"
	>
		{#each Array(7) as _d, day}
			{@const colPosition =
				day === (calendar.weekStartsOnMonday ? 0 : 6)
					? 7
					: calendar.weekStartsOnMonday
						? day
						: day + 1}
			<span
				style="grid-row-start: 1; grid-column-start: {colPosition};"
				class="ui-calendar-weekday {weekdayClass}"
			>
				{new Date(0, 0, day).toLocaleDateString(undefined, { weekday: weekdayLength })}
			</span>
		{/each}

		{#each rows as { cells }}
			{#each cells as cell}
				{#if cell.visible}
					<button {...cell.attributes} class="ui-calendar-day {dayClass}">
						<abbr
							aria-label={cell.date.toLocaleDateString(undefined, {
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}
						>
							{#if renderCell}
								{@render renderCell(cell)}
							{:else}
								{cell.day}
							{/if}
						</abbr>
					</button>
				{/if}
			{/each}
		{/each}
	</div>
{/snippet}
