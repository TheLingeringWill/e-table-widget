<script lang="ts" module>
	import { env } from '$env/dynamic/public';
	import {
		loadStripe,
		type Stripe,
		type StripeCardCvcElement,
		type StripeElements
	} from '@stripe/stripe-js';
	import { getContext, onMount } from 'svelte';

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
				stripeState.elements = stripe.elements();

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
	import { api } from '$lib/widget-rpc-client';
	import Separator from 'maket/Separator';
	import { browser, dev } from '$app/environment';
	import { selection } from '$lib/states/selection.svelte';
	import { contact } from '$lib/states/contact.svelte';
	import { nextStep, previousStep } from '$lib/states/step.svelte';
	import { gotoError } from '$lib/states/error.svelte';
	import { paymentIntent } from '$lib/states/paymentIntent.svelte';
	import { ApiReturnStatus } from '$lib/api-types';

	let {
		widget
	}: {
		widget: any;
	} = $props();

	let paymentIntentClientSecret = $state('');

	let loading = $state(false);
	const theme = getContext('theme');
	let error = $state<{ message: string } | null>(null);

	let stripe: Stripe | null = null;
	let stripeElements: StripeElements | null = null;

	const stripeState = useStripe(paymentIntent.stripeAccountId);

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

		const domain = dev ? 'http://localhost:8987' : 'https://edged.cloud';
		const path = `/${widget.id}?s=${paymentIntent.clientSecret}`;
		const result = await stripe.confirmCardPayment(paymentIntent.clientSecret as string, {
			payment_method: {
				card: stripeState.elements?.getElement('cardNumber')!
			},
			return_url: `${domain}${path}`
		});

		if (result.error) {
			gotoError(null, result.error.message);
			return;
		}

		// Card is now in `requires_capture` state on Stripe's side. Persist the
		// booking with the authorized `paymentIntentId`; the API verifies the
		// intent server-side and inserts with status = Reconfirmed.
		if (!contact.civility || !contact.countryCode) {
			gotoError('Contact information missing.', 'CONTACT_MISSING');
			return;
		}
		const [bookRes, bookErr] = await api.book({
			reservation: {
				restaurantId: widget.restaurantId,
				serviceId: selection.service.id,
				pax: selection.pax,
				date: selection.slot.date,
				notes: contact.notes,
				contact: {
					civility: contact.civility,
					countryCode: contact.countryCode,
					firstName: contact.firstName,
					lastName: contact.lastName,
					phone: contact.phone,
					email: contact.email
				}
			},
			paymentIntentId: paymentIntent.id ?? undefined
		});

		if (bookErr || (bookRes && bookRes.status !== ApiReturnStatus.OK)) {
			gotoError(bookRes?.message ?? null, bookRes?.status ?? 'BOOK_AFTER_PAYMENT_FAILED');
			return;
		}

		paymentIntentClientSecret = paymentIntent.clientSecret;
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
		if (paymentIntentClientSecret !== '') {
			loading = true;
		}
	});

	const className =
		'bg-surface-light border border-surface-lighter rounded text-contrast-light w-full focus-within:ring-1 focus-within:ring-contrast focus-within:ring-opacity-50 ring-0 transition-all p-2.5 min-h-12 grid content-center items-center';
</script>

<div class="flex flex-col gap-8 w-full h-full">
	<div class="flex items-center gap-5 pt-3">
		<button onclick={() => previousStep()}>
			<CaretLeft size={28} />
		</button>
		<h2 class="text-md font-normal">Paiement</h2>
	</div>
	<div class="flex flex-col gap-2">
		<div>
			Pour confirmer votre réservation, nous procédons à une simple pré-autorisation de <b
				>{paymentIntent.amount / 100}€</b
			>. Aucun débit ne sera effectué, votre carte sera juste validée.
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
					Paiement sécurisé par
					<!-- <div class="font-bold text-success">stripe</div> -->
					<img
						src="https://media.licdn.com/dms/image/D4D12AQEH143bZ1Q92g/article-cover_image-shrink_600_2000/0/1709625955980?e=2147483647&v=beta&t=q80rz-ZJ7Lz7e1q917_Vt080e6037qT96r9ZLuKHklY"
						class="h-4 rounded"
						alt=""
					/>
				</div>
			</Separator>
			<Button {loading} revert onclick={submitStripe}>Valider</Button>
		</div>
	</div>
</div>
