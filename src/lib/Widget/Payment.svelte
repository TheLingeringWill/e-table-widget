<script lang="ts" module>
	import { env } from '$env/dynamic/public';
	import {
		loadStripe,
		type Stripe,
		type StripeCardCvcElement,
		type StripeElements
	} from '@stripe/stripe-js';
	import { getContext, onMount } from 'svelte';
	import { currentLocale } from '$lib/states/locale.svelte';

	type StripeState = {
		stripe: Stripe | null;
		elements: StripeElements | null;
	};
	function register(stripe: Stripe) {
		if (browser) {
			return stripe.registerAppInfo({
				name: 'svelte-stripe-js',
				url: 'https://edged.cloud'
			});
		}
	}

	export const useStripe = (stripeAccountId: string | null) => {
		let stripeState = $state<StripeState>({
			stripe: null,
			elements: null
		});
		onMount(async () => {
			// For Stripe Connect, pass the connected account ID
			const stripeOptions = stripeAccountId ? { stripeAccount: stripeAccountId } : undefined;
			const stripe = await loadStripe(env.PUBLIC_STRIPE_KEY, stripeOptions);

			if (stripe) {
				stripeState.stripe = stripe;
				// Pass the active widget locale to Stripe Elements so its
				// built-in UI (card placeholders, inline validation messages)
				// renders in the same language as our own chrome.
				stripeState.elements = stripe.elements({ locale: currentLocale.value });

				register(stripe);
			}
		});
		return stripeState;
	};
</script>

