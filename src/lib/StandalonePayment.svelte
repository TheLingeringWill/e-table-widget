<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import type { SlotTimestamp } from '$lib/api-types';
	import { formatSlotDate } from '$lib/utils/slotFormat';
	import Payment from './Widget/Payment.svelte';
	import { paymentIntent } from './states/paymentIntent.svelte';
	import { contact } from './states/contact.svelte';
	import { selection } from './states/selection.svelte';
	import { reservation } from './states/reservation.svelte';
	import { step, gotoStep } from './states/step.svelte';
	import { error } from './states/error.svelte';
	import { Check, Warning, Calendar, ForkKnife, User, Info } from 'phosphor-svelte';
	import Spinner from './Spinner.svelte';

	type PageData = {
		paymentIntent?: {
			id: string;
			client_secret: string | null;
			amount: number | null;
			status: string;
		};
		reservation?: {
			id?: string;
			serviceId?: string;
			startDate?: SlotTimestamp | null;
			pax?: number;
			notes?: string;
			contact?: {
				firstName?: string;
				lastName?: string;
				phone?: string;
				email?: string;
			};
		};
		stripeAccountId?: string | null;
		restaurant?: {
			name?: string;
		};
		error?: string;
	};

	let { data }: { data: PageData } = $props();

	let mounted = $state(false);

	// Provide minimal theme context for Payment component
	setContext('theme', {
		currentColorScheme: 'light'
	});

	onMount(() => {
		if (data.error) {
			gotoStep('ERROR');
			error.message = data.error;
			mounted = true;
			return;
		}

		if (!data.paymentIntent) {
			gotoStep('ERROR');
			error.message = 'Le paiement ne peut pas être chargé.';
			mounted = true;
			return;
		}

		// Populate payment intent state
		paymentIntent.id = data.paymentIntent.id;
		paymentIntent.clientSecret = data.paymentIntent.client_secret;
		paymentIntent.amount = data.paymentIntent.amount;
		paymentIntent.stripeAccountId = data.stripeAccountId ?? null;

		// Populate contact from reservation
		if (data.reservation?.contact) {
			contact.firstName = data.reservation.contact.firstName || '';
			contact.lastName = data.reservation.contact.lastName || '';
			contact.email = data.reservation.contact.email || '';
			contact.phone = data.reservation.contact.phone || '';
		}

		// Populate selection + reservation for summary display. Slot timestamps
		// are carried as-is via `reservation.startDate` ({date,time} strings) so
		// the time isn't lost to a browser-local midnight Date conversion.
		if (data.reservation) {
			selection.pax = data.reservation.pax ?? null;
			// Standalone mode: Payment.svelte reads `reservation.id` to call
			// `setBookingStatus` after Stripe authorizes the card. The booking
			// already exists for this flow.
			reservation.id = data.reservation.id;
			reservation.serviceId = data.reservation.serviceId;
			reservation.pax = data.reservation.pax;
			reservation.notes = data.reservation.notes;
			reservation.startDate = data.reservation.startDate ?? undefined;
		}

		// Check if payment already completed (matches Stripe vocabulary)
		if (
			data.paymentIntent.status === 'succeeded' ||
			data.paymentIntent.status === 'requires_capture'
		) {
			gotoStep('DONE');
		} else {
			gotoStep('PAYMENT');
		}

		mounted = true;
	});

	const formatAmount = (amount: number | null) => {
		if (!amount) return '0.00';
		return (amount / 100).toFixed(2);
	};
</script>

