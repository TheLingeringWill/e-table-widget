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
	import { reservation } from '$lib/states/reservation.svelte';
	import { waitlist } from '$lib/states/waitlist.svelte';

	let {
		widget
	}: {
		widget: any;
	} = $props();

	let loading = $state(true);

	const book = async () => {
		loading = true;

		if (!contact.civility) {
			return gotoError('La civilité est requise.', 'CIVILITY_REQUIRED');
		}
		if (!contact.countryCode) {
			return gotoError('Le code pays du téléphone est requis.', 'COUNTRY_CODE_REQUIRED');
		}

		// Edits: skip the deposit pre-check and just update the existing booking.
		// Waitlist: skip too — a waitlist entry is not a confirmed booking, so no
		// deposit is owed even if the slot/shift has a capture policy. The server
		// resolves status='waiting_list' from the live shift+slot in `book`.
		if (!reservation?.id && !waitlist.isWaitlist) {
			// New bookings: try to pre-create a PaymentIntent. If the slot has no
			// deposit policy the API returns 409 "no deposit required" and we fall
			// through to the legacy create path. Otherwise we collect the
			// clientSecret and route to PAYMENT, where Stripe Elements will
			// authorize the card; the booking itself is then persisted with
			// `paymentIntentId` and lands in status = Reconfirmed.
			const [piRes, piErr] = await api.createPaymentIntent({
				restaurantId: widget.restaurantId,
				date: selection.slot.date,
				pax: selection.pax,
				phone: contact.phone
			});
			if (piErr) {
				return gotoError(null, 'CREATE_PAYMENT_INTENT_FAILED');
			}
			if (piRes.ok) {
				paymentIntent.id = piRes.paymentIntentId;
				paymentIntent.amount = piRes.amount;
				paymentIntent.clientSecret = piRes.clientSecret;
				paymentIntent.stripeAccountId = piRes.stripeAccountId ?? null;
				gotoStep('PAYMENT');
				return;
			}
			// `not deposit required` → no deposit policy on this slot; fall through
			// to the regular create path below.
		}

		const [res, err] = await api.book({
			reservation: {
				id: reservation?.id,
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
			joiningWaitlist: waitlist.isWaitlist
		});
		if (err) {
			return console.log(err);
		}
		if (res.status === 'OK') {
			nextStep();
		} else if (
			res.status === ApiReturnStatus.REQUIRES_PAYMENT_INTENT &&
			res.paymentIntent?.amount > 0 &&
			res.paymentIntent?.clientSecret?.length > 0
		) {
			// Legacy fallback: API created the PI server-side and persisted the
			// booking in RequiresPaymentIntent. Should not happen for new bookings
			// after the createPaymentIntent pre-check above, but kept for the
			// edit-existing-booking path.
			paymentIntent.id = res.paymentIntent.id;
			paymentIntent.amount = res.paymentIntent.amount;
			paymentIntent.clientSecret = res.paymentIntent.clientSecret;
			paymentIntent.stripeAccountId = res.paymentIntent.stripeAccountId ?? null;
			gotoStep('PAYMENT');
		} else if (res.status === ApiReturnStatus.CUSTOMER_ALREADY_BOOKED_SERVICE) {
			gotoError('Vous avez déjà réservé pour ce service.');
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