<script lang="ts">
	import Spinner from '$lib/Spinner.svelte';
	import { CaretLeft } from 'phosphor-svelte';
	import { slide } from 'svelte/transition';
	import Button from './Button.svelte';
	import Separator from 'maket/Separator';
	import { browser } from '$app/environment';
	import { selection } from '$lib/states/selection.svelte';
	import { contact } from '$lib/states/contact.svelte';
	import { nextStep, previousStep } from '$lib/states/step.svelte';
	import { gotoError } from '$lib/states/error.svelte';
	import { setupIntent } from '$lib/states/paymentIntent.svelte';
	import {
		reservation,
		pendingReservation,
		clearPendingReservation
	} from '$lib/states/reservation.svelte';
	import { api } from '$lib/widget-rpc-client';
	import * as m from '$lib/paraglide/messages';
	import { trackBookingComplete } from '$lib/gtm.svelte';
	import { getTranslation } from '$lib/context.svelte.js';

	let {
		widget,
		mode = 'embedded'
	}: {
		widget: any;
		mode?: 'embedded' | 'standalone';
	} = $props();

	let setupIntentClientSecret = $state('');

	let loading = $state(false);
	const theme = getContext('theme');
	let error = $state<{ message: string } | null>(null);

	let stripe: Stripe | null = null;
	let stripeElements: StripeElements | null = null;

	const stripeState = useStripe(setupIntent.stripeAccountId);

	let cardNumberELementReady = $state(false);
	let cardCvcELementReady = $state(false);
	let cardExpiryELementReady = $state(false);

	const mountElements = (node: HTMLDivElement, stripeState: StripeState) => {
		let cardNumberELement = null;
		let cardCvcELement = null;
		let cardExpiryELement = null;
		let mounted = false;
		const mount = (stripeState: StripeState) => {
			if (!stripeState.elements || !stripeState.stripe) {
				return;
			}
			const elements = stripeState.elements;
			mounted = true;
			const style = {
				base: {
					fontSize: '16px',
					color: theme.currentColorScheme === 'dark' ? 'white' : 'black'
				}
			};
			cardNumberELement = elements.create('cardNumber', {
				showIcon: true,
				style
			});

			cardNumberELement.mount(node.querySelector('#cardNumber') as HTMLElement);

			cardCvcELement = elements.create('cardCvc', {
				style
			}) as StripeCardCvcElement;

			cardCvcELement.mount(node.querySelector('#CVC') as HTMLElement);

			cardExpiryELement = elements.create('cardExpiry', {
				style
			});
			cardExpiryELement.mount(node.querySelector('#cardExpiry') as HTMLElement);
			cardNumberELement.on('ready', (e) => {
				cardNumberELementReady = true;
			});
			cardCvcELement.on('ready', (e) => {
				cardCvcELementReady = true;
			});
			cardExpiryELement.on('ready', (e) => {
				cardExpiryELementReady = true;
			});

			cardNumberELement.on('change', (e) => {
				if (e.complete) {
					cardExpiryELement.focus();
				}
				error = null;
			});
			cardExpiryELement.on('change', (e) => {
				error = null;
				if (e.complete) {
					cardCvcELement.focus();
				}
			});
			cardExpiryELement.on('change', (e) => {
				error = null;
			});
		};
		const destroy = () => {
			cardNumberELement?.destroy?.();
			cardNumberELement = null;
			cardCvcELement?.destroy?.();
			cardCvcELement = null;
			cardExpiryELement?.destroy?.();
			cardExpiryELement = null;
		};

		const update = (stripeState: StripeState) => {
			if (!mounted && stripeState.elements && stripeState.stripe) {
				destroy();
				mounted = true;
				mount(stripeState);
			}
		};
		update(stripeState);
		return {
			destroy,
			update
		};
	};

	const submitStripe = async () => {
		if (loading || !stripeState.elements || !stripeState.stripe) return;

		// @ts-expect-error it is ok bro
		const elementsCompleted = stripeState.elements._elements.every((e) => e._complete);

		loading = true;
		const stripe = stripeState.stripe;

		// The saved-card model confirms a SetupIntent (`seti_`); deposits requested
		// before that migration are a legacy PaymentIntent hold (`pi_`). Confirm
		// with the matching Stripe call — confirmCardPayment authorizes the hold,
		// confirmCardSetup saves the card (both run 3-D Secure if required, neither
		// needs a return_url). Calling confirmCardSetup on a `pi_` secret throws,
		// which is what left the legacy link spinning forever.
		const clientSecret = setupIntent.clientSecret as string;
		const isLegacyHold = clientSecret.startsWith('pi_');
		const card = stripeState.elements?.getElement('cardNumber')!;

		let confirmedIntentId: string;
		if (isLegacyHold) {
			const result = await stripe.confirmCardPayment(clientSecret, {
				payment_method: { card }
			});
			if (result.error) {
				// Card decline / 3DS failure: stay on the card form so the customer
				// can correct the card and press Validate again, rather than being
				// thrown to the terminal error screen.
				error = { message: result.error.message ?? m.error_generic() };
				loading = false;
				return;
			}
			const pi = result.paymentIntent;
			if (!pi || pi.status !== 'requires_capture') {
				error = { message: m.error_generic() };
				loading = false;
				return;
			}
			confirmedIntentId = pi.id;
		} else {
			const result = await stripe.confirmCardSetup(clientSecret, {
				payment_method: { card }
			});
			if (result.error) {
				// Card decline / 3DS failure: stay on the card form (see above).
				error = { message: result.error.message ?? m.error_generic() };
				loading = false;
				return;
			}
			const si = result.setupIntent;
			if (!si || si.status !== 'succeeded') {
				error = { message: m.error_generic() };
				loading = false;
				return;
			}
			confirmedIntentId = si.id;
		}

		if (mode === 'standalone') {
			// Standalone mode: the booking already exists (created server-side
			// when the save-card link email was minted). Its id arrives via the
			// SetupIntent's `booking_id` metadata, surfaced as `bookingId` on the
			// SetupIntent GET response and threaded into `reservation.id` by the
			// pay route's load. Call confirm-saved-card so the API verifies the
			// SetupIntent succeeded, marks the booking 'card_saved', and transitions
			// it to 'reconfirmed'. Failure here does NOT undo the saved card — the
			// booking is real and admin needs to investigate.
			//
			// Graceful guard for the genuinely-unexpected case: a SetupIntent
			// created without an owning booking (shouldn't happen on the standalone
			// link). The card is already saved at this point, so surface a
			// non-crashing error rather than throwing.
			// Unreachable in normal flows: pay links are only minted from the staff
			// save-card emails, and every SetupIntent behind one stamps `booking_id`
			// metadata — so `reservation.id` is always present here. Belt-and-suspenders.
			const bookingId = reservation?.id;
			if (!bookingId) {
				gotoError(null, 'BOOKING_ID_MISSING');
				return;
			}
			const [confirmRes, confirmErr] = await api.confirmSavedCard({
				bookingId,
				setupIntentId: confirmedIntentId
			});
			if (confirmErr || !confirmRes?.ok) {
				gotoError(null, 'BOOKING_RECONFIRM_FAILED');
				return;
			}

			setupIntentClientSecret = setupIntent.clientSecret as string;
			nextStep();
			return;
		}

		// Embedded mode: synchronously create the booking with the saved-card
		// setupIntentId so the customer gets immediate confirmation. The
		// previous webhook-driven path is gone.
		const payload = pendingReservation.payload;
		if (!payload) {
			gotoError(null, 'RESERVATION_PAYLOAD_MISSING');
			return;
		}

		const [bookRes, bookErr] = await api.book({
			...payload,
			setupIntentId: confirmedIntentId
		});
		if (bookErr || !bookRes || bookRes.status !== 'OK') {
			// The saved card persists on the guest's Stripe Customer regardless; no
			// funds were held, so there is nothing to release on failure here.
			clearPendingReservation();
			gotoError(null, 'BOOKING_CREATE_AFTER_PAYMENT_FAILED');
			return;
		}

		clearPendingReservation();
		if (bookRes.bookingId) reservation.id = bookRes.bookingId;
		reservation.confirmedStatus = bookRes.bookingStatus;
		setupIntentClientSecret = setupIntent.clientSecret as string;
		const embeddedBookingId = bookRes.bookingId || reservation.id || '';
		if (embeddedBookingId) {
			trackBookingComplete({
				restaurant_id: widget.id,
				reservation_id: embeddedBookingId,
				service_id: selection.service?.id || '',
				service_name: selection.service?.name ? getTranslation(selection.service.name) : '',
				pax: selection.pax || 0,
				date: selection.slot?.date || '',
				time: selection.slot?.time || '',
				confirmed_status: reservation.confirmedStatus || 'confirmed',
				customer_civility: contact.civility || '',
				customer_country_code: contact.countryCode || '',
				customer_first_name: contact.firstName,
				customer_last_name: contact.lastName,
				customer_email: contact.email,
				customer_phone: contact.phone,
				customer_language: currentLocale.value,
				payment_required: true
			});
		}
		window.parent?.postMessage(
			{
				type: 'confirmation',
				data: {
					firstName: contact.firstName || '',
					lastName: contact.lastName || '',
					phone: contact.phone || '',
					pax: selection.pax || '',
					date: selection.date || ''
				}
			},
			'*'
		);
		nextStep();
	};

	$effect(() => {
		if (setupIntentClientSecret !== '') {
			loading = true;
		}
	});

	const className =
		'bg-surface-light border border-surface-lighter rounded text-contrast-light w-full focus-within:ring-1 focus-within:ring-contrast focus-within:ring-opacity-50 ring-0 transition-all p-2.5 min-h-12 grid content-center items-center';
