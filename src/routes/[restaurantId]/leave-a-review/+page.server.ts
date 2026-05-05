import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createWidgetApi } from '$lib/server/api/widget-api';

export const load: PageServerLoad = async ({ params, url }) => {
	const rating = url.searchParams.get('rating');
	const reservationId = url.searchParams.get('reservationId');
	const rid = Number(params.restaurantId);
	if (!Number.isFinite(rid)) {
		return {
			restaurantName: '',
			rating: rating ? parseFloat(rating) : null,
			reservationId,
			reservation: null
		};
	}

	const api = createWidgetApi(rid);
	const aggregate = await api.getAggregate();
	const restaurantName = aggregate.ok ? aggregate.data.restaurant.name : '';

	let reservation = null;
	const numericId = Number(reservationId);
	if (Number.isFinite(numericId)) {
		const result = await api.getBooking(numericId);
		if (result.ok) {
			reservation = {
				id: String(result.data.id),
				startDate: { date: result.data.date, time: result.data.time },
				pax: result.data.pax
			};
		}
	}

	return {
		restaurantName,
		rating: rating ? parseFloat(rating) : null,
		reservationId,
		reservation
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();
		const rating = parseFloat(formData.get('rating') as string);
		const comment = (formData.get('comment') as string) || undefined;
		const reservationId = (formData.get('reservationId') as string) || undefined;

		if (!rating || rating < 1 || rating > 5) {
			return fail(400, { error: 'Note invalide' });
		}
		const rid = Number(params.restaurantId);
		if (!Number.isFinite(rid)) {
			return fail(400, { error: 'Restaurant introuvable' });
		}

		// PRD §6.6: `POST /restaurants/{rid}/reviews/upsert` is idempotent
		// — no need to look up an existing review or to wire customerId
		// from a separate Prisma read; the API resolves the customer
		// from the booking server-side.
		const numericBookingId = reservationId ? Number(reservationId) : NaN;
		const upsertResult = await createWidgetApi(rid).upsertReview({
			rating,
			bookingId: Number.isFinite(numericBookingId) ? numericBookingId : null,
			comment: comment && comment.length > 0 ? comment : null
		});
		if (!upsertResult.ok) {
			return fail(500, { error: upsertResult.error.message });
		}

		// Logger plumbing dropped — the API records the audit event
		// server-side when the upsert lands.

		return { success: true };
	}
};
