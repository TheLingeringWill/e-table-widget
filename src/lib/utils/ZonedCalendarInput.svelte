<script lang="ts">
	// Widget-local minimal replacement for the shared ZonedCalendarInput.
	// The shared component was a styled bits-ui calendar — for the migration
	// we ship a native `<input type="date">` that round-trips dates in the
	// restaurant timezone via the existing ZonedDateUtils helper. Functionally
	// equivalent for selecting a booking date; visually leaner than the
	// previous component (PRD §6.4 hardcodes the white surface anyway).

	import type { ZonedDateUtils } from '$lib/utils/zonedDateUtils';

	type Props = {
		zonedDateUtils: ZonedDateUtils;
		value: Date | null;
		minDate?: Date | null;
		onChange: (date: Date | null) => void;
		// Accept the rest of the styling props the call site passes so the
		// existing markup keeps compiling. Most are no-ops in the native input.
		type?: string;
		view?: string;
		headerClass?: string;
		weekdayClass?: string;
		gridClass?: string;
		dayClass?: string;
		class?: string;
		buttons?: unknown;
		containerClass?: string;
	};

	let { zonedDateUtils, value, minDate, onChange, ...rest }: Props = $props();
	void rest; // styling props intentionally unused in the native input

	const toInputValue = (d: Date | null | undefined) =>
		d ? zonedDateUtils.format('yyyy-MM-dd', d) : '';

	const handleInput = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement;
		if (!target.value) {
			onChange(null);
			return;
		}
		// Build a Date in the local clock that matches the picked YYYY-MM-DD.
		const [y, m, d] = target.value.split('-').map(Number);
		onChange(new Date(y, (m ?? 1) - 1, d ?? 1));
	};
</script>

<input
	type="date"
	value={toInputValue(value)}
	min={toInputValue(minDate ?? undefined)}
	oninput={handleInput}
	class="border rounded px-3 py-2 w-full"
/>
