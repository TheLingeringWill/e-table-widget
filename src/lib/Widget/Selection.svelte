<script lang="ts">
	import { ArrowLeft, ArrowRight, Calendar, CallBell, Clock, ForkKnife } from 'phosphor-svelte';
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
	import { getTranslation, useZonedDateUtils } from '$lib/context.svelte';
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

	const zonedDateUtils = useZonedDateUtils();

	let loadingServices = $state(false);
	let loadingDates = $state(false);
	let loadingSlots = $state(false);
	let loadingAlternative = $state(false);

	let services = $state<NonNullable<typeof selection.service>[]>([]);
	let slots = $state<NonNullable<typeof selection.slot>[]>([]);

	// Alternative restaurant state
	type AlternativeResult = Awaited<ReturnType<typeof api.getAlternativeRestaurant>>[0];
	let alternativeRestaurant = $state<AlternativeResult | null>(null);

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

	const getServiceSlots = async () => {
		if (!selection.date || !selection.service || !selection.pax || loadingSlots) {
			return;
		}
		loadingSlots = true;
		alternativeRestaurant = null; // Reset alternative when fetching new slots
		const start = new Date();
		const [res, error] = await api.getServiceSlots({
			restaurantId,
			serviceId: selection.service.id,
			pax: selection.pax,
			date: zonedDateUtils.format('YYYY-MM-DD', selection.date)
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

		// Check if all slots are unavailable and trigger alternative search
		const hasAvailableSlot = slots.some((slot) => slot.state !== 'FULL' && slot.state !== 'CLOSED');
		if (!hasAvailableSlot && slots.length > 0) {
			searchAlternativeRestaurant();
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
		} else {
			openedAccordion.index = null;
		}
	};

	onMount(async () => {
		if (reservationTemp.startDate) {
			selection.date = parseSlotDateAsCalendarDate(reservationTemp.startDate.date);
		}

		if (selection.date) {
			await getServices();
			if (selection.service && selection.pax) {
				await getServiceSlots();
			}
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

	// Search for alternative restaurant when current restaurant is fully booked
	const searchAlternativeRestaurant = async () => {
		if (!selection.date || !selection.service || !selection.pax) return;

		// Use first slot time as reference, or service start time if no slots.
		// Both branches produce 'HH:MM' to match the new requestedTime schema.
		const referenceTime =
			slots.length > 0 ? slots[0].time : formatTime(selection.service.startTime);

		loadingAlternative = true;
		alternativeRestaurant = null;

		const [res, error] = await api.getAlternativeRestaurant({
			restaurantId,
			date: zonedDateUtils.format('YYYY-MM-DD', selection.date),
			serviceId: selection.service.id,
			pax: selection.pax,
			requestedTime: referenceTime
		});

		if (!error && res) {
			alternativeRestaurant = res;
			if (res.found) {
				pushGtmEvent('alternative_restaurant_shown', {
					original_restaurant_id: restaurantId,
					alternative_restaurant_id: res.restaurant.id,
					alternative_restaurant_name: res.restaurant.name,
					date: selection.date?.toISOString()
				});
			}
		}

		loadingAlternative = false;
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

	// Build URL for redirecting to alternative restaurant's widget
	const buildAlternativeWidgetUrl = (alt: NonNullable<AlternativeResult>) => {
		if (!alt.found || !selection.date) return '';

		// Base widget URL
		const baseUrl = `/${alt.restaurant.id}/${alt.restaurant.widgetId}`;

		// Add query parameters for pre-selection. The receiving widget's
		// Widget.svelte reads `date` (YYYY-MM-DD) and `time` (HH:MM) directly
		// into reservationTemp.startDate as strings.
		const params = new URLSearchParams();
		params.set('date', zonedDateUtils.format('YYYY-MM-DD', selection.date));
		params.set('serviceId', alt.service.id);
		params.set('pax', String(selection.pax));
		params.set('time', alt.slot.time);

		return `${baseUrl}?${params.toString()}`;
	};
</script>

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
			}
		]}
	>
		{#snippet separator()}
			<div class="separator-h"></div>
		{/snippet}
		{#snippet content(item, next, previous, close)}
			{#if item.id === 'date'}
				<div class="flex flex-col w-full gap-2">
					<ZonedCalendarInput
						{zonedDateUtils}
						type="calendar"
						view="single"
						headerClass="flex justify-between items-center font-light"
						weekdayClass="flex items-center justify-center pb-2 font-normal"
						gridClass="gap-2"
						dayClass="data-[in-month=false]:pointer-events-none data-[disabled=true]:opacity-30 data-[disabled=true]:pointer-events-none data-[in-month=false]:opacity-25  rounded-sm data-[in-month=true]:border hover:bg-white hover:bg-opacity-10 data-[selected=true]:bg-white data-[selected=true]:bg-opacity-50"
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
						minDate={new Date(new Date().setDate(new Date().getDate() - 1))}
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
									class="flex flex-row items-center gap-2 min-w-0 px-4 py-2 text-sm w-full rounded hover:bg-white hover:bg-opacity-5 border data-[active=true]:bg-white data-[active=true]:bg-opacity-30 disabled:opacity-50 disabled:pointer-events-none"
								>
									<div class="flex items-center gap-2 shrink-0 whitespace-nowrap">
										<b>{getTranslation(service.name)}</b>
										<div>•</div>
										<div>
											{formatTime(service.startTime)} - {formatTime(service.endTime)}
										</div>
									</div>
									{#if service.description?.length > 0}
										<div class="text-sm truncate min-w-0 flex-1 text-left opacity-70">
											•&nbsp;{getTranslation(service.description)}
										</div>
									{/if}
								</button>
							{/each}
						</div>
					{:else if !loadingServices}
						<div
							class="flex flex-col items-center justify-center w-full gap-5 p-6"
						>
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
				{#each Array.from({ length: (selection.service?.maxPaxPerReservation || 20) - (selection.service?.minPaxPerReservation || 0) + 1 }, (_, i) => i + (selection.service?.minPaxPerReservation || 1)) as pax}
					<button
						data-active={pax === selection.pax}
						onclick={() => {
							selection.pax = pax;
							pushGtmEvent('pax_selected', {
								pax
							});
							onPaxChange().then(() => {
								openAccordion();
							});
						}}
						class="flex items-center justify-center p-5 rounded hover:bg-white hover:bg-opacity-5 w-10 h-10 border data-[active=true]:bg-white data-[active=true]:bg-opacity-30"
					>
						{pax}
					</button>
				{/each}
			{:else if item.id === 'slots'}
				{@const hasAvailableSlots = slots.some(
					(slot) => slot.state !== 'FULL' && slot.state !== 'CLOSED'
				)}
				<div class="w-full">
					{#if waitlist.selectedUnavailableSlot}
						<!-- Waitlist prompt for unavailable slot -->
						{@const alternatives = getAlternativeSlots(waitlist.selectedUnavailableSlot)}
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

							{#if alternatives.length > 0}
								<div class="flex flex-col gap-2">
									<p class="text-xs opacity-70 text-center">{m.selection_alternativeSlots()}</p>
									<div class="flex flex-col gap-2 max-h-[200px] overflow-auto">
										{#each alternatives as altSlot}
											<button
												onclick={() => handleSelectAlternative(altSlot)}
												class="flex items-center justify-between gap-3 px-4 py-2 text-sm w-full rounded border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-all"
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
								class="w-full px-4 py-3 rounded border border-white border-opacity-30 hover:bg-white hover:bg-opacity-10 transition-all text-sm font-medium"
							>
								{m.selection_joinWaitlist()}
							</button>

							<button
								onclick={handleBackFromWaitlist}
								class="w-full px-4 py-2 text-sm opacity-70 hover:opacity-100 transition-all"
							>
								{m.selection_backToSelection()}
							</button>
						</div>
					{:else if slots.length > 0}
						<!-- Regular slot list (all clickable, no color dots) -->
						{@const visibleSlots = slots.filter((s) => {
							if (s.state === 'CLOSED') return false;
							if (s.state === 'FULL') {
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
										class="flex items-center justify-between gap-3 px-4 py-2 text-sm w-full rounded hover:bg-white hover:bg-opacity-5 border data-[active=true]:bg-white data-[active=true]:bg-opacity-30"
									>
										<div class="flex items-center gap-3">
											{slot.time}
										</div>
									</button>
								{/key}
							{/each}
						</div>

						<!-- Show alternative restaurant if all slots are unavailable -->
						{#if !hasAvailableSlots}
							{#if loadingAlternative}
								<div class="flex flex-col items-center justify-center gap-2 py-4">
									<Spinner />
									<div class="text-xs text-center opacity-70">
										{m.selection_searchingAlternatives()}
									</div>
								</div>
							{:else if alternativeRestaurant?.found}
								<div class="flex items-center w-full px-4 py-2">
									<div class="flex-1 h-px bg-white bg-opacity-10"></div>
									<span class="px-2 text-xs opacity-30">{m.selection_or()}</span>
									<div class="flex-1 h-px bg-white bg-opacity-10"></div>
								</div>

								<div class="w-full px-4 pb-3">
									<button
										onclick={() => {
											if (alternativeRestaurant?.found) {
												pushGtmEvent('alternative_restaurant_clicked', {
													original_restaurant_id: restaurantId,
													alternative_restaurant_id: alternativeRestaurant.restaurant.id,
													alternative_restaurant_name: alternativeRestaurant.restaurant.name,
													slot_time: slotKey(
														alternativeRestaurant.slot.date,
														alternativeRestaurant.slot.time
													)
												});
												window.location.href = buildAlternativeWidgetUrl(alternativeRestaurant);
											}
										}}
										class="w-full px-3 py-2 border border-white border-opacity-20 rounded bg-white bg-opacity-5 hover:bg-opacity-10 transition-all text-left group"
									>
										<div class="flex items-center justify-between">
											<div class="flex-1 min-w-0">
												<div class="text-sm font-semibold truncate">
													{alternativeRestaurant.restaurant.name}
												</div>
												<div class="text-xs opacity-40 truncate">
													{alternativeRestaurant.restaurant.address}
												</div>
											</div>
											<div class="flex items-center gap-2 ml-3">
												<div
													class="flex items-center gap-1.5 px-2 py-1 rounded bg-white bg-opacity-10"
												>
													<span class="text-xs font-medium">{alternativeRestaurant.slot.time}</span>
												</div>
												<ArrowRight size={14} class="opacity-40 group-hover:opacity-70" />
											</div>
										</div>
									</button>
								</div>
							{/if}
						{/if}
					{:else}
						<!-- No slots at all -->
						<div class="flex flex-col items-center w-full">
							{#if loadingSlots}
								<!-- Show nothing while loading slots -->
							{:else if loadingAlternative}
								<div class="flex flex-col items-center justify-center gap-2 py-4">
									<Spinner />
									<div class="text-xs text-center opacity-70">
										{m.selection_searchingAlternatives()}
									</div>
								</div>
							{:else if alternativeRestaurant?.found}
								<div class="flex flex-col items-center py-3 px-4 w-full">
									<p class="text-base font-semibold mb-1">{m.selection_noSlotsAvailable()}</p>
									<p class="text-xs text-center opacity-50 mb-3">
										{m.selection_noTablesForDate({
											pax: selection.pax ?? 0,
											date: zonedDateUtils.format('DD MMM', selection.date)
										})}
									</p>
								</div>

								<div class="w-full px-4 pb-2">
									<button
										onclick={() => {
											openedAccordion.index = 0;
										}}
										class="w-full flex items-center justify-between px-3 py-2 rounded border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-all"
									>
										<div class="flex items-center gap-2">
											<Calendar size={16} class="opacity-60" />
											<span class="text-xs">{m.selection_chooseAnotherDate()}</span>
										</div>
										<ArrowRight size={14} class="opacity-40" />
									</button>
								</div>

								<div class="flex items-center w-full px-4 py-2">
									<div class="flex-1 h-px bg-white bg-opacity-10"></div>
									<span class="px-2 text-xs opacity-30">{m.selection_or()}</span>
									<div class="flex-1 h-px bg-white bg-opacity-10"></div>
								</div>

								<div class="w-full px-4 pb-3">
									<button
										onclick={() => {
											if (alternativeRestaurant?.found) {
												pushGtmEvent('alternative_restaurant_clicked', {
													original_restaurant_id: restaurantId,
													alternative_restaurant_id: alternativeRestaurant.restaurant.id,
													alternative_restaurant_name: alternativeRestaurant.restaurant.name,
													slot_time: slotKey(
														alternativeRestaurant.slot.date,
														alternativeRestaurant.slot.time
													)
												});
												window.location.href = buildAlternativeWidgetUrl(alternativeRestaurant);
											}
										}}
										class="w-full px-3 py-2 border border-white border-opacity-20 rounded bg-white bg-opacity-5 hover:bg-opacity-10 transition-all text-left group"
									>
										<div class="flex items-center justify-between">
											<div class="flex-1 min-w-0">
												<div class="text-sm font-semibold truncate">
													{alternativeRestaurant.restaurant.name}
												</div>
												<div class="text-xs opacity-40 truncate">
													{alternativeRestaurant.restaurant.address}
												</div>
											</div>
											<div class="flex items-center gap-2 ml-3">
												<div
													class="flex items-center gap-1.5 px-2 py-1 rounded bg-white bg-opacity-10"
												>
													<span class="text-xs font-medium">{alternativeRestaurant.slot.time}</span>
												</div>
												<ArrowRight size={14} class="opacity-40 group-hover:opacity-70" />
											</div>
										</div>
									</button>
								</div>
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
										class="w-full flex items-center justify-between px-3 py-2 rounded border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-all"
									>
										<div class="flex items-center gap-2">
											<Calendar size={16} class="opacity-60" />
											<span class="text-xs">{m.selection_chooseAnotherDate()}</span>
										</div>
										<ArrowRight size={14} class="opacity-40" />
									</button>
								</div>
							{/if}
						</div>
					{/if}
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
				loadingServices}
			>{reservation.id ? m.selection_modifyButton() : m.selection_bookButton()}</Button
		>
	</div>
</div>
