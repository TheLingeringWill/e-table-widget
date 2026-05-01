<script lang="ts" module>
	export const defaultTheme = {
		title: 'Restaurant',
		description: '',
		fontColor: '#ffffff',
		backgroundColor: '#022c22',
		buttonColor: '#ffffff',
		buttonTextColor: '#022c22',
		borderColor: '#ffffff',
		borderRadius: 12,
		buttonBorderRadius: 8
	};
</script>

<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { api } from '$lib/widget-rpc-client';
	import { autoHeight } from './autoHeight.svelte';
	import Spinner from './Spinner.svelte';
	import Booking from './Widget/Booking.svelte';
	import Contact from './Widget/Contact.svelte';
	import Done from './Widget/Done.svelte';
	import Error from './Widget/Error.svelte';
	import Header from './Widget/Header.svelte';
	import Payment from './Widget/Payment.svelte';
	import Selection from './Widget/Selection.svelte';
	import Summary from './Widget/Summary.svelte';
	import { gotoStep, step } from '$lib/states/step.svelte';
	import { browser } from '$app/environment';
	import { contact, rememberMe, prefilled } from './states/contact.svelte';
	import { reservation, reservationTemp } from './states/reservation.svelte';
	import { useWidget, getTranslation } from './context.svelte';
	import { paymentIntent } from './states/paymentIntent.svelte';
	import { selection } from './states/selection.svelte';
	import { gotoError, error as errorState } from './states/error.svelte';
	import {
		pushGtmEvent,
		pushEcommerceEvent,
		trackStep,
		trackError,
		trackBookingConfirmed
	} from './gtm.svelte';

	let { data: widget, builder, isEmbedded } = $props();

	let theme = $state(defaultTheme);

	for (let key in widget.theme) {
		Object.assign(theme, {
			[key]: widget.theme[key]
		});
	}

	let error = $state('');

	// PRD §10.2 step 3: edit-existing-booking pre-fill is keyed on
	// `?reservationId=…`. The legacy code only checked path params, but
	// the standalone widget URL has no `[reservationId]` segment, so query
	// is the canonical surface. Same for paymentIntentId.
	let reservationId = $derived(
		$page.params.reservationId || $page.url.searchParams.get('reservationId') || undefined
	);

	let paymentIntentId = $derived(
		$page.params.paymentIntentId || $page.url.searchParams.get('paymentIntentId') || undefined
	);

	let loading = $state(!(!reservationId && !paymentIntentId));
	let mounted = $state(!(!reservationId && !paymentIntentId));

	let paymentIntentClientSecret = $state('');
	let secretQuery = $page.url.searchParams.get('payment');
	if (secretQuery) {
		paymentIntentClientSecret = secretQuery;
		// step = 'PAYMENT';
	}

	// Handle pre-selection from alternative restaurant redirect
	const preselectedDate = $page.url.searchParams.get('date');
	const preselectedServiceId = $page.url.searchParams.get('serviceId');
	const preselectedPax = $page.url.searchParams.get('pax');
	const preselectedTime = $page.url.searchParams.get('time');

	if (preselectedDate || preselectedServiceId || preselectedPax || preselectedTime) {
		if (preselectedTime) {
			reservationTemp.startDate = new Date(preselectedTime);
		}
		if (preselectedServiceId) {
			reservationTemp.serviceId = preselectedServiceId;
		}
		if (preselectedPax) {
			reservationTemp.pax = parseInt(preselectedPax, 10);
		}
	}

	const loadReservation = async () => {
		if (reservationId) {
			const [res, error] = await api.loadReservation(reservationId);
			console.error(error);
			if (error) {
				// Show error page with the error message
				gotoError(
					error.message || 'Cette réservation ne peut pas être chargée.',
					'LOAD_RESERVATION_ERROR'
				);
				return;
			}
			if (res) {
				reservation.id = res.id;
				reservation.serviceId = res.serviceId;
				reservation.startDate = res.startDate;
				reservation.pax = res.pax;
				reservation.notes = res.notes;
				reservationTemp.id = res.id;
				reservationTemp.serviceId = res.serviceId;
				reservationTemp.startDate = res.startDate;
				reservationTemp.pax = res.pax;
				reservationTemp.notes = res.notes;
				contact.civility = res.contact.civility ?? null;
				contact.countryCode = res.contact.countryCode ?? null;
				contact.firstName = res.contact.firstName;
				contact.lastName = res.contact.lastName;
				contact.email = res.contact.email || '';
				contact.phone = res.contact.phone || '';
			} else {
				// No result and no error - shouldn't happen but show error anyway
				gotoError('Cette réservation ne peut pas être trouvée.', 'RESERVATION_NOT_FOUND');
			}
		}
	};

	const loadPaymentIntent = async () => {
		if (paymentIntentId) {
			const [res, error] = await api.loadPaymentIntent(paymentIntentId);
			if (error) {
				// Show error page with the error message
				gotoError(
					error.message || 'Le paiement ne peut pas être chargé.',
					'LOAD_PAYMENT_INTENT_ERROR'
				);
				return;
			}
			if (res.paymentIntent) {
				paymentIntent.id = res.paymentIntent.id;
				paymentIntent.clientSecret = res.paymentIntent.client_secret;
				paymentIntent.amount = res.paymentIntent.amount;
				paymentIntent.stripeAccountId = res.stripeAccountId ?? null;
			}
			if (res.reservation) {
				reservation.id = res.reservation.id;
				reservation.serviceId = res.reservation.serviceId;
				reservation.startDate = res.reservation.startDate;
				reservation.pax = res.reservation.pax;
				reservation.notes = res.reservation.notes ?? undefined;
				reservationTemp.id = res.reservation.id;
				reservationTemp.serviceId = res.reservation.serviceId;
				reservationTemp.startDate = res.reservation.startDate;
				reservationTemp.pax = res.reservation.pax;
				reservationTemp.notes = res.reservation.notes;
				contact.civility = res.reservation.contact?.civility ?? null;
				contact.countryCode = res.reservation.contact?.countryCode ?? null;
				contact.firstName = res.reservation.contact?.firstName || '';
				contact.lastName = res.reservation.contact?.lastName || '';
				contact.email = res.reservation.contact?.email || '';
				contact.phone = res.reservation.contact?.phone || '';
				selection.date = res.reservation.startDate;
				selection.service = res.reservation.service;
				selection.pax = res.reservation.pax;
				selection.slot = {
					date: res.reservation.startDate,
					pax: res.reservation.pax,
					state: 'OPEN'
				};
			}
			if (['captured', 'requires_capture'].includes(res.paymentIntent?.status ?? '')) {
				gotoStep('DONE');
			} else {
				gotoStep('PAYMENT');
			}
		}
	};

	const isValidStoredContact = (data: unknown): boolean => {
		return (
			typeof data === 'object' &&
			data !== null &&
			typeof (data as Record<string, unknown>).lastName === 'string' &&
			((data as Record<string, unknown>).lastName as string).length > 0 &&
			typeof (data as Record<string, unknown>).email === 'string' &&
			((data as Record<string, unknown>).email as string).includes('@') &&
			typeof (data as Record<string, unknown>).phone === 'string' &&
			((data as Record<string, unknown>).phone as string).length > 0
		);
	};

	const getStorageKey = (restaurantId: string) => `etable-contact-${restaurantId}`;

	const loadContactStorage = () => {
		try {
			const storageKey = getStorageKey(widget.restaurantId);

			// Try to migrate from old key if new key doesn't exist
			let contactItem = window.localStorage.getItem(storageKey);
			if (!contactItem) {
				const oldContactItem = window.localStorage.getItem('contact');
				if (oldContactItem) {
					// Migrate old data to new restaurant-scoped key
					window.localStorage.setItem(storageKey, oldContactItem);
					window.localStorage.removeItem('contact');
					contactItem = oldContactItem;
				}
			}

			if (contactItem) {
				const parsedContact = JSON.parse(contactItem);
				if (isValidStoredContact(parsedContact)) {
					contact.civility =
						parsedContact.civility === 'mr' ||
						parsedContact.civility === 'mrs' ||
						parsedContact.civility === 'other'
							? parsedContact.civility
							: null;
					contact.countryCode =
						typeof parsedContact.countryCode === 'string' && parsedContact.countryCode.length === 2
							? parsedContact.countryCode.toUpperCase()
							: null;
					contact.firstName = parsedContact.firstName || '';
					contact.lastName = parsedContact.lastName;
					contact.email = parsedContact.email;
					contact.phone = parsedContact.phone;
					rememberMe.checked = true;
					prefilled.value = true;
				}
			}
		} catch {
			// Graceful degradation: silently ignore localStorage errors (private mode, disabled, etc.)
		}
	};

	const widgetContext = useWidget();
	const builderListener = () => {
		window.addEventListener(
			'message',
			(event) => {
				if (event.data.builder) {
					builder = event.data.builder;
				}
				if (event.data.title) {
					console.log('event.data.title', event.data.title);
					widgetContext.title = event.data.title;
				}
				if (event.data.description) {
					console.log('event.data.description', event.data.description);
					widgetContext.description = event.data.description;
				}
				if (event.data.theme) {
					Object.keys(event.data?.theme).forEach((key) => {
						Object.assign(theme, {
							[key]: event.data.theme[key]
						});
					});
				}
			},
			false
		);
		window.parent?.postMessage({ loaded: true }, '*');
	};

	onMount(() => {
		// GTM mode logging (dev only)
		if (import.meta.env.DEV) {
			if (builder) {
				console.log('[GTM] Builder mode - GTM disabled');
			} else if (isEmbedded) {
				console.log('[GTM] SDK mode - events forwarded to parent');
			} else if (widget.gtmEnabled && widget.gtmId) {
				console.log('[GTM] Standalone mode - GTM enabled:', widget.gtmId);
			} else {
				console.log('[GTM] Standalone mode - GTM not configured');
			}
		}

		if (reservationId) {
			loadReservation().then(() => {
				builderListener();
				loading = false;
				mounted = true;
			});
		} else if (paymentIntentId) {
			loadPaymentIntent().then(() => {
				builderListener();
				loading = false;
				mounted = true;
			});
		} else {
			loadContactStorage();
			builderListener();
			mounted = true;
		}
	});

	$effect(() => {
		if (!mounted || !browser || reservation?.id) return;
		try {
			const storageKey = getStorageKey(widget.restaurantId);
			if (rememberMe.checked) {
				const dataToStore = {
					civility: contact.civility,
					countryCode: contact.countryCode,
					firstName: contact.firstName,
					lastName: contact.lastName,
					email: contact.email,
					phone: contact.phone
				};
				window.localStorage.setItem(storageKey, JSON.stringify(dataToStore));
			} else {
				window.localStorage.removeItem(storageKey);
			}
		} catch {
			// Graceful degradation: silently ignore localStorage errors
		}
	});

	// GTM Event Tracking - Track step changes
	$effect(() => {
		if (!mounted || !browser) return;

		const currentStep = step.step;

		switch (currentStep) {
			case 'SELECTION':
				trackStep(1, 'Selection');
				break;

			case 'CONTACT':
				trackStep(2, 'Contact', {
					service_id: selection.service?.id,
					service_name: selection.service?.name ? getTranslation(selection.service.name) : '',
					pax: selection.pax,
					date: selection.date?.toISOString(),
					slot_time: selection.slot?.date
				});
				break;

			case 'BOOKING':
				trackStep(3, 'Booking', {
					service_id: selection.service?.id,
					service_name: selection.service?.name ? getTranslation(selection.service.name) : '',
					pax: selection.pax,
					customer_email: contact.email,
					customer_phone: contact.phone
				});
				break;

			case 'PAYMENT':
				pushEcommerceEvent('begin_checkout', {
					items: [
						{
							item_id: selection.service?.id,
							item_name: selection.service?.name ? getTranslation(selection.service.name) : '',
							price: paymentIntent.amount ? paymentIntent.amount / 100 : 0,
							quantity: selection.pax || 1
						}
					],
					value: paymentIntent.amount ? paymentIntent.amount / 100 : 0
				});
				break;

			case 'DONE':
				if (reservation.id) {
					trackBookingConfirmed({
						reservationId: reservation.id,
						serviceId: selection.service?.id || '',
						serviceName: selection.service?.name ? getTranslation(selection.service.name) : '',
						pax: selection.pax || 0,
						date: selection.date?.toISOString() || '',
						customerEmail: contact.email,
						paymentRequired: !!paymentIntent.id,
						amount: paymentIntent.amount ? paymentIntent.amount / 100 : undefined
					});
				}
				break;

			case 'ERROR':
				trackError(errorState.code || 'UNKNOWN_ERROR', errorState.message || 'An error occurred', {
					service_id: selection.service?.id,
					pax: selection.pax
				});
				break;
		}
	});
