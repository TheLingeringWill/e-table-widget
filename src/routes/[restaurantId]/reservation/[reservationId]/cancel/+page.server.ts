import type { Actions } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';

export const load = async ({ params, url }) => {
	const { reservationId, restaurantId } = params;
	const rid = Number(restaurantId);
	const numericId = Number(reservationId);
	if (!Number.isFinite(rid) || !Number.isFinite(numericId)) {
		error(404);
	}

	const api = createWidgetApi(rid);
	const bookingResult = await api.getBooking(numericId);
	if (!bookingResult.ok) {
		error(404);
	}
	const booking = bookingResult.data;

	// PRD §6.6: cancellation deadline + permission is encoded in
	// `availableTransitions`. If 'canceled' isn't in the list, the booking
	// is past its cancellation window or already terminal.
	if (!booking.availableTransitions?.includes('canceled') && booking.status !== 'canceled') {
		error(403, 'Cette réservation ne peut pas être annulée.');
	}

	const aggregate = await api.getAggregate();

	return {
		// Mirror the legacy reservation shape the +page.svelte template reads.
		reservation: {
			id: String(booking.id),
			restaurantId: String(booking.restaurantId),
			startDate: combineDateAndTime(booking.date, booking.time),
			pax: booking.pax,
			status: mapStatusToLegacy(booking.status)
		},
		restaurant: {
			id: String(rid),
			name: aggregate.ok ? aggregate.data.restaurant.name : ''
		},
		builder: url.searchParams.get('builder') === 'true',
		// PRD §5: `widgetId` segment is gone; the "Faire une autre réservation"
		// button now navigates to `/${restaurantId}`. Pass a minimal stub so
		// the +page.svelte template's existing widget.id rendering keeps working.
		widget: {
			id: String(rid)
		}
	};
};

export const actions = {
	default: async ({ params }) => {
		const { reservationId, restaurantId } = params;
		const rid = Number(restaurantId);
		const numericId = Number(reservationId);
		if (!Number.isFinite(rid) || !Number.isFinite(numericId)) {
			error(404);
		}

		const api = createWidgetApi(rid);
		const result = await api.setBookingStatus(numericId, 'canceled');
		if (!result.ok) {
			// 409 = invalid status transition (covers cancel-too-late races).
			error(409, result.error.message);
		}
	}
} satisfies Actions;

function combineDateAndTime(date: string, time: string): Date {
	const [y, m, d] = date.split('-').map(Number);
	const [h, mn] = time.split(':').map(Number);
	return new Date(y, (m ?? 1) - 1, d ?? 1, h ?? 0, mn ?? 0);
}

// The +page.svelte template checks status against the legacy 'USER_CANCELED' /
// 'RESTAURANT_CANCELED' literals. Map the REST `canceled` value into one of
// those so the success branch renders.
function mapStatusToLegacy(status: string): string {
	if (status === 'canceled') return 'USER_CANCELED';
	return status;
}
