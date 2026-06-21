<script lang="ts">
	import {
		ArrowLeft,
		ArrowRight,
		Calendar,
		Check,
		Clock,
		ForkKnife,
		Info,
		Sparkle
	} from 'phosphor-svelte';
	import StepBar from './StepBar.svelte';
	import Button from './Button.svelte';
	import Spinner from '../Spinner.svelte';
	import { onMount } from 'svelte';
	import { api } from '$lib/widget-rpc-client';
	import { accordionToOpen, openedAccordion, selection } from '$lib/states/selection.svelte';
	import { nextStep } from '$lib/states/step.svelte';
	import { waitlist, resetWaitlist, joinWaitlist, type Slot } from '$lib/states/waitlist.svelte';
	import { reservation, reservationTemp } from '$lib/states/reservation.svelte';
	import { getTranslation, useWidget, useZonedDateUtils } from '$lib/context.svelte';
	import { currentLocale } from '$lib/states/locale.svelte';
	import ZonedCalendarInput from '$lib/utils/ZonedCalendarInput.svelte';
	import { parseSlotDateAsCalendarDate, slotKey } from '$lib/utils/slotFormat';
	import { isServiceEnded, isSlotPast } from '$lib/utils/pastFilter';
	import { pushGtmEvent } from '../gtm.svelte';
	import type { WidgetAlternativeRestaurantResponseDTO } from '$lib/api-types';
	import * as m from '$lib/paraglide/messages';

	let {
		restaurantId,
		theme
	}: {
		restaurantId: string;
		theme: any;
	} = $props();

	const widgetCtx = useWidget();
	const zonedDateUtils = useZonedDateUtils();

	// Direction-implying icons (calendar prev/next, slot/card "navigate" arrows)
	// must point the other way under RTL. Driven by the active locale so it
	// flips on language switch without touching LTR rendering.
	const isRtl = $derived(currentLocale.value === 'ar');

	let loadingDates = $state(false);
	let loadingSlots = $state(false);
	let loadingAlternative = $state(false);
	let loadingExperiences = $state(false);

	// The day's slots grouped by service (Zenchef-style). Each group carries the
	// full owning service so picking a slot can set `selection.service` from the
	// group — the booking pipeline still needs serviceId, we just stop asking the
	// user for it. Replaces the old flat `services` + `slots` arrays.
	type ServiceGroup = {
		service: NonNullable<typeof selection.service>;
		slots: NonNullable<typeof selection.slot>[];
	};
	let groups = $state<ServiceGroup[]>([]);
	let experiences = $state<NonNullable<typeof selection.experience>[]>([]);
	let disabledDates = $state<Date[]>([]);
	let maxCalendarDate = $state<Date | undefined>(undefined);

	const isModifying = $derived(!!reservation.id);

	// PRD: max party size bookable from the widget. Above this is a group request
	// routed to the restaurant (notice rendered under the pax step).
	const MAX_WIDGET_PAX = 14;

	const reserveDisabled = $derived(
		!selection.pax ||
			!selection.date ||
			!selection.slot ||
			// `selection.service` is set from the chosen slot's group, so it is always
			// present once a slot is picked — kept as a safety net (Contact's deposit
			// notice + Booking read it).
			!selection.service ||
			((selection.slot?.state === 'FULL' || selection.slot?.state === 'CLOSED') &&
				!waitlist.isWaitlist) ||
			loadingDates ||
			loadingSlots ||
			loadingExperiences ||
			(experiences.length > 0 && !selection.experience)
	);

	// Slots shown for a group: hide CLOSED; show FULL only when waitlist is on and
	// we're not modifying. Shared by the renderer and the empty-group filter so
	// both agree on what "this group has nothing to show" means.
	const visibleSlotsOf = (group: ServiceGroup) =>
		group.slots.filter((s) => {
			if (s.state === 'CLOSED') return false;
			if (s.state === 'FULL') {
				if (isModifying) return false;
				return !!(group.service.waitlistEnabled || s.waitlistEnabled);
			}
			return true;
		});

	// Owner-curated alternative (sibling) restaurants, shown at the bottom of
	// the slot step when no slot is available. The RPC returns the resolved
	// list (already same-group + live, in stored order) or `[]`.
	type WidgetAlternative = WidgetAlternativeRestaurantResponseDTO;
	let alternatives = $state<WidgetAlternative[]>([]);

	// Which card's full-description popover is open. Desktop has hover, but touch
	// doesn't — tapping the ⓘ opens a small popover (bottom-right of the card)
	// with the full text, identical on web and mobile. Keyed with a prefix so
	// alternative + experience cards share one slot without collision; only one
	// is open at a time. null = none open.
	let openDesc = $state<string | null>(null);
	const toggleDesc = (e: Event, key: string) => {
		// The ⓘ lives inside the card's <button>; stop the tap from also firing
		// the card's navigate/select handler.
		e.stopPropagation();
		e.preventDefault();
		openDesc = openDesc === key ? null : key;
	};
	const toggleDescKey = (e: KeyboardEvent, key: string) => {
		if (e.key === 'Enter' || e.key === ' ') {
			toggleDesc(e, key);
		}
	};

	// Fetch the whole day's slots (all services at once) and group them by
	// service. Replaces getServices + getServiceSlots. Requires a chosen pax (the
	// API has no pax filter — it's applied client-side per service inside the
	// RPC). Past slots and already-ended services are pruned here (timezone/now
	// dependent), then groups with nothing visible are dropped.
	const getDaySlots = async () => {
		if (!selection.date || !selection.pax || loadingSlots) {
			return;
		}
		loadingSlots = true;
		alternatives = []; // Reset alternatives when fetching new slots
		const dateStr = zonedDateUtils.format('YYYY-MM-DD', selection.date);
		const [res, error] = await api.getDaySlots({
			restaurantId,
			date: dateStr,
			pax: selection.pax,
			isModifying
		});
		if (error || !res) {
			console.log(error);
			groups = [];
			loadingSlots = false;
			return;
		}
		// The RPC return is structurally a ServiceGroup[] (LegacyService/LegacySlot
		// ⊇ the selection types via their index signatures); name it so the
		// map/filter callbacks below are typed rather than implicit-any.
		const dayGroups = res as ServiceGroup[];
		groups = dayGroups
			.map((g) => ({
				service: g.service,
				slots: g.slots.filter((s) => !isSlotPast(s, zonedDateUtils.timezone))
			}))
			.filter((g) => !isServiceEnded(g.service, dateStr, zonedDateUtils.timezone))
			.filter((g) => visibleSlotsOf(g).length > 0);

		// Restore an in-flight selection coming from a modify/preselect deep-link
		// (replaces the old per-step serviceId/startDate restore in getServices/
		// getServiceSlots), then re-bind any already-chosen slot after a refetch.
		if (reservationTemp.serviceId || reservationTemp.startDate) {
			resolveSelectionFromTemp();
		}
		if (selection.slot) {
			reResolveChosenSlot();
		}

		loadingSlots = false;

		// When no slot is available across any service, surface the owner-curated
		// sibling restaurants (if any) at the bottom of the slot step.
		const hasAvailableSlot = groups.some((g) =>
			g.slots.some((slot) => slot.state !== 'FULL' && slot.state !== 'CLOSED')
		);
		if (!hasAvailableSlot) {
			loadWidgetAlternatives();
		}
	};

	// Find the group whose service matches `reservationTemp.serviceId` and the
	// slot matching `reservationTemp.startDate`, and set BOTH selection.slot and
	// selection.service. This is what keeps the modify + alternative-restaurant
	// preselect flows working now that there is no explicit service step.
	const resolveSelectionFromTemp = () => {
		if (reservationTemp.pax && !selection.pax) {
			selection.pax = reservationTemp.pax;
		}
		let targetGroup = reservationTemp.serviceId
			? groups.find((g) => g.service.id === reservationTemp.serviceId)
			: undefined;

		if (reservationTemp.startDate) {
			const td = reservationTemp.startDate;
			// Prefer the slot inside the matching service group; fall back to any
			// group so a stale serviceId never strands an otherwise-valid slot.
			const searchGroups = targetGroup ? [targetGroup] : groups;
			for (const g of searchGroups) {
				const found = g.slots.find((s) => s.date === td.date && s.time === td.time);
				if (found) {
					selection.slot = found;
					selection.service = g.service;
					break;
				}
			}
			reservationTemp.startDate = null;
		} else if (targetGroup) {
			selection.service = targetGroup.service;
		}
		reservationTemp.serviceId = null;
	};

	// After a refetch (pax/date change), the previously chosen slot object is
	// stale. Re-bind it (and its owning service) from the fresh groups, or clear
	// both if it vanished or became unavailable.
	const reResolveChosenSlot = () => {
		const cur = selection.slot;
		if (!cur) return;
		for (const g of groups) {
			const found = g.slots.find((s) => s.date === cur.date && s.time === cur.time);
			if (found) {
				const unavailable = found.state === 'FULL' || found.state === 'CLOSED';
				if (unavailable && !waitlist.isWaitlist) {
					selection.slot = null;
					selection.service = null;
				} else {
					selection.slot = found;
					selection.service = g.service;
				}
				return;
			}
		}
		selection.slot = null;
		selection.service = null;
	};

	const fetchDisabledDates = async () => {
		loadingDates = true;
		const today = new Date();
		const startDate = zonedDateUtils.format('YYYY-MM-DD', today);
		const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 120);
		const endDate = zonedDateUtils.format('YYYY-MM-DD', end);
		const [res, error] = await api.getAvailableDates({
			restaurantId,
			startDate,
			endDate,
			timezone: zonedDateUtils.timezone
		});
		if (error || !res) {
			loadingDates = false;
			return;
		}
		const availableSet = new Set(res);
		const disabled: Date[] = [];
		const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const endTime = end.getTime();
		while (cursor.getTime() <= endTime) {
			const y = cursor.getFullYear();
			const m = String(cursor.getMonth() + 1).padStart(2, '0');
			const d = String(cursor.getDate()).padStart(2, '0');
			const dateStr = `${y}-${m}-${d}`;
			if (!availableSet.has(dateStr)) {
				disabled.push(new Date(cursor.getTime()));
			}
			cursor.setDate(cursor.getDate() + 1);
		}
		disabledDates = disabled;
		maxCalendarDate = end;
		loadingDates = false;
	};

	// Segments for the horizontal step bar (replaces the vertical accordion). Same
	// step order, icons, labels, gating and loading flags the accordion used —
	// plus a `value` derived from `selection` so a completed step shows its chosen
	// value (and a caret to re-open it) instead of the prompt. The experiences
	// segment is appended only when the chosen slot's service offers any, so the
	// bar shows 3 or 4 segments. Index parity with openedAccordion.index is kept:
	// date(0) → pax(1) → slots(2) → experiences(3).
	const steps = $derived([
		{
			id: 'date',
			icon: Calendar,
			label: m.selection_pickDate(),
			value: selection.date ? zonedDateUtils.format('ddd DD MMM', selection.date) : null,
			loading: loadingDates
		},
		{
			id: 'pax',
			icon: ForkKnife,
			label: m.selection_pickPax(),
			value: selection.pax ? m.selection_paxCount({ pax: selection.pax }) : null,
			loading: loadingSlots,
			disabled: !selection.date
		},
		{
			id: 'slots',
			icon: Clock,
			label: m.selection_pickTime(),
			value: selection.slot ? selection.slot.time : null,
			loading: loadingSlots,
			disabled: !selection.date || !selection.pax
		},
		...(experiences.length > 0
			? [
					{
						id: 'experiences',
						icon: Sparkle,
						label: m.selection_pickExperience(),
						value: selection.experience
							? getTranslation(selection.experience.name, currentLocale.value)
							: null,
						loading: loadingExperiences,
						disabled: !selection.date || !selection.pax || !selection.slot
					}
				]
			: [])
	]);

	// New step order (no service step): date(0) → pax(1) → slots(2) → experiences(3).
	const openAccordion = () => {
		if (selection.date === null) {
			openedAccordion.index = 0;
		} else if (selection.pax === null) {
			openedAccordion.index = 1;
		} else if (selection.slot === null) {
			openedAccordion.index = 2;
		} else if (experiences.length > 0 && selection.experience === null) {
			// Optional experiences step (index 3, only present when the chosen
			// slot's service has experiences) — surface it once a slot is picked.
			openedAccordion.index = 3;
		} else {
			openedAccordion.index = null;
		}
	};

	onMount(async () => {
		await fetchDisabledDates();

		if (reservationTemp.startDate) {
			selection.date = parseSlotDateAsCalendarDate(reservationTemp.startDate.date);
		}
		// getDaySlots needs pax up front (the API has no pax filter); seed it from
		// the modify/preselect temp before the first fetch.
		if (reservationTemp.pax && !selection.pax) {
			selection.pax = reservationTemp.pax;
		}

		if (selection.date && selection.pax) {
			// Restores selection.slot + selection.service from temp via
			// resolveSelectionFromTemp.
			await getDaySlots();
			// Modify flow: the restored service's experiences were never loaded —
			// load-bearing now that picking one is mandatory whenever any are offered.
			await getExperiences();
		}

		if (accordionToOpen.index !== null) {
			openedAccordion.index = accordionToOpen.index;
			accordionToOpen.index = null;
		} else {
			openAccordion();
		}
	});

	const onDateChange = async () => {
		// New date → the chosen service/slot/experience no longer apply. Clear them,
		// then refetch the day's grouped slots (service + experiences are only known
		// once a slot is picked again).
		selection.slot = null;
		selection.service = null;
		selection.experience = null;
		experiences = [];
		resetWaitlist();
		if (selection.date && selection.pax) {
			await getDaySlots();
		} else {
			groups = [];
		}
	};

	// Load the experiences offered for the chosen shift on the chosen date
	// (the BFF filters by target shift + date range). Clears any
	// previously-picked experience that is no longer offered.
	const getExperiences = async () => {
		if (!selection.service || !selection.date) {
			experiences = [];
			selection.experience = null;
			return;
		}
		loadingExperiences = true;
		const [res, error] = await api.getExperiences({
			restaurantId,
			serviceId: selection.service.id,
			isStandard: selection.service.isStandard ?? true,
			date: zonedDateUtils.format('YYYY-MM-DD', selection.date)
		});
		if (error || !res) {
			experiences = [];
			selection.experience = null;
			loadingExperiences = false;
			return;
		}
		experiences = res;
		if (
			selection.experience !== null &&
			!experiences.find((e) => e.id === selection.experience?.id)
		) {
			selection.experience = null;
		}
		loadingExperiences = false;
	};

	const onPaxChange = async () => {
		// Pax affects availability — clear the chosen time and its service/experience
		// and refetch the day's slots for the new pax.
		selection.slot = null;
		selection.service = null;
		selection.experience = null;
		experiences = [];
		resetWaitlist();

		if (selection.date && selection.pax) {
			await getDaySlots();
		} else {
			groups = [];
		}
	};

	// Pick a time. The owning service travels in from the slot's group, so we set
	// both atomically — this is the mechanism that replaces the service step. The
	// service is now known, so its experiences can be fetched.
	const onSlotSelect = async (
		slot: NonNullable<typeof selection.slot>,
		service: NonNullable<typeof selection.service>
	) => {
		selection.slot = slot;
		selection.service = service;
		resetWaitlist();
		pushGtmEvent('slot_selected', {
			slot_time: slotKey(slot.date, slot.time),
			availability: slot.state
		});
		await getExperiences();
		// Picking a time is the final SELECTION decision unless the service offers
		// experiences (a mandatory pick when present). With nothing left to choose,
		// go straight to CONTACT — same jump the waitlist path makes — instead of
		// waiting on the bottom "Book" button. Otherwise open the experiences step.
		if (experiences.length === 0) {
			nextStep();
		} else {
			openAccordion();
		}
	};

	// Resolve the service group that owns a given slot (by date+time).
	const groupForSlot = (slot: Slot): ServiceGroup | undefined =>
		groups.find((g) =>
			g.slots.some((s) => slotKey(s.date, s.time) === slotKey(slot.date, slot.time))
		);

	// Fetch the owner-curated sibling restaurants for the no-slot path. The RPC
	// self-gates (returns [] when disabled or ungrouped) and never throws.
	const loadWidgetAlternatives = async () => {
		loadingAlternative = true;
		alternatives = [];
		const [res, error] = await api.getWidgetAlternatives({ restaurantId });
		if (!error && res && res.length > 0) {
			alternatives = res;
			pushGtmEvent('alternative_restaurants_shown', {
				original_restaurant_id: restaurantId,
				alternative_restaurant_count: res.length
			});
		}
		loadingAlternative = false;
	};

	// Navigate to a sibling restaurant's own booking widget, carrying the
	// current date/pax selection like the old buildAlternativeWidgetUrl did.
	const goToAlternative = (alt: WidgetAlternative) => {
		pushGtmEvent('alternative_restaurant_clicked', {
			original_restaurant_id: restaurantId,
			alternative_restaurant_id: alt.id,
			alternative_restaurant_name: alt.name
		});
		const url = new URL(alt.widgetLink);
		if (selection.date)
			url.searchParams.set('date', zonedDateUtils.format('YYYY-MM-DD', selection.date));
		if (selection.pax) url.searchParams.set('pax', String(selection.pax));
		window.location.href = url.toString();
	};

	// Get alternative slots from across ALL of the day's services (available slots
	// only) — not just the unavailable slot's own service. handleSelectAlternative
	// resolves the owning service from the picked slot's group, so a cross-service
	// alternative still sets selection.service correctly.
	const getAlternativeSlots = (unavailableSlot: Slot): Slot[] => {
		return groups
			.flatMap((g) => g.slots)
			.filter(
				(slot) =>
					slot.state !== 'FULL' &&
					slot.state !== 'CLOSED' &&
					slotKey(slot.date, slot.time) !== slotKey(unavailableSlot.date, unavailableSlot.time)
			);
	};

	// Handle click on an unavailable slot
	const handleUnavailableSlotClick = (slot: Slot) => {
		waitlist.selectedUnavailableSlot = slot;
		// Surface owner-curated sibling restaurants on the waitlist prompt too,
		// not only on the empty-slots path. Self-gates and never throws.
		loadWidgetAlternatives();
	};

	// Handle joining the waitlist
	const handleJoinWaitlist = () => {
		if (waitlist.selectedUnavailableSlot) {
			const slot = waitlist.selectedUnavailableSlot;
			selection.slot = slot;
			// The booking + Contact's deposit notice need the owning service.
			const owner = groupForSlot(slot);
			if (owner) selection.service = owner.service;
			joinWaitlist();
			waitlist.selectedUnavailableSlot = null;
			pushGtmEvent('slot_selected', {
				slot_time: slotKey(slot.date, slot.time),
				availability: 'WAITLIST'
			});
			nextStep();
		}
	};

	// Handle selecting an alternative slot — reuse the unified picker so the
	// owning service is set the same way as a normal pick.
	const handleSelectAlternative = (slot: Slot) => {
		const owner = groupForSlot(slot);
		if (owner) {
			onSlotSelect(slot, owner.service);
		}
	};

	// Handle going back from waitlist prompt
	const handleBackFromWaitlist = () => {
		waitlist.selectedUnavailableSlot = null;
	};