<svelte:head>
	<title>Paiement - {data.restaurant?.name || 'Réservation'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
	<div class="w-full max-w-lg">
		{#if !mounted}
			<!-- Loading state -->
			<div class="bg-white rounded-2xl shadow-lg p-12 text-center">
				<Spinner size={48} width={4} />
				<p class="mt-6 text-gray-600 font-medium">Chargement...</p>
			</div>
		{:else if step.step === 'ERROR'}
			<!-- Error state -->
			<div class="bg-white rounded-2xl shadow-lg p-8 text-center">
				<div class="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
					<Warning size={48} class="text-red-500" weight="regular" />
				</div>
				<h1 class="text-2xl font-semibold text-gray-900 mb-3">Une erreur est survenue</h1>
				<p class="text-gray-600 text-base leading-relaxed">
					{error.message || data.error || 'Impossible de charger le paiement.'}
				</p>
			</div>
		{:else if step.step === 'DONE'}
			<!-- Success state -->
			<div class="bg-white rounded-2xl shadow-lg p-8">
				<div class="text-center mb-8">
					<div
						class="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6"
					>
						<Check size={48} class="text-green-500" weight="bold" />
					</div>
					<h1 class="text-2xl font-semibold text-gray-900 mb-2">Paiement autorisé</h1>
					<p class="text-gray-600">Votre réservation est confirmée.</p>
				</div>

				<!-- Success summary -->
				<div class="bg-gray-50 rounded-xl p-6 space-y-4">
					{#if data.restaurant?.name}
						<div class="text-center pb-4 border-b border-gray-200">
							<p class="text-sm text-gray-500 uppercase tracking-wider mb-1">Restaurant</p>
							<p class="text-lg font-semibold text-gray-900">{data.restaurant.name}</p>
						</div>
					{/if}

					{#if reservation.startDate}
						<div class="flex items-start gap-3">
							<Calendar size={24} class="text-gray-400 mt-0.5 flex-shrink-0" />
							<div>
								<p class="text-sm text-gray-500 mb-0.5">Date et heure</p>
								<p class="text-gray-900 font-medium">
									{formatSlotDate(reservation.startDate.date, 'dddd D MMMM YYYY')} à
									{reservation.startDate.time}
								</p>
							</div>
						</div>
					{/if}

					{#if selection.pax}
						<div class="flex items-start gap-3">
							<ForkKnife size={24} class="text-gray-400 mt-0.5 flex-shrink-0" />
							<div>
								<p class="text-sm text-gray-500 mb-0.5">Nombre de personnes</p>
								<p class="text-gray-900 font-medium">
									{selection.pax} personne{selection.pax > 1 ? 's' : ''}
								</p>
							</div>
						</div>
					{/if}

					{#if contact.email}
						<div class="pt-4 border-t border-gray-200">
							<p class="text-sm text-gray-600">
								Un email de confirmation a été envoyé à <span class="font-medium text-gray-900"
									>{contact.email}</span
								>
							</p>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Payment form -->
			<div class="bg-white rounded-2xl shadow-lg overflow-hidden">
				<!-- Header with gradient -->
				<div class="bg-gradient-to-br from-gray-900 to-gray-800 text-white px-8 py-6">
					<h1 class="text-2xl font-serif font-normal text-center mb-1">
						{data.restaurant?.name || 'Réservation'}
					</h1>
					<p class="text-gray-300 text-sm text-center">Finalisation de votre réservation</p>
				</div>

				<!-- Main content -->
				<div class="p-8 space-y-6">
					<!-- Reservation summary card -->
					<div class="bg-gray-50 rounded-xl p-6 space-y-4">
						<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
							Votre réservation
						</h2>

						{#if reservation.startDate}
							<div class="flex items-start gap-3">
								<Calendar size={24} class="text-indigo-500 mt-0.5 flex-shrink-0" />
								<div>
									<p class="text-sm text-gray-500 mb-0.5">Date et heure</p>
									<p class="text-gray-900 font-medium">
										{formatSlotDate(reservation.startDate.date, 'dddd D MMMM YYYY')} à
										{reservation.startDate.time}
									</p>
								</div>
							</div>
						{/if}

						{#if selection.pax}
							<div class="flex items-start gap-3">
								<ForkKnife size={24} class="text-indigo-500 mt-0.5 flex-shrink-0" />
								<div>
									<p class="text-sm text-gray-500 mb-0.5">Nombre de personnes</p>
									<p class="text-gray-900 font-medium">
										{selection.pax} personne{selection.pax > 1 ? 's' : ''}
									</p>
								</div>
							</div>
						{/if}

						{#if contact.firstName || contact.lastName}
							<div class="flex items-start gap-3">
								<User size={24} class="text-indigo-500 mt-0.5 flex-shrink-0" />
								<div>
									<p class="text-sm text-gray-500 mb-0.5">Nom</p>
									<p class="text-gray-900 font-medium">{contact.firstName} {contact.lastName}</p>
								</div>
							</div>
						{/if}
					</div>

					<!-- Amount card -->
					<div class="border-2 border-indigo-100 rounded-xl p-6 bg-indigo-50/30">
						<div class="flex justify-between items-start mb-3">
							<div>
								<p class="text-sm text-gray-600 mb-1">Empreinte bancaire</p>
								<p class="text-xs text-gray-500">Aucun prélèvement ne sera effectué</p>
							</div>
							<div class="text-right">
								<p class="text-3xl font-bold text-gray-900">
									{formatAmount(paymentIntent.amount)} €
								</p>
							</div>
						</div>

						<div
							class="flex items-start gap-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
						>
							<Info size={20} class="text-blue-600 mt-0.5 flex-shrink-0" />
							<p class="text-xs text-blue-900 leading-relaxed">
								Ce montant sera uniquement autorisé sur votre carte et ne sera prélevé qu'en cas de
								non-présentation ou d'annulation tardive.
							</p>
						</div>
					</div>

					<!-- Payment component -->
					<div class="payment-wrapper">
						<Payment widget={{ id: data.paymentIntent?.id }} mode="standalone" />
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%);
		margin: 0;
		padding: 0;
		min-height: 100vh;
	}

	/* Hide the back button from Payment component in standalone mode */
	.payment-wrapper :global(button:has(svg[class*='CaretLeft'])) {
		display: none;
	}

	/* Hide the header from Payment component */
	.payment-wrapper :global(.flex.items-center.gap-5.pt-3) {
		display: none;
	}

	/* Hide the payment description text (already shown in amount card) */
	.payment-wrapper :global(.flex.flex-col.gap-2) {
		display: none;
	}

	/* Improve spacing for payment form */
	.payment-wrapper :global(.flex.flex-col.gap-8) {
		gap: 1.5rem;
	}

	/* Style the payment button to match design */
	.payment-wrapper :global(#button) {
		background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
		color: white;
		border-radius: 0.75rem;
		padding: 1rem;
		font-weight: 600;
		box-shadow:
			0 4px 6px -1px rgba(79, 70, 229, 0.2),
			0 2px 4px -1px rgba(79, 70, 229, 0.1);
		transition: all 0.2s;
	}

	.payment-wrapper :global(#button:hover) {
		transform: translateY(-1px);
		box-shadow:
			0 6px 8px -1px rgba(79, 70, 229, 0.3),
			0 4px 6px -1px rgba(79, 70, 229, 0.15);
	}

	.payment-wrapper :global(#button:active) {
		transform: translateY(0);
	}
</style>
