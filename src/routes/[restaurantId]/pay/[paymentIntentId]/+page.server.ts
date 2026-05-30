import { error } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';
import { bookingToLegacyReservation } from '$lib/server/api/adapters/booking';
import * as m from '$lib/paraglide/messages';

export const load = async ({ params }) => {
	// The updated widget always issues saved-card (SetupIntent) links, so the
	// route param — kept as `paymentIntentId` for URL stability — is now a Stripe
	// SetupIntent id (e.g. `seti_...`). Load it as a setup intent.
	const { paymentIntentId, restaurantId } = params;
	const rid = Number(restaurantId);
	if (!Number.isFinite(rid)) {
		error(404, 'Restaurant not found');
	}

	const api = createWidgetApi(rid);

	const siResult = await api.getSetupIntent(paymentIntentId!);
	if (!siResult.ok) {
		return {
			error: m.error_loadPaymentIntent()
		};
	}
	const si = siResult.data;

	// The SetupIntent GET response carries `bookingId` (resolved from the
	// SetupIntent's `booking_id` metadata, set for staff-initiated setups — the
	// booking exists before the card is saved). We fetch the full booking to
	// populate the "Your reservation" summary (date/time, party size, name). If
	// that fetch fails we fall back to an id-only stub so `reservation.id` is
	// still present for the confirm-saved-card RPC the page runs after Stripe
	// succeeds.
	let reservation;
	if (si.bookingId != null) {
		const bookingResult = await api.getBooking(si.bookingId);
		reservation = bookingResult.ok
			? bookingToLegacyReservation(bookingResult.data)
			: { id: String(si.bookingId) };
	}

	const aggregate = await api.getAggregate();
	const restaurantName = aggregate.ok ? aggregate.data.restaurant.name : '';

	return {
		setupIntent: {
			id: paymentIntentId,
			client_secret: si.clientSecret,
			amount: si.amountCents,
			status: si.status
		},
		reservation,
		stripeAccountId: si.stripeConnectAccountId ?? null,
		restaurant: {
			name: restaurantName
		}
	};
};
