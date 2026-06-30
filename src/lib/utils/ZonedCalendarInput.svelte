<script lang="ts" generics="T extends 'calendar' | 'calendar-range'">
	import CalendarInput from '$lib/vendor/maket/Components/Form/Calendar/CalendarInput.svelte';
	import type { ZonedDateUtils } from '$lib/utils/zonedDateUtils';
	import { currentLocale } from '$lib/states/locale.svelte';

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
		defaultMonth,
		...props
	}: ComponentProps<typeof CalendarInput<T>> & {
		zonedDateUtils: ZonedDateUtils;
		// Month to open the grid on when nothing is selected yet (the first
		// bookable day, from Selection). maket always starts on the current month
		// and exposes no API to set it; this drives it to the right month instead.
		defaultMonth?: Date;
	} = $props();

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

	let container: HTMLElement;

	const patchLocale = () => {
		if (!container) return;
		const locale = currentLocale.value;

		const weekdays = container.querySelectorAll('.ui-calendar-weekday');
		weekdays.forEach((el, i) => {
			el.textContent = new Date(0, 0, i).toLocaleDateString(locale, {
				weekday: (props.weekdayLength as 'narrow' | 'short') || 'narrow'
			});
		});

		const cell = container.querySelector('[data-in-month="true"]');
		if (cell) {
			const iso = cell.getAttribute('data-date');
			if (iso) {
				const d = new Date(iso);
				const label = d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
				const header = container.querySelector('.ui-calendar-header');
				if (header) {
					for (const node of header.childNodes) {
						if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
							node.textContent = ` ${label} `;
						}
					}
				}
			}
		}
	};

	$effect(() => {
		if (!container) return;
		// track locale so the effect re-runs on language change
		void currentLocale.value;
		patchLocale();
		const observer = new MutationObserver(() => {
			observer.disconnect();
			patchLocale();
			observer.observe(container, { childList: true, subtree: true, characterData: true });
		});
		observer.observe(container, { childList: true, subtree: true, characterData: true });
		return () => observer.disconnect();
	});

	// Year*12+month ordinal so December→January comparisons stay monotonic.
	const monthOrdinal = (iso: string) => {
		const d = new Date(iso);
		return d.getFullYear() * 12 + d.getMonth();
	};

	// maket renders the first days of the next month (and trailing days of the
	// previous one) as overflow cells in the single-month grid. They carry a
	// valid `data-date` and aren't disabled, but selecting one leaves the grid on
	// the current month with the chosen day showing only as a faint overflow cell.
	// maket's CalendarState is private — its only public hook to move the displayed
	// month is the header's prev/next arrow buttons (prev = `.rotate-180`). So when
	// an enabled overflow day is clicked we let maket register the selection, then
	// drive the matching arrow on the next frame to bring the grid to that month,
	// where the just-selected day renders in-month and highlighted.
	$effect(() => {
		if (!container) return;
		const onClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null;
			const cell = target?.closest<HTMLElement>('.ui-calendar-day');
			// Only intercept enabled overflow (out-of-month) cells; in-month and
			// disabled cells are handled by maket / its disabled guard unchanged.
			if (!cell || cell.getAttribute('data-in-month') !== 'false') return;
			if (cell.getAttribute('data-disabled')) return;

			const cellDate = cell.getAttribute('data-date');
			const anchor = container.querySelector('[data-in-month="true"]')?.getAttribute('data-date');
			if (!cellDate || !anchor) return;

			const diff = monthOrdinal(cellDate) - monthOrdinal(anchor);
			if (diff === 0) return;
			const arrowSelector =
				diff > 0
					? '.ui-calendar-header button:not(.rotate-180)'
					: '.ui-calendar-header button.rotate-180';
			const arrow = container.querySelector<HTMLButtonElement>(arrowSelector);
			if (!arrow) return;
			// Defer so maket's own click handler sets the selection first, then move
			// the displayed month onto it.
			requestAnimationFrame(() => arrow.click());
		};
		// Capture phase so we observe the click regardless of maket's own listener.
		container.addEventListener('click', onClick, true);
		return () => container.removeEventListener('click', onClick, true);
	});

	// On first render, bring the grid to the month the calendar should open on:
	// the selected value if there is one, else `defaultMonth` (the first bookable
	// day). maket always starts on the current month, so when this month has no
	// availability the guest lands on an empty grid. We drive the matching header
	// arrow — the same and only hook the overflow-click handler above uses — to
	// step onto the target month. One-shot: once the guest starts navigating, the
	// `jumped` latch keeps us from ever auto-correcting their chosen month.
	let jumped = false;
	$effect(() => {
		if (jumped || !container) return;
		// Cast (not annotate): maket's prop-type helper above already widens every
		// destructured prop to `never` (a pre-existing typing issue), and a `const`
		// is narrowed to its initializer's type — so only asserting the expression
		// type sticks. `v` and `defaultMonth` are Dates at runtime.
		const target = (v ?? defaultMonth) as Date | undefined;
		if (!target) return;
		const anchor = container.querySelector('[data-in-month="true"]')?.getAttribute('data-date');
		if (!anchor) return;
		jumped = true;
		const diff = target.getFullYear() * 12 + target.getMonth() - monthOrdinal(anchor);
		if (diff === 0) return;
		const arrowSelector =
			diff > 0
				? '.ui-calendar-header button:not(.rotate-180)'
				: '.ui-calendar-header button.rotate-180';
		const arrow = container.querySelector<HTMLButtonElement>(arrowSelector);
		if (!arrow) return;
		// Step synchronously: effects run before paint, so the grid is never painted
		// on the wrong (current) month first — no flash. goNextMonth is pure state
		// math, so N clicks advance N months (N === 1 in the common case).
		for (let i = 0; i < Math.abs(diff); i++) arrow.click();
	});
</script>

<div bind:this={container}>
	<CalendarInput {value} {...props} {minDate} {onChange} />
</div>
