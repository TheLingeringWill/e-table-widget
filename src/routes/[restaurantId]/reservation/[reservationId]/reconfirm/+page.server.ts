import { error } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';
import type { PageServerLoad } from './$types';

type DisplayState = 'confirmed' | 'reconfirmed' | 'canceled' | 'terminal' | 'error';

export const load: PageServerLoad = async ({ params }) => {
	const rid = Number(params.restaurantId);
	const numericId = Number(params.reservationId);
	if (!Number.isFinite(rid) || !Number.isFinite(numericId)) {
		error(404);
	}

	const api = createWidgetApi(rid);
	const [bookingRes, aggregateRes] = await Promise.all([
		api.getBooking(numericId),
		api.getAggregate()
	]);
	if (!bookingRes.ok) {
		error(404);
	}

	let booking = bookingRes.data;
	let displayState: DisplayState;
	let errorCode: string | undefined;

	if (booking.status === 'reconfirmed') {
		displayState = 'reconfirmed';
	} else if (booking.status === 'confirmed') {
		displayState = 'confirmed';
	} else if (booking.status === 'canceled') {
		displayState = 'canceled';
	} else if (booking.availableTransitions?.includes('reconfirmed')) {
		const result = await api.setBookingStatus(numericId, 'reconfirmed');
		if (result.ok) {
			displayState = 'reconfirmed';
			booking = result.data;
		} else {
			displayState = 'error';
			errorCode = result.error.code ?? 'transition_failed';
		}
	} else {
		displayState = 'terminal';
	}

	const r = aggregateRes.ok ? aggregateRes.data.restaurant : null;

	return {
		displayState,
		errorCode,
		reservation: {
			id: String(booking.id),
			startDate: { date: booking.date, time: booking.time },
			pax: booking.pax,
			status: booking.status,
			customer: { firstName: booking.firstName ?? '' }
		},
		restaurant: {
			name: r?.name ?? '',
			address: [r?.address, r?.zipCode, r?.city].filter(Boolean).join(' '),
			phone: r?.phone ?? ''
		}
	};
};
