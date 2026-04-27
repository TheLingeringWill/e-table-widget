<script lang="ts">
	import { ArrowLeft, ArrowRight, Calendar, CallBell, Clock, ForkKnife } from 'phosphor-svelte';
	import AccordionGroup from '../AccordionGroup.svelte';
	import Button from './Button.svelte';
	import Spinner from '../Spinner.svelte';
	import { onMount } from 'svelte';
	import { api } from '../../api/client';
	import { accordionToOpen, openedAccordion, selection } from '$lib/states/selection.svelte';
	import { nextStep } from '$lib/states/step.svelte';
	import { waitlist, resetWaitlist, joinWaitlist, type Slot } from '$lib/states/waitlist.svelte';
	import { formatTime, getTimeFromDate, hours, minutes } from 'shared/utils/time';
	import { reservation, reservationTemp } from '$lib/states/reservation.svelte';
	import { getTranslation, useZonedDateUtils } from '$lib/context.svelte';
	import ZonedCalendarInput from '../../../../shared/utils/ZonedCalendarInput.svelte';
	import { pushGtmEvent } from '../gtm.svelte';

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
		const [res, error] = await api.getServices({ restaurantId, date: selection.date });
		if (error) {
			return console.log(error);
		}
		services = res;
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
			date: selection.date
		});
		if (error) {
			return console.log(error);
		}
		slots = res;
		if (reservationTemp.startDate) {
			const foundSlot = slots.find(
				(slot) => slot.date.getTime() === reservationTemp.startDate.getTime()
			);
			if (foundSlot) {
				selection.slot = foundSlot;
			}
			reservationTemp.startDate = null;
		}
		if (selection.slot !== null && slots.length > 0) {
			const foundSlot = slots.find(
				(slot) => getTimeFromDate(slot.date) === getTimeFromDate(selection.slot?.date || new Date())
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
		const hasAvailableSlot = slots.some(
			(slot) => slot.state !== 'FULL' && slot.state !== 'CLOSED'
		);
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
			const date = new Date(reservationTemp.startDate);
			date.setHours(0, 0, 0, 0);
			selection.date = date;
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
		if (selection.date && selection.service && selection.pax) {
			await getServiceSlots();
		}
	};

	const onSlotChange = async () => {};

	// Search for alternative restaurant when current restaurant is fully booked
	const searchAlternativeRestaurant = async () => {
		if (!selection.date || !selection.service || !selection.pax) return;

		// Use first slot time as reference, or service start time if no slots
		const referenceTime =
			slots.length > 0 ? getTimeFromDate(slots[0].date) : selection.service.startTime;

		loadingAlternative = true;
		alternativeRestaurant = null;

		const [res, error] = await api.getAlternativeRestaurant({
			restaurantId,
			date: selection.date,
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
				slot.date.getTime() !== unavailableSlot.date.getTime()
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
				slot_time: selection.slot.date.toISOString(),
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
			slot_time: slot.date.toISOString(),
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

		// Add query parameters for pre-selection
		const params = new URLSearchParams();
		params.set('date', selection.date.toISOString());
		params.set('serviceId', alt.service.id);
		params.set('pax', String(selection.pax));
		params.set('time', alt.slot.date.toISOString());

		return `${baseUrl}?${params.toString()}`;
	};
</script>

<div class="flex flex-col flex-grow">
	<AccordionGroup
		bind:openedAccordion={openedAccordion.index}
		oneAtATime
		className="flex-grow"
		items={[
			{
				id: 'date',
				icon: Calendar,
				title: selection.date
					? zonedDateUtils.format('dddd DD MMMM', selection.date)
					: 'Sélectionnez une date',
				contentClass: 'flex flex-wrap gap-2 justify-center px-5 py-2',
				loading: loadingDates
			},
			{
				id: 'service',
				icon: CallBell,
				title: selection.service?.name[0].value || 'Sélectionnez un service',
				loading: loadingServices,
				contentClass: 'flex flex-wrap gap-2 justify-center',
				disabled: !selection.date
			},
			{
				id: 'pax',
				icon: ForkKnife,
				title: selection.pax ? `${selection.pax} couverts` : 'Sélectionnez un nombre de couverts',
				contentClass: 'flex flex-wrap gap-2 justify-center pt-2 pb-5 px-5',
				loading: loadingServices,
				disabled: !selection.date || !selection.service
			},
			{
				id: 'slots',
				icon: Clock,
				title: `${selection.slot ? zonedDateUtils.format('HH:mm', selection.slot.date) : 'Sélectionnez un horaire'}`,
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
				<div
					class={`max-h-[300px] min-h-[150px] w-full relative ${!services.length ? 'overflow-hidden' : 'overflow-auto'}`}
				>
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
									class="flex flex-col gap-2 px-4 py-2 text-sm w-full rounded hover:bg-white hover:bg-opacity-5 border data-[active=true]:bg-white data-[active=true]:bg-opacity-30 disabled:opacity-50 disabled:pointer-events-none"
								>
									<div class="flex items-center gap-2">
										<b>{getTranslation(service.name)}</b>
										<div>•</div>
										<div class="flex items-center gap-1">
											<!-- <Clock size={20} /> -->
											<div>
												{formatTime(service.startTime)} - {formatTime(service.endTime)}
											</div>
										</div>
										<!-- <div>•</div>
									<div class="flex items-center gap-1">
										<ForkKnife size={20} />
										<div>
											{service.minPaxPerReservation} - {service.maxPaxPerReservation}
										</div>
									</div> -->
									</div>
									{#if service.description?.length > 0}
										<div class="text-sm">{getTranslation(service.description)}</div>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
					{#if services.length === 0}
						<div
							class="absolute top-0 left-0 flex flex-col items-center justify-center w-full h-full gap-5 p-10 bg-white bg-opacity-10"
						>
							{#if !loadingServices}
								<div class="">Aucun service pour ce jour.</div>
								<Button
									onclick={() => {
										openedAccordion.index = 0;
									}}>Séléctionner un autre jour</Button
								>
							{/if}
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
				{@const hasAvailableSlots = slots.some((slot) => slot.state !== 'FULL' && slot.state !== 'CLOSED')}
				<div class="max-h-[400px] w-full overflow-auto">
					{#if waitlist.selectedUnavailableSlot}
						<!-- Waitlist prompt for unavailable slot -->
						{@const alternatives = getAlternativeSlots(waitlist.selectedUnavailableSlot)}
						<div class="flex flex-col gap-3 px-5 py-3">
							<div class="text-center">
								<p class="text-sm font-medium mb-1">Ce créneau est actuellement indisponible</p>
								<p class="text-xs opacity-60">
									{zonedDateUtils.format('HH:mm', waitlist.selectedUnavailableSlot.date)} - {selection.pax} couverts
								</p>
							</div>

							{#if alternatives.length > 0}
								<div class="flex flex-col gap-2">
									<p class="text-xs opacity-70 text-center">Créneaux alternatifs disponibles :</p>
									<div class="flex flex-col gap-2 max-h-[200px] overflow-auto">
										{#each alternatives as altSlot}
											<button
												onclick={() => handleSelectAlternative(altSlot)}
												class="flex items-center justify-between gap-3 px-4 py-2 text-sm w-full rounded border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-all"
											>
												<span>{zonedDateUtils.format('HH:mm', altSlot.date)}</span>
											</button>
										{/each}
									</div>
								</div>

								<div class="flex items-center w-full py-1">
									<div class="flex-1 h-px bg-white bg-opacity-10"></div>
									<span class="px-2 text-xs opacity-30">ou</span>
									<div class="flex-1 h-px bg-white bg-opacity-10"></div>
								</div>
							{/if}

							<button
								onclick={handleJoinWaitlist}
								class="w-full px-4 py-3 rounded border border-white border-opacity-30 hover:bg-white hover:bg-opacity-10 transition-all text-sm font-medium"
							>
								Rejoindre la liste d'attente
							</button>

							<button
								onclick={handleBackFromWaitlist}
								class="w-full px-4 py-2 text-sm opacity-70 hover:opacity-100 transition-all"
							>
								Retour à la sélection
							</button>
						</div>
					{:else if slots.length > 0}
						<!-- Regular slot list (all clickable, no color dots) -->
						<div class="flex flex-col gap-2 px-5 py-2">
							{#each slots as slot}
								{@const isUnavailable = slot.state === 'FULL' || slot.state === 'CLOSED'}
								{#key slot.date}
									<button
										data-active={slot.date.getTime() === selection.slot?.date.getTime()}
										onclick={() => {
											if (isUnavailable) {
												handleUnavailableSlotClick(slot);
											} else {
												selection.slot = slot;
												pushGtmEvent('slot_selected', {
													slot_time: slot.date.toISOString(),
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
											{zonedDateUtils.format('HH:mm', slot.date)}
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
									<div class="text-xs text-center opacity-70">Recherche d'alternatives...</div>
								</div>
							{:else if alternativeRestaurant?.found}
								<div class="flex items-center w-full px-4 py-2">
									<div class="flex-1 h-px bg-white bg-opacity-10"></div>
									<span class="px-2 text-xs opacity-30">ou</span>
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
													slot_time: alternativeRestaurant.slot.date.toISOString()
												});
												window.location.href = buildAlternativeWidgetUrl(alternativeRestaurant);
											}
										}}
										class="w-full px-3 py-2 border border-white border-opacity-20 rounded bg-white bg-opacity-5 hover:bg-opacity-10 transition-all text-left group"
									>
										<div class="flex items-center justify-between">
											<div class="flex-1 min-w-0">
												<div class="text-sm font-medium truncate">{alternativeRestaurant.restaurant.name}</div>
												<div class="text-xs opacity-40 truncate">{alternativeRestaurant.restaurant.address}</div>
											</div>
											<div class="flex items-center gap-2 ml-3">
												<div class="flex items-center gap-1.5 px-2 py-1 rounded bg-white bg-opacity-10">
													<span class="text-xs font-medium">{zonedDateUtils.format('HH:mm', alternativeRestaurant.slot.date)}</span>
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
									<div class="text-xs text-center opacity-70">Recherche d'alternatives...</div>
								</div>
							{:else if alternativeRestaurant?.found}
								<div class="flex flex-col items-center py-3 px-4 w-full">
									<p class="text-sm font-medium mb-1">Aucun créneau disponible</p>
									<p class="text-xs text-center opacity-50 mb-3">
										Aucune table pour {selection.pax} pers. le {zonedDateUtils.format('DD MMM', selection.date)}
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
											<span class="text-xs">Choisir une autre date</span>
										</div>
										<ArrowRight size={14} class="opacity-40" />
									</button>
								</div>

								<div class="flex items-center w-full px-4 py-2">
									<div class="flex-1 h-px bg-white bg-opacity-10"></div>
									<span class="px-2 text-xs opacity-30">ou</span>
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
													slot_time: alternativeRestaurant.slot.date.toISOString()
												});
												window.location.href = buildAlternativeWidgetUrl(alternativeRestaurant);
											}
										}}
										class="w-full px-3 py-2 border border-white border-opacity-20 rounded bg-white bg-opacity-5 hover:bg-opacity-10 transition-all text-left group"
									>
										<div class="flex items-center justify-between">
											<div class="flex-1 min-w-0">
												<div class="text-sm font-medium truncate">{alternativeRestaurant.restaurant.name}</div>
												<div class="text-xs opacity-40 truncate">{alternativeRestaurant.restaurant.address}</div>
											</div>
											<div class="flex items-center gap-2 ml-3">
												<div class="flex items-center gap-1.5 px-2 py-1 rounded bg-white bg-opacity-10">
													<span class="text-xs font-medium">{zonedDateUtils.format('HH:mm', alternativeRestaurant.slot.date)}</span>
												</div>
												<ArrowRight size={14} class="opacity-40 group-hover:opacity-70" />
											</div>
										</div>
									</button>
								</div>
							{:else}
								<div class="flex flex-col items-center py-4 px-4 w-full">
									<p class="text-sm font-medium mb-1">Aucun créneau disponible</p>
									<p class="text-xs text-center opacity-50 mb-3">
										Aucune table disponible. Essayez une autre date.
									</p>
									<button
										onclick={() => {
											openedAccordion.index = 0;
										}}
										class="w-full flex items-center justify-between px-3 py-2 rounded border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-all"
									>
										<div class="flex items-center gap-2">
											<Calendar size={16} class="opacity-60" />
											<span class="text-xs">Choisir une autre date</span>
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
	<div class="flex items-end flex-grow p-3">
		<Button
			onclick={nextStep}
			disabled={!selection.pax ||
				!selection.date ||
				!selection.service ||
				!selection.slot ||
				((selection.slot?.state === 'FULL' || selection.slot?.state === 'CLOSED') && !waitlist.isWaitlist) ||
				loadingDates ||
				loadingSlots ||
				loadingServices}>{reservation.id ? 'Modifier ma réservation' : 'Réserver'}</Button
		>
	</div>
</div>
