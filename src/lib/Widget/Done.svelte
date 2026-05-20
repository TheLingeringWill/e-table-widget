<script lang="ts">
	import { CalendarCheck, CalendarPlus, ClockClockwise, Hourglass } from 'phosphor-svelte';
	import { selection } from '$lib/states/selection.svelte';
	import { paymentIntent } from '$lib/states/paymentIntent.svelte';
	import { reservation, resetReservation } from '$lib/states/reservation.svelte';
	import { formatSlotDateTime } from '$lib/utils/slotFormat';
	import { getTranslation } from '$lib/context.svelte.js';
	import * as m from '$lib/paraglide/messages';
	import { onMount } from 'svelte';

	let { widget, theme }: { widget: any; theme: any } = $props();

	type StatusCategory = 'confirmed' | 'to_confirm' | 'waitlist';

	const categorize = (status: string | undefined): StatusCategory => {
		if (status === 'waiting_list') return 'waitlist';
		if (status === 'to_confirm') return 'to_confirm';
		return 'confirmed';
	};

	// Snapshot before onMount → resetReservation() clears reservation state.
	const wasModification = reservation.id !== undefined;
	const category: StatusCategory = categorize(reservation.confirmedStatus);

	const restaurantName = $derived(getTranslation(widget?.title));
	const cameFromPayment = $derived(!!paymentIntent.id);

	const summary = $derived.by(() => {
		if (!selection.slot) return null;
		return m.done_reservationSummary({
			pax: selection.pax ?? 0,
			date: formatSlotDateTime(selection.slot.date, selection.slot.time, 'dddd D MMMM'),
			time: selection.slot.time
		});
	});

	const title = $derived.by(() => {
		if (category === 'waitlist') return m.done_waitlistTitle();
		if (category === 'to_confirm') return m.done_toConfirmTitle();
		return wasModification ? m.done_modificationTitle() : m.done_title();
	});

	function pad(n: number) {
		return n.toString().padStart(2, '0');
	}

	function icsStamp(date: string, time: string) {
		return `${date.replaceAll('-', '')}T${time.replace(':', '')}00`;
	}

	function downloadIcs() {
		if (!selection.slot) return;
		const start = new Date(`${selection.slot.date}T${selection.slot.time}:00`);
		const end = new Date(start.getTime() + 90 * 60 * 1000);
		const endStr = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`;
		const eventTitle = restaurantName || 'Reservation';
		const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@e-table`;
		const ics = [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'PRODID:-//e-table//widget//EN',
			'BEGIN:VEVENT',
			`UID:${uid}`,
			`DTSTAMP:${icsStamp(selection.slot.date, selection.slot.time)}`,
			`DTSTART:${icsStamp(selection.slot.date, selection.slot.time)}`,
			`DTEND:${endStr}`,
			`SUMMARY:${eventTitle}`,
			'END:VEVENT',
			'END:VCALENDAR'
		].join('\r\n');
		const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'reservation.ics';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	onMount(() => {
		resetReservation();
	});
</script>

<div class="flex flex-col items-center gap-6 max-w-md mx-auto text-center">
	<div class="w-20 h-20 rounded-full border border-current/30 flex items-center justify-center">
		{#if category === 'waitlist'}
			<Hourglass size={34} weight="regular" />
		{:else if category === 'to_confirm'}
			<ClockClockwise size={34} weight="regular" />
		{:else}
			<CalendarCheck size={34} weight="regular" />
		{/if}
	</div>

	{#if category !== 'to_confirm'}
		<h2 class="text-base font-medium tracking-[0.18em] uppercase">
			{title}
		</h2>
	{/if}

	{#if summary}
		<div
			class="w-full border rounded-[var(--base-radius)] py-4 px-5 text-base font-medium leading-relaxed"
		>
			{summary}
		</div>
	{/if}

	<div class="flex flex-col gap-3 text-base leading-relaxed opacity-85">
		{#if category === 'waitlist'}
			<p>{m.done_waitlistBody()}</p>
		{:else if category === 'to_confirm'}
			<p>{m.done_toConfirmBody()}</p>
		{:else if wasModification}
			<p>{m.done_modificationRecorded()}</p>
		{:else}
			<p>{m.done_emailIncoming()}</p>
			<p>{m.done_checkSpam()}</p>
		{/if}
		{#if cameFromPayment}
			<p>{m.done_cardAuthorized()}</p>
		{/if}
	</div>

	{#if selection.slot && category !== 'waitlist'}
		<button
			type="button"
			class="mt-2 w-full py-3 px-4 text-sm font-semibold text-center transition-all hover:brightness-110 focus:brightness-95 focus:outline-none"
			style="background: {theme?.backgroundColor};
			       color: {theme?.fontColor};
			       border: 1px solid {theme?.backgroundColor};
			       border-radius: {theme?.buttonBorderRadius ?? 8}px;"
			onclick={downloadIcs}
		>
			<span class="inline-flex items-center gap-2 align-middle">
				<CalendarPlus size={18} weight="regular" />
				<span>{m.done_addToCalendar()}</span>
			</span>
		</button>
	{/if}
</div>
