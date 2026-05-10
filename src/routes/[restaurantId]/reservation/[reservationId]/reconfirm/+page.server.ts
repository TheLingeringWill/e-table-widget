import { error, fail, type Actions } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';
import type { BookingStatus } from '$lib/api-types';
import type { PageServerLoad } from './$types';

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

	const b = bookingRes.data;
	const r = aggregateRes.ok ? aggregateRes.data.restaurant : null;

	return {
		reservation: {
			id: String(b.id),
			startDate: { date: b.date, time: b.time },
			pax: b.pax,
			status: b.status,
			availableTransitions: b.availableTransitions ?? [],
			customer: { firstName: b.firstName ?? '' }
		},
		restaurant: {
			name: r?.name ?? '',
			address: [r?.addressLine1, r?.city].filter(Boolean).join(', ')
		}
	};
};

async function transition(target: BookingStatus, params: Partial<Record<string, string>>) {
	const rid = Number(params.restaurantId);
	const numericId = Number(params.reservationId);
	if (!Number.isFinite(rid) || !Number.isFinite(numericId)) {
		return fail(400, { success: false as const, code: 'bad_request' });
	}

	const api = createWidgetApi(rid);

	// Pre-flight: pulls fresh status + transitions so we can short-circuit on
	// idempotent re-submits and surface a clear error when the booking has
	// moved into a state that no longer allows the requested transition.
	const current = await api.getBooking(numericId);
	if (!current.ok) {
		return fail(404, { success: false as const, code: 'not_found' });
	}

	const action = target === 'reconfirmed' ? 'confirm' : 'cancel';

	if (current.data.status === target) {
		return { success: true as const, action };
	}

	if (!current.data.availableTransitions?.includes(target)) {
		return fail(409, { success: false as const, code: 'transition_not_allowed' });
	}

	const result = await api.setBookingStatus(numericId, target);
	if (!result.ok) {
		return fail(409, {
			success: false as const,
			code: result.error.code ?? 'transition_failed',
			message: result.error.message
		});
	}

	return { success: true as const, action };
}

export const actions: Actions = {
	confirm: ({ params }) => transition('reconfirmed', params),
	cancel: ({ params }) => transition('canceled', params)
};
