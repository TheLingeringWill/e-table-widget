import { error } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';

export const load = async ({ params }) => {
	const { reservationId, restaurantId } = params;
	const rid = Number(restaurantId);
	const numericId = Number(reservationId);
	if (!Number.isFinite(rid) || !Number.isFinite(numericId)) {
		error(404);
	}

	const api = createWidgetApi(rid);
	const result = await api.getBooking(numericId);
	if (!result.ok) {
		error(404);
	}
	const booking = result.data;

	// PRD §6.6: drive button visibility from `availableTransitions`. If
	// 'reconfirmed' is allowed, perform the transition; if not, the page
	// renders the booking in whatever its current state is.
	if (booking.availableTransitions?.includes('reconfirmed')) {
		const transitionResult = await api.setBookingStatus(numericId, 'reconfirmed');
		if (!transitionResult.ok) {
			// Surface the API's own error rather than masking it; cancel-
			// too-late and similar concurrency races land here.
			error(409, transitionResult.error.message);
		}
	}

	// Re-fetch to return the post-transition booking shape to the page.
	const after = await api.getBooking(numericId);
	if (!after.ok) {
		error(404);
	}

	// Aggregate carries the restaurant name the +page.svelte template reads.
	const aggregate = await api.getAggregate();

	return {
		// Mirror the legacy reservation shape the +page.svelte template reads.
		// startDate is reconstructed from the REST date+time pair.
		reservation: {
			id: String(after.data.id),
			restaurantId: String(after.data.restaurantId),
			startDate: combineDateAndTime(after.data.date, after.data.time),
			pax: after.data.pax,
			status: after.data.status,
			restaurant: {
				name: aggregate.ok ? aggregate.data.restaurant.name : ''
			},
			customer: {
				firstName: after.data.firstName ?? '',
				lastName: after.data.lastName ?? ''
			}
		}
	};
};

function combineDateAndTime(date: string, time: string): Date {
	const [y, m, d] = date.split('-').map(Number);
	const [h, mn] = time.split(':').map(Number);
	return new Date(y, (m ?? 1) - 1, d ?? 1, h ?? 0, mn ?? 0);
}