</script>

<div class="flex flex-col gap-8 w-full h-full">
	<div class="flex items-center gap-5 pt-3">
		<button onclick={() => previousStep()}>
			<CaretLeft size={28} class="rtl:-scale-x-100" />
		</button>
		<h2 class="text-xl font-bold">{m.payment_heading()}</h2>
	</div>
	<div class="flex flex-col gap-2">
		<div>
			{@html m.payment_preAuthIntro({
				amount: `<b dir="ltr" style="unicode-bidi:isolate">${setupIntent.amount / 100}€</b>`
			})}
		</div>
	</div>
	<div class="relative w-full h-full">
		{#if loading}
			<div
				class="absolute w-full h-full flex items-center justify-center bg-white bg-opacity-50 z-10"
				transition:slide
			>
				<Spinner />
			</div>
		{/if}
		<div class="flex flex-col gap-5">
			{#if error}
				<div
					class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm"
					transition:slide
				>
					<span>{error.message}</span>
				</div>
			{/if}
			<div class="grid gap-4" use:mountElements={stripeState}>
				<div
					id="cardNumber"
					class={`${className} ${!cardExpiryELementReady ? 'bg-slate-200 animate-pulse' : ''}`}
				></div>

				<div class="grid gap-4 grid-cols-2">
					<div
						id="cardExpiry"
						class={`${className} ${!cardExpiryELementReady ? 'bg-slate-200 animate-pulse' : ''}`}
					></div>
					<div
						id="CVC"
						class={`${className} ${!cardExpiryELementReady ? 'bg-slate-200 animate-pulse' : ''}`}
					></div>
				</div>
			</div>
			<Separator>
				<div class="flex items-center gap-1 bg-white px-5">
					{m.payment_securedBy()}
					<!-- <div class="font-bold text-success">stripe</div> -->
					<img
						src="https://media.licdn.com/dms/image/D4D12AQEH143bZ1Q92g/article-cover_image-shrink_600_2000/0/1709625955980?e=2147483647&v=beta&t=q80rz-ZJ7Lz7e1q917_Vt080e6037qT96r9ZLuKHklY"
						class="h-4 rounded"
						alt=""
					/>
				</div>
			</Separator>
			<Button {loading} revert onclick={submitStripe}>{m.payment_validateButton()}</Button>
		</div>
	</div>
</div>
