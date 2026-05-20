import { error, redirect } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';
import { computeCutoff } from '$lib/utils/cancelCutoff';
import { tz } from '$lib/utils/tz';

export const load = async ({ params, url }) => {
	const { reservationId, restaurantId } = params;
	const rid = Number(restaurantId);
	const numericId = Number(reservationId);
	if (!Number.isFinite(rid) || !Number.isFinite(numericId)) {
		error(404);
	}

	// Preflight: the REST API scopes by `rid`, so a missing or cross-restaurant
	// booking returns not-found here. The booking is fetched again client-side
	// by Widget.svelte's `loadReservation` to seed widget state — keeping the
	// client load path untouched is worth the duplicate call.
	const api = createWidgetApi(rid);
	const [bookingResult, aggregate] = await Promise.all([
		api.getBooking(numericId),
		api.getAggregate()
	]);
	if (!bookingResult.ok) {
		error(404);
	}
	const booking = bookingResult.data;

	// Gate entry to the editor on the shift's update cutoff. If the window has
	// closed, send the user to the management page where the locked-state
	// message and Cancel option (if still in-window) are already rendered —
	// a 403 error page would be a dead end.
	const restaurantTimezone = tz(aggregate.ok ? aggregate.data.restaurant.timezone : '');
	const updateStatus = computeCutoff({
		action: 'update',
		booking: { date: booking.date, time: booking.time },
		shift: booking.shiftSlot?.shift ?? null,
		restaurantTimezone
	});
	if (!updateStatus.allowed) {
		redirect(303, `/${restaurantId}/reservation/${reservationId}/cancel`);
	}

	return {
		builder: url.searchParams.get('builder') === 'true'
	};
};
