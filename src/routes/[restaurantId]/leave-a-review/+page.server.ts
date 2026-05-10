import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createWidgetApi } from '$lib/server/api/widget-api';

export const load: PageServerLoad = async ({ params, url }) => {
	const rating = url.searchParams.get('rating');
	const reservationId = url.searchParams.get('reservationId');
	const arg = url.searchParams.get('arg');
	const rid = Number(params.restaurantId);
	if (!Number.isFinite(rid)) {
		return {
			restaurantName: '',
			rating: rating ? parseFloat(rating) : null,
			reservationId,
			arg,
			reservation: null
		};
	}

	const api = createWidgetApi(rid);
	const aggregate = await api.getAggregate();
	const restaurantName = aggregate.ok ? aggregate.data.restaurant.name : '';

	let reservation: { id: string; startDate: { date: string; time: string }; pax: number } | null =
		null;
	if (reservationId) {
		const numericReservationId = Number(reservationId);
		if (Number.isFinite(numericReservationId)) {
			const reservationResult = await api.getBooking(numericReservationId);
			if (reservationResult.ok) {
				reservation = {
					id: String(reservationResult.data.id),
					startDate: {
						date: reservationResult.data.date,
						time: reservationResult.data.time
					},
					pax: reservationResult.data.pax
				};
			}
		}
	}

	return {
		restaurantName,
		rating: rating ? parseFloat(rating) : null,
		reservationId,
		arg,
		reservation
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();
		const rating = parseFloat(formData.get('rating') as string);
		const comment = (formData.get('comment') as string) || undefined;
		const reservationIdRaw = formData.get('reservationId') as string | null;
		const arg = (formData.get('arg') as string) || null;

		if (!rating || rating < 1 || rating > 5) {
			return fail(400, { error: 'Note invalide' });
		}
		const rid = Number(params.restaurantId);
		if (!Number.isFinite(rid)) {
			return fail(400, { error: 'Restaurant introuvable' });
		}

		let bookingId: number | null = null;
		if (reservationIdRaw) {
			const numericReservationId = Number(reservationIdRaw);
			if (!Number.isFinite(numericReservationId)) {
				return fail(400, { error: 'Réservation introuvable' });
			}
			bookingId = numericReservationId;
		}

		const upsertResult = await createWidgetApi(rid).upsertReview({
			rating,
			bookingId,
			comment: comment && comment.length > 0 ? comment : null,
			arg
		});
		if (!upsertResult.ok) {
			return fail(500, { error: upsertResult.error.message });
		}

		return { success: true };
	}
};
