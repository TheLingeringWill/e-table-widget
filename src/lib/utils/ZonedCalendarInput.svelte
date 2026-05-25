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
			observer.observe(container, { childList: true, subtree: true });
		});
		observer.observe(container, { childList: true, subtree: true });
		return () => observer.disconnect();
	});
</script>

<div bind:this={container}>
	<CalendarInput {value} {...props} {minDate} {onChange} />
</div>
