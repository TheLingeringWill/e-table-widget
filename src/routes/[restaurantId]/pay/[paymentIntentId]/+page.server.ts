import { error } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';
import { bookingToLegacyReservation } from '$lib/server/api/adapters/booking';

export const load = async ({ params }) => {
	const { paymentIntentId, restaurantId } = params;
	const rid = Number(restaurantId);
	if (!Number.isFinite(rid)) {
		error(404, 'Restaurant not found');
	}

	const api = createWidgetApi(rid);

	const piResult = await api.getPaymentIntent(paymentIntentId!);
	if (!piResult.ok) {
		return {
			error: 'Le paiement ne peut pas être chargé.'
		};
	}
	const pi = piResult.data;

	const bookingResult = await api.getBooking(pi.bookingId);
	const reservation = bookingResult.ok ? bookingToLegacyReservation(bookingResult.data) : undefined;

	const aggregate = await api.getAggregate();
	const restaurantName = aggregate.ok ? aggregate.data.restaurant.name : '';

	return {
		paymentIntent: {
			id: paymentIntentId,
			client_secret: pi.clientSecret,
			amount: pi.amountCents,
			status: pi.status
		},
		reservation,
		stripeAccountId: pi.stripeConnectAccountId ?? null,
		restaurant: {
			name: restaurantName
		}
	};
};
