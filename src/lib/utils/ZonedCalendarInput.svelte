<script lang="ts" generics="T extends 'calendar' | 'calendar-range'">
	import CalendarInput from 'maket/CalendarInput';
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
</script>

<div bind:this={container}>
	<CalendarInput {value} {...props} {minDate} {onChange} />
</div>
