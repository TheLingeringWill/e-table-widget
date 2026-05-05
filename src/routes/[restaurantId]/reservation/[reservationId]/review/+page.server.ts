import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createWidgetApi } from '$lib/server/api/widget-api';

export const load: PageServerLoad = async ({ params, url }) => {
	const rating = url.searchParams.get('rating');
	const rid = Number(params.restaurantId);
	if (!Number.isFinite(rid)) {
		throw redirect(302, '/');
	}

	const api = createWidgetApi(rid);
	const aggregate = await api.getAggregate();
	const restaurantName = aggregate.ok ? aggregate.data.restaurant.name : '';
	const threshold = aggregate.ok ? aggregate.data.review.reviewRedirectThreshold : 4;
	const reviewUrl = aggregate.ok ? aggregate.data.review.reviewUrl : null;

	if (!rating) {
		// Fetch the booking by id to render its summary on the page. Per
		// PRD §6.6, the route is gated by `availableTransitions` only at
		// the cancel/reconfirm level — the review page just renders.
		const numericId = Number(params.reservationId);
		const reservationResult = Number.isFinite(numericId) ? await api.getBooking(numericId) : null;
		const reservation =
			reservationResult && reservationResult.ok
				? {
						id: String(reservationResult.data.id),
						startDate: { date: reservationResult.data.date, time: reservationResult.data.time },
						pax: reservationResult.data.pax
					}
				: null;

		return {
			restaurantName,
			reservation
		};
	}

	const ratingNum = parseFloat(rating);
	if (ratingNum >= threshold && reviewUrl) {
		throw redirect(302, reviewUrl);
	}

	const leaveReviewUrl = new URL(`/${params.restaurantId}/leave-a-review`, url.origin);
	leaveReviewUrl.searchParams.set('rating', rating);
	if (params.reservationId) {
		leaveReviewUrl.searchParams.set('reservationId', params.reservationId);
	}
	throw redirect(302, leaveReviewUrl.pathname + leaveReviewUrl.search);
};
