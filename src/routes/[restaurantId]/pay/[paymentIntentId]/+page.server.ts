import { error } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';
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

	// The SetupIntent GET response now carries `bookingId` (resolved from the
	// SetupIntent's `booking_id` metadata, set for staff-initiated setups — the
	// booking exists before the card is saved). The standalone confirm-saved-card
	// path needs it. We don't fetch the full booking for the summary; the card
	// form renders from the SetupIntent alone. `reservation.id` is surfaced so the
	// page can pass it to the confirm-saved-card RPC after Stripe succeeds.
	const aggregate = await api.getAggregate();
	const restaurantName = aggregate.ok ? aggregate.data.restaurant.name : '';

	return {
		setupIntent: {
			id: paymentIntentId,
			client_secret: si.clientSecret,
			amount: si.amountCents,
			status: si.status
		},
		reservation: si.bookingId != null ? { id: String(si.bookingId) } : undefined,
		stripeAccountId: si.stripeConnectAccountId ?? null,
		restaurant: {
			name: restaurantName
		}
	};
};