</script>

{#snippet alternativesSection()}
	{#if loadingAlternative}
		<div class="flex flex-col items-center justify-center gap-2 py-4">
			<Spinner />
			<div class="text-xs text-center opacity-70">{m.selection_searchingAlternatives()}</div>
		</div>
	{:else if alternatives.length > 0}
		<div class="w-full px-4 pt-3 pb-4">
			<p class="text-xs opacity-70 mb-2">{m.selection_tryAlternativeRestaurants()}</p>
			<div class="flex flex-col gap-2">
				{#each alternatives as alt (alt.id)}
					{@const altOpen = openDesc === `alt:${alt.id}`}
					<button
						onclick={() => goToAlternative(alt)}
						class="themed-border relative flex w-full aspect-[2/1] rounded border-2 text-left rtl:text-right transition-all {altOpen
							? 'z-20'
							: ''}"
						aria-label={alt.name}
					>
						<!-- Photo + scrim clip to the rounded card; the description popover
						     escapes this so a long description is never cut off. -->
						<span class="absolute inset-0 overflow-hidden rounded">
							{#if alt.coverUrl}
								<img
									src={alt.coverUrl}
									alt={alt.name}
									class="absolute inset-0 w-full h-full object-cover"
								/>
							{:else}
								<span
									class="absolute inset-0 bg-white bg-opacity-10 flex items-center justify-center"
								>
									<span class="text-2xl font-semibold opacity-60">
										{alt.name.slice(0, 2).toUpperCase()}
									</span>
								</span>
							{/if}
							<!-- Bottom scrim keeps the name legible over any cover photo. -->
							<span
								class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pt-8 pb-2 text-white"
							>
								<span class="flex flex-col min-w-0">
									<span class="flex items-baseline gap-1.5 min-w-0">
										<b class="text-sm leading-tight truncate drop-shadow">{alt.name}</b>
										{#if alt.city}
											<span class="text-xs opacity-80 shrink-0 drop-shadow">{alt.city}</span>
										{/if}
									</span>
									{#if alt.description}
										<span class="flex items-center gap-1 min-w-0 text-xs opacity-80 drop-shadow">
											<span class="truncate">{alt.description}</span>
										</span>
									{/if}
								</span>
								<!-- Right cluster: info button then the navigate arrow flush in the
								     corner. The info button reveals the full description in a popover
								     (tap/click on web + mobile); the popover escapes the photo clip
								     below so a long description is never cut off. -->
								<span class="flex shrink-0 items-center gap-1.5">
									{#if alt.description}
										<span
											role="button"
											tabindex="0"
											aria-label={alt.description}
											onclick={(e) => toggleDesc(e, `alt:${alt.id}`)}
											onkeydown={(e) => toggleDescKey(e, `alt:${alt.id}`)}
											class="z-30 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-90 cursor-pointer hover:bg-black/75"
										>
											<Info size={14} />
										</span>
									{/if}
									<ArrowRight size={16} class="drop-shadow rtl:-scale-x-100" />
								</span>
							</span>
						</span>

						{#if altOpen}
							<span
								class="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 z-40 max-w-[85%] rounded-md bg-black/90 px-3 py-2 text-xs leading-snug text-white shadow-lg"
							>
								{alt.description}
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
{/snippet}

<div class="flex flex-col flex-grow min-h-0">
	{#if openDesc !== null}
		<!-- Backdrop: tapping anywhere outside an open description popover closes
		     it. Sits below the open card (z-20) + popover (z-30/40) but above the
		     rest of the widget so outside taps are caught. -->
		<div class="fixed inset-0 z-10" role="presentation" onclick={() => (openDesc = null)}></div>
	{/if}
	<!-- Horizontal step bar (replaces the vertical accordion): the three (or four)
	     steps read across one row, freeing the full width below for the active
	     step's content. Selecting a value-bearing segment just moves the active
	     index — the same thing the accordion's oneAtATime toggle did. -->
	<div class="px-3 pt-3">
		<StepBar
			{steps}
			activeIndex={openedAccordion.index}
			onSelect={(i) => (openedAccordion.index = i)}
			{theme}
		/>
	</div>

	<!-- Active step's content. Branches on openedAccordion.index (same indices the
	     bar uses); each branch carries the padding/layout the accordion item's
	     contentClass used to apply. Scrolls within the widget like the accordion
	     body did. While the active step is loading, show the same centered spinner. -->
	<div class="flex-grow min-h-0 overflow-y-auto">
		{#if openedAccordion.index === 0}
			<div class="flex flex-wrap gap-2 justify-center px-5 py-2">
				<div class="flex flex-col w-full gap-2">
					{#if !loadingDates}
						<ZonedCalendarInput
							{zonedDateUtils}
							type="calendar"
							view="single"
							headerClass="flex justify-between items-center font-light"
							weekdayClass="flex items-center justify-center pb-2 font-normal"
							gridClass="gap-2"
							dayClass="font-semibold data-[in-month=false]:pointer-events-none data-[disabled=true]:opacity-30 data-[disabled=true]:pointer-events-none data-[in-month=false]:opacity-25  rounded-sm data-[in-month=true]:border-2 hover:bg-white hover:bg-opacity-15"
							class="w-full"
							buttons={{
								prev: {
									icon: isRtl ? ArrowRight : ArrowLeft,
									color: theme.fontColor
								},
								next: {
									icon: isRtl ? ArrowLeft : ArrowRight,
									color: theme.fontColor
								}
							}}
							containerClass="w-full gap-3"
							value={selection.date}
							{disabledDates}
							minDate={new Date(new Date().setDate(new Date().getDate() - 1))}
							maxDate={maxCalendarDate}
							onChange={(date: Date | null) => {
								if (date === null) return;
								selection.date = new Date(date.getTime());
								pushGtmEvent('date_selected', {
									date: selection.date.toISOString()
								});
								onDateChange().then(() => {
									openAccordion();
								});
							}}
						/>
					{/if}
				</div>
			</div>
		{:else if openedAccordion.index === 1}
			{@const paxLocked =
				reservation.paymentStatus === 'requires_capture' || !!reservation.stripeSetupIntentId}
			<div class="flex flex-wrap gap-2 justify-center pt-2 pb-5 px-5">
				{#each Array.from({ length: MAX_WIDGET_PAX }, (_, i) => i + 1) as pax}
					<button
						data-active={pax === selection.pax}
						disabled={paxLocked && pax !== selection.pax}
						onclick={() => {
							selection.pax = pax;
							pushGtmEvent('pax_selected', {
								pax
							});
							onPaxChange().then(() => {
								openAccordion();
							});
						}}
						class="themed-border flex items-center justify-center p-5 rounded w-10 h-10 text-base font-semibold border-2 disabled:opacity-30 disabled:cursor-not-allowed"
					>
						{pax}
					</button>
				{/each}
				{#if paxLocked}
					<p class="w-full text-xs opacity-70 mt-2 px-1">
						{m.selection_paxLockedByPayment({
							phone: widgetCtx.restaurant.phone ?? '',
							email: widgetCtx.restaurant.email ?? ''
						})}
					</p>
				{:else if widgetCtx.restaurant.phone || widgetCtx.restaurant.email}
					<!-- Above MAX_WIDGET_PAX is a group request: persistent notice routing
					     the guest to the restaurant. No longer gated on a chosen service
					     (there is none at the pax step now). -->
					{@const phone = widgetCtx.restaurant.phone}
					{@const email = widgetCtx.restaurant.email}
					{@const phonePart = phone
						? `<a href="tel:${phone}" style="text-decoration:underline;opacity:1;font-weight:bold">${phone}</a>`
						: ''}
					{@const emailPart = email
						? `<a href="mailto:${email}" style="text-decoration:underline;opacity:1;font-weight:bold">${email}</a>`
						: ''}
					{@const contactInfo = [phonePart, emailPart]
						.filter(Boolean)
						.join(` ${m.selection_or()} `)}
					<p class="w-full text-xs opacity-70 mt-2 px-1">
						{@html m.selection_groupContactNotice({ maxPax: String(MAX_WIDGET_PAX), contactInfo })}
					</p>
				{/if}
			</div>
		{:else if openedAccordion.index === 2}
			{@const hasAvailableSlots = groups.some((g) =>
				g.slots.some((slot) => slot.state !== 'FULL' && slot.state !== 'CLOSED')
			)}
			<div class="flex flex-wrap gap-2 justify-center">
				<div class="w-full">
					{#if waitlist.selectedUnavailableSlot}
						<!-- Waitlist prompt for unavailable slot -->
						{@const alternativeSlots = getAlternativeSlots(waitlist.selectedUnavailableSlot)}
						<div class="flex flex-col gap-3 px-5 py-3">
							<div class="text-center">
								<p class="text-base font-semibold mb-1">{m.selection_slotUnavailable()}</p>
								<p class="text-xs opacity-60">
									{m.selection_slotUnavailableDetails({
										time: waitlist.selectedUnavailableSlot.time,
										pax: selection.pax ?? 0
									})}
								</p>
							</div>

							{#if alternativeSlots.length > 0}
								<div class="flex flex-col gap-2">
									<p class="text-xs opacity-70 text-center">{m.selection_alternativeSlots()}</p>
									<div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
										{#each alternativeSlots as altSlot}
											<button
												onclick={() => handleSelectAlternative(altSlot)}
												class="themed-border flex items-center justify-center px-2 py-1.5 text-base font-semibold rounded border-2 transition-all"
											>
												{altSlot.time}
											</button>
										{/each}
									</div>
								</div>

								<div class="flex items-center w-full py-1">
									<div class="flex-1 h-px bg-white bg-opacity-10"></div>
									<span class="px-2 text-xs opacity-30">{m.selection_or()}</span>
									<div class="flex-1 h-px bg-white bg-opacity-10"></div>
								</div>
							{/if}

							<button
								onclick={handleJoinWaitlist}
								class="themed-border w-full px-4 py-3 rounded border transition-all text-sm font-medium"
							>
								{m.selection_joinWaitlist()}
							</button>

							<button
								onclick={handleBackFromWaitlist}
								class="w-full px-4 py-2 text-sm opacity-70 hover:opacity-100 transition-all"
							>
								{m.selection_backToSelection()}
							</button>

							<!-- Owner-curated sibling restaurants, as a secondary
							     "book elsewhere" fallback on the waitlist path. -->
							{#if loadingAlternative || alternatives.length > 0}
								{@render alternativesSection()}
							{/if}
						</div>
					{:else if groups.length > 0}
						<!-- All of the day's slots as a compact grid (TheFork-style): no
						     service-name headers — each service's times are a grid, divided
						     from the next by a thin separator. The user picks a time;
						     onSlotSelect sets the owning service. -->
						{@const visibleGroups = groups.filter((g) => visibleSlotsOf(g).length > 0)}
						<div class="flex flex-col gap-3 px-5 py-3">
							{#each visibleGroups as group, i (group.service.id)}
								{#if i > 0}
									<div class="separator-h my-1"></div>
								{/if}
								<div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
									{#each visibleSlotsOf(group) as slot (slotKey(slot.date, slot.time))}
										{@const isUnavailable = slot.state === 'FULL' || slot.state === 'CLOSED'}
										<button
											data-active={selection.slot
												? slotKey(slot.date, slot.time) ===
													slotKey(selection.slot.date, selection.slot.time)
												: false}
											onclick={() => {
												if (isUnavailable) {
													handleUnavailableSlotClick(slot);
												} else {
													onSlotSelect(slot, group.service);
												}
											}}
											class="themed-border flex items-center justify-center px-2 py-1.5 text-base font-semibold rounded border-2 transition-all"
										>
											{slot.time}
										</button>
									{/each}
								</div>
							{/each}
						</div>

						<!-- Owner-curated sibling restaurants when all slots are unavailable -->
						{#if !hasAvailableSlots}
							{@render alternativesSection()}
						{/if}
					{:else}
						<!-- No slots at all -->
						<div class="flex flex-col items-center w-full">
							{#if loadingSlots}
								<!-- Show nothing while loading slots -->
							{:else}
								<div class="flex flex-col items-center py-4 px-4 w-full">
									<p class="text-base font-semibold mb-1">{m.selection_noSlotsAvailable()}</p>
									<p class="text-xs text-center opacity-50 mb-3">
										{m.selection_noTablesTryAnotherDate()}
									</p>
									<button
										onclick={() => {
											openedAccordion.index = 0;
										}}
										class="themed-border w-full flex items-center justify-between px-3 py-2 rounded border transition-all"
									>
										<div class="flex items-center gap-2">
											<Calendar size={16} class="opacity-60" />
											<span class="text-xs">{m.selection_chooseAnotherDate()}</span>
										</div>
										<ArrowRight size={14} class="opacity-40 rtl:-scale-x-100" />
									</button>
								</div>
								{@render alternativesSection()}
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{:else if openedAccordion.index === 3}
			<div class="flex flex-wrap gap-3 justify-center px-5 py-3">
				<div class="flex flex-col gap-3 w-full px-4">
					{#each experiences as experience (experience.id)}
						{@const active = experience.id === selection.experience?.id}
						{@const expOpen = openDesc === `exp:${experience.id}`}
						{@const hasNote = !!experience.note?.length}
						<button
							data-active={active}
							onclick={() => {
								selection.experience = active ? null : experience;
								pushGtmEvent('experience_selected', {
									experience_id: experience.id,
									experience_name: getTranslation(experience.name, currentLocale.value)
								});
								// Picking an experience is the last SELECTION decision — advance to
								// CONTACT like a slot pick does. Deselecting (toggling off) just
								// re-opens the accordion and waits.
								if (selection.experience) {
									nextStep();
								} else {
									openAccordion();
								}
							}}
							class="themed-border relative flex w-full aspect-[2/1] rounded border-2 text-left rtl:text-right transition-all data-[active=true]:ring-2 data-[active=true]:ring-offset-1 {expOpen
								? 'z-20'
								: ''}"
							aria-label={getTranslation(experience.name, currentLocale.value)}
						>
							<!-- Photo + scrim clip to the rounded card; the note popover escapes this
							     so a long note is never cut off. -->
							<span class="absolute inset-0 overflow-hidden rounded">
								{#if experience.imageUrl}
									<img
										src={experience.imageUrl}
										alt={getTranslation(experience.name, currentLocale.value)}
										class="absolute inset-0 w-full h-full object-cover"
									/>
								{:else}
									<span
										class="absolute inset-0 bg-white bg-opacity-10 flex items-center justify-center"
									>
										<Sparkle size={24} class="opacity-40" />
									</span>
								{/if}
								<!-- Bottom scrim carries the name, note and per-guest price in-picture. -->
								<span
									class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pt-8 pb-2 text-white"
								>
									<span class="flex flex-col min-w-0">
										<b class="text-sm leading-tight truncate drop-shadow" dir="auto">
											{getTranslation(experience.name, currentLocale.value)}
										</b>
										{#if hasNote}
											<span class="flex items-center gap-1 min-w-0 text-xs opacity-80 drop-shadow">
												<span class="truncate"
													>{getTranslation(experience.note, currentLocale.value)}</span
												>
											</span>
										{/if}
									</span>
									<!-- Right cluster: info button then the per-guest price flush in the
									     corner — same arrangement as the alternative card (ⓘ left of the
									     trailing element). The info button reveals the full note in a
									     popover that escapes the photo clip below. -->
									<span class="flex shrink-0 items-center gap-1.5">
										{#if hasNote}
											<span
												role="button"
												tabindex="0"
												aria-label={getTranslation(experience.note, currentLocale.value)}
												onclick={(e) => toggleDesc(e, `exp:${experience.id}`)}
												onkeydown={(e) => toggleDescKey(e, `exp:${experience.id}`)}
												class="z-30 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-90 cursor-pointer hover:bg-black/75"
											>
												<Info size={14} />
											</span>
										{/if}
										<span class="text-sm font-semibold whitespace-nowrap drop-shadow" dir="auto">
											{m.selection_experiencePricePerGuest({
												price: (experience.priceCents / 100).toLocaleString(undefined, {
													style: 'currency',
													currency: 'EUR'
												})
											})}
										</span>
									</span>
								</span>
							</span>

							{#if active}
								<!-- Selected badge: the data-active color-invert is hidden under the
								     photo, so surface selection with a visible check. -->
								<span
									class="absolute top-2 right-2 rtl:right-auto rtl:left-2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black shadow"
								>
									<Check size={14} weight="bold" />
								</span>
							{/if}

							{#if expOpen}
								<span
									class="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 z-40 max-w-[85%] rounded-md bg-black/90 px-3 py-2 text-xs leading-snug text-white shadow-lg"
								>
									{getTranslation(experience.note, currentLocale.value)}
								</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
	<div class="flex items-end p-3 mt-auto">
		{#if !reserveDisabled}
			<Button onclick={nextStep} className="uppercase"
				>{reservation.id ? m.selection_modifyButton() : m.selection_bookButton()}</Button
			>
		{/if}
	</div>
</div>
