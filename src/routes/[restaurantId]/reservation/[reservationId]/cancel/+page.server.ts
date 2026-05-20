import type { Actions } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';
import { computeCutoff } from '$lib/utils/cancelCutoff';
import { tz } from '$lib/utils/tz';
import * as m from '$lib/paraglide/messages';

export const load = async ({ params, url }) => {
	const { reservationId, restaurantId } = params;
	const rid = Number(restaurantId);
	const numericId = Number(reservationId);
	if (!Number.isFinite(rid) || !Number.isFinite(numericId)) {
		error(404);
	}

	const api = createWidgetApi(rid);
	const [bookingResult, aggregate] = await Promise.all([
		api.getBooking(numericId),
		api.getAggregate()
	]);
	if (!bookingResult.ok) {
		error(404);
	}
	const booking = bookingResult.data;
	const restaurantTimezone = tz(aggregate.ok ? aggregate.data.restaurant.timezone : '');

	const bookingSlot = { date: booking.date, time: booking.time };
	const shift = booking.shiftSlot?.shift ?? null;
	const cancelStatus = computeCutoff({
		action: 'cancel',
		booking: bookingSlot,
		shift,
		restaurantTimezone
	});
	const updateStatus = computeCutoff({
		action: 'update',
		booking: bookingSlot,
		shift,
		restaurantTimezone
	});

	return {
		// Mirror the legacy reservation shape the +page.svelte template reads.
		reservation: {
			id: String(booking.id),
			restaurantId: String(booking.restaurantId),
			startDate: { date: booking.date, time: booking.time },
			pax: booking.pax,
			status: mapStatusToLegacy(booking.status),
			firstName: booking.firstName ?? '',
			lastName: booking.lastName ?? '',
			email: booking.email ?? '',
			phone: booking.phone ?? '',
			countryCode: booking.countryCode ?? null
		},
		restaurant: {
			id: String(rid),
			name: aggregate.ok ? aggregate.data.restaurant.name : '',
			timezone: restaurantTimezone
		},
		builder: url.searchParams.get('builder') === 'true',
		// PRD §5: `widgetId` segment is gone; the "Faire une autre réservation"
		// button now navigates to `/${restaurantId}`. Pass a minimal stub so
		// the +page.svelte template's existing widget.id rendering keeps working.
		widget: {
			id: String(rid)
		},
		cancelStatus,
		updateStatus
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
		// Re-evaluate the cutoff against fresh booking state — covers the race
		// where the user opened the page in time but clicked Cancel after the
		// window lapsed.
		const [bookingResult, aggregate] = await Promise.all([
			api.getBooking(numericId),
			api.getAggregate()
		]);
		if (!bookingResult.ok) {
			error(404);
		}
		const booking = bookingResult.data;
		const restaurantTimezone = tz(aggregate.ok ? aggregate.data.restaurant.timezone : '');
		const cancelStatus = computeCutoff({
			action: 'cancel',
			booking: { date: booking.date, time: booking.time },
			shift: booking.shiftSlot?.shift ?? null,
			restaurantTimezone
		});
		if (!cancelStatus.allowed) {
			error(409, m.cancel_notAllowedReason());
		}

		const result = await api.setBookingStatus(numericId, 'canceled');
		if (!result.ok) {
			error(409, result.error.message);
		}
	}
} satisfies Actions;

// The +page.svelte template checks status against the legacy 'USER_CANCELED' /
// 'RESTAURANT_CANCELED' literals. Map the REST `canceled` value into one of
// those so the success branch renders.
function mapStatusToLegacy(status: string): string {
	if (status === 'canceled') return 'USER_CANCELED';
	return status;
}
