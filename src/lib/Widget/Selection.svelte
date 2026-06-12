<script lang="ts">
	import {
		ArrowLeft,
		ArrowRight,
		Calendar,
		CallBell,
		Clock,
		ForkKnife,
		Sparkle
	} from 'phosphor-svelte';
	import AccordionGroup from '../AccordionGroup.svelte';
	import Button from './Button.svelte';
	import Spinner from '../Spinner.svelte';
	import { onMount } from 'svelte';
	import { api } from '$lib/widget-rpc-client';
	import { accordionToOpen, openedAccordion, selection } from '$lib/states/selection.svelte';
	import { nextStep } from '$lib/states/step.svelte';
	import { waitlist, resetWaitlist, joinWaitlist, type Slot } from '$lib/states/waitlist.svelte';
	import { formatTime, hours, minutes } from '$lib/utils/time';
	import { reservation, reservationTemp } from '$lib/states/reservation.svelte';
	import { getTranslation, useWidget, useZonedDateUtils } from '$lib/context.svelte';
	import ZonedCalendarInput from '$lib/utils/ZonedCalendarInput.svelte';
	import { parseSlotDateAsCalendarDate, slotKey } from '$lib/utils/slotFormat';
	import { isServiceEnded, isSlotPast } from '$lib/utils/pastFilter';
	import { pushGtmEvent } from '../gtm.svelte';
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

	let loadingServices = $state(false);
	let loadingDates = $state(false);
	let loadingSlots = $state(false);
	let loadingAlternative = $state(false);
	let loadingExperiences = $state(false);

	let services = $state<NonNullable<typeof selection.service>[]>([]);
	let slots = $state<NonNullable<typeof selection.slot>[]>([]);
	let experiences = $state<NonNullable<typeof selection.experience>[]>([]);
	let disabledDates = $state<Date[]>([]);
	let maxCalendarDate = $state<Date | undefined>(undefined);

	// Owner-curated alternative (sibling) restaurants, shown at the bottom of
	// the slot step when no slot is available. The RPC returns the resolved
	// list (already same-group + live, in stored order) or `[]`.
	type WidgetAlternative = Awaited<ReturnType<typeof api.getWidgetAlternatives>>[0][number];
	let alternatives = $state<WidgetAlternative[]>([]);

	const getServices = async () => {
		if (!selection.date || loadingServices) {
			return;
		}
		loadingServices = true;
		const [res, error] = await api.getServices({
			restaurantId,
			date: zonedDateUtils.format('YYYY-MM-DD', selection.date)
		});
		if (error) {
			console.log(error);
			services = [];
			loadingServices = false;
			return;
		}
		const dateStr = zonedDateUtils.format('YYYY-MM-DD', selection.date);
		services = res.filter(
			(s: NonNullable<typeof selection.service>) =>
				!isServiceEnded(s, dateStr, zonedDateUtils.timezone)
		);
		if (reservationTemp.serviceId) {
			const foundService = services.find((s) => s.id === reservationTemp.serviceId);
			if (foundService) {
				selection.service = foundService;
			}
			reservationTemp.serviceId = null;
		}
		if (reservationTemp.pax) {
			selection.pax = reservationTemp.pax;
			reservationTemp.pax = null;
		}
		if (selection.service !== null && !services.find((s) => s.id === selection.service?.id)) {
			selection.service = null;
		}

		console.log('services', services);
		loadingServices = false;
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

	const getServiceSlots = async () => {
		if (!selection.date || !selection.service || !selection.pax || loadingSlots) {
			return;
		}
		loadingSlots = true;
		alternatives = []; // Reset alternatives when fetching new slots
		const start = new Date();
		const [res, error] = await api.getServiceSlots({
			restaurantId,
			serviceId: selection.service.id,
			pax: selection.pax,
			date: zonedDateUtils.format('YYYY-MM-DD', selection.date),
			isModifying: !!reservation.id
		});
		if (error) {
			console.log(error);
			slots = [];
			loadingSlots = false;
			return;
		}
		slots = res.filter(
			(s: NonNullable<typeof selection.slot>) => !isSlotPast(s, zonedDateUtils.timezone)
		);
		if (reservationTemp.startDate) {
			const foundSlot = slots.find(
				(slot) =>
					slot.date === reservationTemp.startDate?.date &&
					slot.time === reservationTemp.startDate?.time
			);
			if (foundSlot) {
				selection.slot = foundSlot;
			}
			reservationTemp.startDate = null;
		}
		if (selection.slot !== null && slots.length > 0) {
			const foundSlot = slots.find(
				(slot) => slot.date === selection.slot?.date && slot.time === selection.slot?.time
			);
			const isUnavailable = foundSlot?.state === 'FULL' || foundSlot?.state === 'CLOSED';

			if (!foundSlot || (isUnavailable && !waitlist.isWaitlist)) {
				selection.slot = null;
			} else {
				selection.slot = foundSlot;
			}
		}
		loadingSlots = false;

		// When no slot is available, surface the owner-curated sibling
		// restaurants (if any) at the bottom of the slot step.
		const hasAvailableSlot = slots.some((slot) => slot.state !== 'FULL' && slot.state !== 'CLOSED');
		if (!hasAvailableSlot) {
			loadWidgetAlternatives();
		}
	};

	const openAccordion = () => {
		if (selection.date === null) {
			openedAccordion.index = 0;
		} else if (selection.service === null) {
			openedAccordion.index = 1;
		} else if (selection.pax === null) {
			openedAccordion.index = 2;
		} else if (selection.slot === null) {
			openedAccordion.index = 3;
		} else if (experiences.length > 0 && selection.experience === null) {
			// Optional experiences step (index 4, only present when the chosen
			// service has experiences) — surface it once a slot is picked.
			openedAccordion.index = 4;
		} else {
			openedAccordion.index = null;
		}
	};

	onMount(async () => {
		await fetchDisabledDates();

		if (reservationTemp.startDate) {
			selection.date = parseSlotDateAsCalendarDate(reservationTemp.startDate.date);
		}

		if (selection.date) {
			await getServices();
			if (selection.service && selection.pax) {
				await getServiceSlots();
			}
			// Modify flow: the restored service's experiences were never loaded
			// (only onServiceChange fetched them) — load-bearing now that picking
			// one is mandatory whenever any are offered.
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
		if (!selection.date) {
			selection.service = null;
			selection.slot = null;
		} else {
			await getServices();
			if (selection.service) {
				await getServiceSlots();
			}
		}
		// Refetch for the new date (the offered list is date-bounded). Date
		// cleared → service nulled above → this clears the list; service
		// vanished on the new date → getServices nulled it → same.
		await getExperiences();
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

	const onServiceChange = async () => {
		if (
			selection.service &&
			selection.pax &&
			(selection.service.minPaxPerReservation > selection.pax ||
				selection.service.maxPaxPerReservation < selection.pax)
		) {
			selection.pax = null;
		}

		if (!selection.service) {
			selection.slot = null;
		}

		// Reset waitlist state when service changes
		resetWaitlist();

		await getExperiences();

		if (selection.date && selection.service && selection.pax) {
			await getServiceSlots();
		}
	};

	const onPaxChange = async () => {
		selection.slot = null;
		resetWaitlist();

		if (selection.date && selection.service && selection.pax) {
			await getServiceSlots();
		}
	};

	const onSlotChange = async () => {};

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

	// Get alternative slots from the same service (available slots only)
	const getAlternativeSlots = (unavailableSlot: Slot): Slot[] => {
		return slots.filter(
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
			selection.slot = waitlist.selectedUnavailableSlot;
			joinWaitlist();
			waitlist.selectedUnavailableSlot = null;
			pushGtmEvent('slot_selected', {
				slot_time: slotKey(selection.slot.date, selection.slot.time),
				availability: 'WAITLIST'
			});
			nextStep();
		}
	};

	// Handle selecting an alternative slot
	const handleSelectAlternative = (slot: Slot) => {
		selection.slot = slot;
		resetWaitlist();
		pushGtmEvent('slot_selected', {
			slot_time: slotKey(slot.date, slot.time),
			availability: slot.state
		});
		onSlotChange().then(() => {
			openAccordion();
		});
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
			<div class="flex gap-3 overflow-x-auto pb-1">
				{#each alternatives as alt (alt.id)}
					<button
						onclick={() => goToAlternative(alt)}
						class="flex flex-col items-center gap-1.5 shrink-0 w-20 group"
						aria-label={alt.name}
					>
						<div
							class="w-20 h-20 rounded-xl overflow-hidden bg-white flex items-center justify-center transition-all group-hover:ring-2 group-hover:ring-white group-hover:ring-opacity-60"
						>
							{#if alt.coverUrl}
								<img src={alt.coverUrl} alt={alt.name} class="w-full h-full object-cover" />
							{:else}
								<span class="text-lg font-semibold text-black opacity-60">
									{alt.name.slice(0, 2).toUpperCase()}
								</span>
							{/if}
						</div>
						<span class="text-xs text-center w-full truncate">{alt.name}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
{/snippet}

<div class="flex flex-col flex-grow min-h-0">
	<AccordionGroup
		bind:openedAccordion={openedAccordion.index}
		oneAtATime
		className="flex-grow min-h-0 overflow-y-auto"
		items={[
			{
				id: 'date',
				icon: Calendar,
				title: selection.date
					? zonedDateUtils.format('dddd DD MMMM', selection.date)
					: m.selection_pickDate(),
				contentClass: 'flex flex-wrap gap-2 justify-center px-5 py-2',
				loading: loadingDates
			},
			{
				id: 'service',
				icon: CallBell,
				title: selection.service?.name[0].value || m.selection_pickService(),
				loading: loadingServices,
				contentClass: 'flex flex-wrap gap-2 justify-center',
				disabled: !selection.date
			},
			{
				id: 'pax',
				icon: ForkKnife,
				title: selection.pax ? m.selection_paxCount({ pax: selection.pax }) : m.selection_pickPax(),
				contentClass: 'flex flex-wrap gap-2 justify-center pt-2 pb-5 px-5',
				loading: loadingServices,
				disabled: !selection.date || !selection.service
			},
			{
				id: 'slots',
				icon: Clock,
				title: `${selection.slot ? selection.slot.time : m.selection_pickTime()}`,
				loading: loadingSlots,
				contentClass: 'flex flex-wrap gap-2 justify-center',
				disabled: !selection.date || !selection.service || !selection.pax
			},
			...(experiences.length > 0
				? [
						{
							id: 'experiences',
							icon: Sparkle,
							title: selection.experience
								? getTranslation(selection.experience.name)
								: m.selection_pickExperience(),
							loading: loadingExperiences,
							contentClass: 'flex flex-wrap gap-3 justify-center px-5 py-3',
							disabled: !selection.date || !selection.service || !selection.pax || !selection.slot
						}
					]
				: [])
		]}
	>
		{#snippet separator()}
			<div class="separator-h"></div>
		{/snippet}
		{#snippet content(item, next, previous, close)}
			{#if item.id === 'date'}
				<div class="flex flex-col w-full gap-2">
					{#if !loadingDates}
						<ZonedCalendarInput
							{zonedDateUtils}
							type="calendar"
							view="single"
							headerClass="flex justify-between items-center font-light"
							weekdayClass="flex items-center justify-center pb-2 font-normal"
							gridClass="gap-2"
							dayClass="data-[in-month=false]:pointer-events-none data-[disabled=true]:opacity-30 data-[disabled=true]:pointer-events-none data-[in-month=false]:opacity-25  rounded-sm data-[in-month=true]:border-2 hover:bg-white hover:bg-opacity-15"
							class="w-full"
							buttons={{
								prev: {
									icon: ArrowLeft,
									color: theme.fontColor
								},
								next: {
									icon: ArrowRight,
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
			{:else if item.id === 'service'}
				<div class="w-full">
					{#if services.length > 0}
						<div class="flex flex-col gap-2 px-5 py-2">
							{#each services as service (service.id)}
								<button
									data-active={service.id === selection.service?.id}
									onclick={() => {
										selection.service = service;
										pushGtmEvent('service_selected', {
											service_id: service.id,
											service_name: getTranslation(service.name),
											service_type: service.type
										});
										onServiceChange().then(() => {
											openAccordion();
										});
									}}
									class="themed-border flex flex-row items-center gap-2 min-w-0 px-4 py-2 text-base w-full rounded border-2 disabled:opacity-50 disabled:pointer-events-none"
								>
									<div class="flex items-center gap-2 shrink-0 whitespace-nowrap">
										<b>{getTranslation(service.name)}</b>
										<div>•</div>
										<div>
											{formatTime(service.startTime)} - {formatTime(service.endTime)}
										</div>
									</div>
									{#if service.description?.length > 0}
										<div
											class="text-sm truncate min-w-0 flex-1 text-left opacity-70 hidden md:block"
										>
											•&nbsp;{getTranslation(service.description)}
										</div>
									{/if}
								</button>
							{/each}
						</div>
					{:else if !loadingServices}
						<div class="flex flex-col items-center justify-center w-full gap-5 p-6">
							<div>{m.selection_noServiceToday()}</div>
							<Button
								onclick={() => {
									openedAccordion.index = 0;
								}}>{m.selection_chooseAnotherDay()}</Button
							>
						</div>
					{/if}
				</div>
			{:else if item.id === 'pax'}
				{@const paxLocked =
					reservation.paymentStatus === 'requires_capture' || !!reservation.stripeSetupIntentId}
				{#each Array.from({ length: (selection.service?.maxPaxPerReservation || 20) - (selection.service?.minPaxPerReservation || 0) + 1 }, (_, i) => i + (selection.service?.minPaxPerReservation || 1)) as pax}
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
						class="themed-border flex items-center justify-center p-5 rounded w-10 h-10 text-base border-2 disabled:opacity-30 disabled:cursor-not-allowed"
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
				{:else if selection.service && (widgetCtx.restaurant.phone || widgetCtx.restaurant.email)}
					{@const phone = widgetCtx.restaurant.phone}
					{@const email = widgetCtx.restaurant.email}
					{@const maxPax = selection.service.maxPaxPerReservation}
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
						{@html m.selection_groupContactNotice({ maxPax: String(maxPax), contactInfo })}
					</p>
				{/if}
			{:else if item.id === 'slots'}
				{@const hasAvailableSlots = slots.some(
					(slot) => slot.state !== 'FULL' && slot.state !== 'CLOSED'
				)}
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
									<div class="flex flex-col gap-2 max-h-[200px] overflow-auto">
										{#each alternativeSlots as altSlot}
											<button
												onclick={() => handleSelectAlternative(altSlot)}
												class="themed-border flex items-center justify-between gap-3 px-4 py-2 text-base w-full rounded border-2 transition-all"
											>
												<span>{altSlot.time}</span>
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
							     "or book elsewhere" fallback on the waitlist path. -->
							{#if loadingAlternative || alternatives.length > 0}
								<div class="flex items-center w-full py-1">
									<div class="flex-1 h-px bg-white bg-opacity-10"></div>
									<span class="px-2 text-xs opacity-30">{m.selection_or()}</span>
									<div class="flex-1 h-px bg-white bg-opacity-10"></div>
								</div>
								{@render alternativesSection()}
							{/if}
						</div>
					{:else if slots.length > 0}
						<!-- Regular slot list (all clickable, no color dots) -->
						{@const isModifying = !!reservation.id}
						{@const visibleSlots = slots.filter((s) => {
							if (s.state === 'CLOSED') return false;
							if (s.state === 'FULL') {
								if (isModifying) return false;
								return !!(selection.service?.waitlistEnabled || s.waitlistEnabled);
							}
							return true;
						})}
						<div class="flex flex-col gap-2 px-5 py-2">
							{#each visibleSlots as slot}
								{@const isUnavailable = slot.state === 'FULL' || slot.state === 'CLOSED'}
								{#key slotKey(slot.date, slot.time)}
									<button
										data-active={selection.slot
											? slotKey(slot.date, slot.time) ===
												slotKey(selection.slot.date, selection.slot.time)
											: false}
										onclick={() => {
											if (isUnavailable) {
												handleUnavailableSlotClick(slot);
											} else {
												selection.slot = slot;
												pushGtmEvent('slot_selected', {
													slot_time: slotKey(slot.date, slot.time),
													availability: slot.state
												});
												onSlotChange().then(() => {
													openAccordion();
												});
											}
										}}
										class="themed-border flex items-center justify-between gap-3 px-4 py-2 text-base w-full rounded border-2"
									>
										<div class="flex items-center gap-3">
											{slot.time}
										</div>
									</button>
								{/key}
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
										<ArrowRight size={14} class="opacity-40" />
									</button>
								</div>
								{@render alternativesSection()}
							{/if}
						</div>
					{/if}
				</div>
			{:else if item.id === 'experiences'}
				<div class="flex flex-wrap justify-center gap-3 w-full">
					{#each experiences as experience (experience.id)}
						{@const active = experience.id === selection.experience?.id}
						<button
							data-active={active}
							onclick={() => {
								selection.experience = active ? null : experience;
								pushGtmEvent('experience_selected', {
									experience_id: experience.id,
									experience_name: getTranslation(experience.name)
								});
								openAccordion();
							}}
							class="flex flex-col w-32 rounded-lg overflow-hidden border-2 hover:bg-white hover:bg-opacity-15 transition-all"
							aria-label={getTranslation(experience.name)}
						>
							<div
								class="w-full aspect-[4/3] bg-white bg-opacity-10 flex items-center justify-center overflow-hidden"
							>
								{#if experience.imageUrl}
									<img
										src={experience.imageUrl}
										alt={getTranslation(experience.name)}
										class="w-full h-full object-cover"
									/>
								{:else}
									<Sparkle size={24} class="opacity-40" />
								{/if}
							</div>
							<div class="flex flex-col gap-0.5 px-2 py-1.5 text-left">
								<b class="text-sm truncate">{getTranslation(experience.name)}</b>
								<span class="text-xs opacity-70">
									{(experience.priceCents / 100).toLocaleString(undefined, {
										style: 'currency',
										currency: 'EUR'
									})}
								</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		{/snippet}
	</AccordionGroup>
	<div class="flex items-end p-3 mt-auto">
		<Button
			onclick={nextStep}
			disabled={!selection.pax ||
				!selection.date ||
				!selection.service ||
				!selection.slot ||
				((selection.slot?.state === 'FULL' || selection.slot?.state === 'CLOSED') &&
					!waitlist.isWaitlist) ||
				loadingDates ||
				loadingSlots ||
				loadingServices ||
				loadingExperiences ||
				(experiences.length > 0 && !selection.experience)}
			>{reservation.id ? m.selection_modifyButton() : m.selection_bookButton()}</Button
		>
	</div>
</div>