</script>

<svelte:head>
	<!-- Google Tag Manager (Standalone Mode Only) -->
	{#if !isEmbedded && !builder && widget.gtmEnabled && widget.gtmId}
		{@html `<s${'cript'}>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${widget.gtmId}');</s${'cript'}>`}
	{/if}
	<!-- End Google Tag Manager -->

	<!-- Existing resize postMessage script (all modes) -->
	{@html `
		<s${'cript'}>
			document.addEventListener("DOMContentLoaded", () => {
				const __H = document.body.scrollHeight;
				window.parent?.postMessage({ type: 'resize', data: __H }, '*');
			});
		</s${'cript'}>
	`}
</svelte:head>

<div
	use:autoHeight
	id="widget"
	class="flex rounded-lg flex-col {['CONTACT', 'PAYMENT', 'BOOKING'].includes(step.step)
		? 'widget-max-w-large'
		: 'widget-max-w-small'} w-full md:h-auto h-full md:overflow-hidden {builder
		? 'overflow-hidden'
		: ''}"
>
	<!-- Google Tag Manager (noscript) - Standalone Mode Only -->
	{#if !isEmbedded && !builder && widget.gtmEnabled && widget.gtmId}
		<noscript>
			<iframe
				src={`https://www.googletagmanager.com/ns.html?id=${widget.gtmId}`}
				height="0"
				width="0"
				style="display:none;visibility:hidden"
				title="GTM"
			></iframe>
		</noscript>
	{/if}
	<!-- End Google Tag Manager (noscript) -->

	<Header {theme} />
	{#if loading}
		<div class="flex items-center justify-center w-full h-full p-12">
			<Spinner />
		</div>
	{:else if step.step === 'SELECTION'}
		<div transition:slide class="flex flex-col flex-grow">
			<Selection restaurantId={widget.restaurantId} {theme} />
		</div>
	{:else if step.step === 'CONTACT' || step.step === 'BOOKING' || step.step === 'PAYMENT'}
		<div
			class="flex flex-col flex-grow text-black bg-white md:grid md:grid-cols-2 md:gap-8 md:px-10 md:py-6"
			transition:slide
		>
			<div class="md:order-last">
				<Summary />
			</div>
			<div class="flex-grow px-5 pb-5 overflow-hidden md:p-0">
				{#if step.step === 'CONTACT'}
					<div>
						<Contact />
					</div>
				{:else if step.step === 'BOOKING'}
					<div class="w-full h-full">
						<Booking {widget} />
					</div>
				{:else if step.step === 'PAYMENT'}
					<div>
						<Payment {widget} />
					</div>
				{/if}
			</div>
		</div>
	{:else if step.step === 'DONE'}
		<div class="flex items-center justify-center p-20 text-center text-black bg-white">
			<Done />
		</div>
	{:else if step.step === 'ERROR'}
		<div class="flex items-center justify-center p-20 text-center text-black bg-white">
			<Error />
		</div>
	{/if}
</div>

{@html `
		<s${'tyle'}>
			:root {
				--base-radius: ${theme.borderRadius}px;
				--radius-sm: calc(var(--base-radius) / 2);
				--radius-xs: calc(var(--base-radius) / 4);
				--radius-lg: calc(var(--base-radius) * 2);
			}
			.rounded-lg {
				border-radius: var(--radius-lg) !important;
				transition: border-radius 0.2s ease-in-out;
			}
			.ui-field-input-container,
			button,
			.rounded {
				border-radius: var(--base-radius) !important;
				transition: border-radius 0.2s ease-in-out;
			}
			.rounded-sm {
				border-radius: var(--radius-sm) !important;
				transition: border-radius 0.2s ease-in-out;
			}
			.rounded-xs {
				border-radius: var(--radius-xs) !important;
				transition: border-radius 0.2s ease-in-out;
			}
			#page {
			background: ${builder ? theme.backgroundColor : '#222'};
			color: ${theme.fontColor} !important;
			/*font-size: ${theme.fontSize}px;*/
		}
		.bg-primary {
			background: ${theme.backgroundColor};
		}
		@media (max-width: 768px) {
		#widget {
				border-radius: 0px !important;
			}
		}
		#widget {
			background-color: ${theme.backgroundColor};
				box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
				font-size: ${theme.fontSize}px;
			}
		.widget-max-w-small {
			max-width: 100%;
		}
		.widget-max-w-large {
			max-width: 100%;
		}
		@media (min-width: 960px) {
			#widget {
				border-radius: ${theme.borderRadius}px;
			}
			.widget-max-w-small {
				max-width: 600px;
			}
			.widget-max-w-large {
				max-width: 1024px;
			}
		}
		#title {
			font-size: ${theme.titleFontSize}px;
		}
		#description {
			font-size: ${theme.descriptionFontSize}px;
		}
		.separator-h {
			background: ${theme.borderColor};
			opacity: 0.3;
			height: 1px;
		}
		.separator-w {
			background: ${theme.borderColor};
			opacity: 0.3;
			width: 1px;
		}
		#button {
			border-color: ${theme.borderColor};
			border-radius: ${theme.buttonBorderRadius}px;
			background: ${theme.buttonColor};
			color: ${theme.buttonTextColor};
		}

		#button.revert {
			background: #f0f0f0f0;
			color: ${theme.backgroundColor};
		}
		.color-revert {
			color: ${theme.backgroundColor};
		}
		.max-w-small {
			max-width: 600px;
		}
		.max-w-large {
			max-width: 1024px;
		}

		.loader {
			border-color: ${theme.backgroundColor} !important;
			border-bottom-color: ${theme.fontColor} !important;
		}

		body {
			background: ${builder ? 'transparent' : '#222'};
			--sb-track-color: transparent;
			--sb-thumb-color: #222222;
			--sb-size: 6px;
		}

		*::-webkit-scrollbar {
			width: var(--sb-size);
		}

		*::-webkit-scrollbar-track {
			background: var(--sb-track-color);
			border-radius: 10px;
		}

		*::-webkit-scrollbar-thumb {
			background: var(--sb-thumb-color);
			border-radius: 10px;
		}

		@supports not selector(::-webkit-scrollbar) {
			* {
				scrollbar-color: var(--sb-thumb-color) var(--sb-track-color);
			}
		}

	</s${'tyle'}>
`}
