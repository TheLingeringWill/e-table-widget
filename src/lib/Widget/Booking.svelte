<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/widget-rpc-client';
	import Spinner from '$lib/Spinner.svelte';
	import { selection } from '$lib/states/selection.svelte';
	import { contact } from '$lib/states/contact.svelte';
	import { gotoStep, nextStep } from '$lib/states/step.svelte';
	import { ApiReturnStatus } from '$lib/api-types';
	import { gotoError } from '$lib/states/error.svelte';
	import { paymentIntent } from '$lib/states/paymentIntent.svelte';
	import { reservation, setPendingReservation } from '$lib/states/reservation.svelte';
	import { waitlist } from '$lib/states/waitlist.svelte';
	import { trackBookingComplete } from '$lib/gtm.svelte';
	import { getTranslation } from '$lib/context.svelte.js';
	import { currentLocale } from '$lib/states/locale.svelte';

	let {
		widget
	}: {
		widget: any;
	} = $props();

	let loading = $state(true);

	const book = async () => {
		loading = true;

		if (!contact.civility) {
			return gotoError(null, 'CIVILITY_REQUIRED');
		}
		if (!contact.countryCode) {
			return gotoError(null, 'COUNTRY_CODE_REQUIRED');
		}

		// Build the full reservation payload up front: both branches below need
		// it (the Stripe pre-check stashes it for Payment.svelte to replay; the
		// regular path posts it directly).
		const reservationPayload = {
			reservation: {
				id: reservation?.id,
				restaurantId: widget.restaurantId,
				serviceId: selection.service.id,
				pax: selection.pax,
				seatingTime: reservation?.seatingTime,
				date: { date: selection.slot.date, time: selection.slot.time },
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
			joiningWaitlist: waitlist.isWaitlist
		};

		// Waitlist: skip the deposit pre-check — a waitlist entry is not a
		// confirmed booking, so no deposit is owed even if the slot/shift has a
		// capture policy. Edits with an already-authorized PI: skip too — the
		// deposit was already collected. All other cases (new bookings + edits
		// moving to a deposit-required slot) go through the pre-check.
		const alreadyHasPayment = reservation.paymentStatus === 'requires_capture';
		if (!waitlist.isWaitlist && !alreadyHasPayment) {
			// New bookings: try to pre-create a PaymentIntent. If the slot has no
			// deposit policy the API returns 409 "no deposit required" and we fall
			// through to the regular create path. Otherwise we collect the
			// clientSecret and route to PAYMENT, where Stripe Elements will
			// authorize the card; the booking itself is then persisted by
			// Payment.svelte calling `api.book(...)` synchronously with
			// `paymentIntentId` after `confirmCardPayment` resolves.
			const [piRes, piErr] = await api.createPaymentIntent({
				restaurantId: widget.restaurantId,
				date: { date: selection.slot.date, time: selection.slot.time },
				pax: selection.pax,
				countryCode: contact.countryCode
			});
			if (piErr) {
				return gotoError(null, 'CREATE_PAYMENT_INTENT_FAILED');
			}
			if (piRes.ok) {
				paymentIntent.id = piRes.paymentIntentId;
				paymentIntent.amount = piRes.amount;
				paymentIntent.clientSecret = piRes.clientSecret;
				paymentIntent.stripeAccountId = piRes.stripeAccountId ?? null;
				// Stash the full reservation payload so Payment.svelte can replay
				// it post-confirm with the captured paymentIntentId.
				setPendingReservation(reservationPayload);
				gotoStep('PAYMENT');
				return;
			}
			// `no deposit required` → no deposit policy on this slot; fall through
			// to the regular create path below.
		}

		const [res, err] = await api.book(reservationPayload);
		if (err) {
			return console.log(err);
		}
		if (res.status === 'OK') {
			if (res.bookingId) reservation.id = res.bookingId;
			reservation.confirmedStatus = res.bookingStatus;

			const bookingId = res.bookingId || reservation.id || '';
			if (bookingId) {
				trackBookingComplete({
					restaurant_id: widget.restaurantId,
					reservation_id: bookingId,
					service_id: selection.service?.id || '',
					service_name: selection.service?.name ? getTranslation(selection.service.name) : '',
					pax: selection.pax || 0,
					date: selection.slot?.date || '',
					time: selection.slot?.time || '',
					confirmed_status: reservation.confirmedStatus || 'unknown',
					customer_civility: contact.civility || '',
					customer_country_code: contact.countryCode || '',
					customer_first_name: contact.firstName,
					customer_last_name: contact.lastName,
					customer_email: contact.email,
					customer_phone: contact.phone,
					customer_language: currentLocale.value,
					customer_notes: contact.notes || undefined,
					payment_required: !!paymentIntent.id
				});
			}

			nextStep();
		} else if (res.status === ApiReturnStatus.CUSTOMER_ALREADY_BOOKED_SERVICE) {
			gotoError(null, ApiReturnStatus.CUSTOMER_ALREADY_BOOKED_SERVICE);
		} else {
			gotoError(res.message ?? null, res.status);
		}
	};

	onMount(() => {
		setTimeout(() => {
			book();
		}, 1000);
	});
</script>

<div class="w-full h-full">
	<!-- <div class="border-b w-full max-w-[100px] h-[1px] px-5"></div> -->
	<!-- <form class="flex flex-col gap-5 flex-grow">
		<div class="flex flex-col gap-5">
			<div class="flex items-center gap-5 pt-3">
				<button onclick={() => previousStep()}>
					<CaretLeft size={28} />
				</button>
				<h2 class="text-md font-normal">Confirmation</h2>
			</div>
			<div class="flex flex-col gap-2">
				<div>Réservation</div>
				<hr />
				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-2">
						<div class="text-surface-fg">Nom :</div>
						<div>{contact.firstName} {contact.lastName}</div>
					</div>
					<div class="flex flex-col gap-2">
						<div class="text-surface-fg">Email :</div>
						<div>{contact.email}</div>
					</div>
					<div class="flex flex-col gap-2">
						<div class="text-surface-fg">Téléphone :</div>
						<div>{contact.phone}</div>
					</div>
				</div>
				<div class="flex items-center gap-8">
					<Button onclick={book} revert>Confirmer <Check size={24} /></Button>
				</div>
			</div>
		</div>
	</form> -->

	<div class="flex flex-col gap-5 h-full">
		<!-- <div class="flex items-center gap-5 pt-3">
			<button onclick={() => previousStep()}>
				<CaretLeft size={28} />
			</button>
			<h2 class="text-md font-normal">Confirmation</h2>
		</div> -->
		<div class="flex items-center justify-center w-full h-full">
			<Spinner />
		</div>
	</div>
</div>
