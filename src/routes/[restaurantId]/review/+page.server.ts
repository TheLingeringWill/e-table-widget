import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createWidgetApi } from '$lib/server/api/widget-api';

export const load: PageServerLoad = async ({ params, url }) => {
	const rid = Number(params.restaurantId);
	if (!Number.isFinite(rid)) {
		error(404);
	}

	const rating = url.searchParams.get('rating');
	const reservationId = url.searchParams.get('reservationId');
	const arg = url.searchParams.get('arg');

	// PRD §6.3: redirect threshold + Google Maps URL come from the REST
	// aggregate (`.review.reviewRedirectThreshold`, `.review.reviewUrl`).
	const aggregate = await createWidgetApi(rid).getAggregate();
	const restaurantName = aggregate.ok ? aggregate.data.restaurant.name : '';
	const reviewSettings = aggregate.ok ? aggregate.data.review : undefined;

	if (!rating) {
		return {
			restaurantName,
			reservation: null,
			reservationId,
			arg
		};
	}

	const ratingNum = parseFloat(rating);
	const threshold = reviewSettings?.reviewRedirectThreshold ?? 4;

	if (ratingNum >= threshold && reviewSettings?.reviewUrl) {
		throw redirect(302, reviewSettings.reviewUrl);
	}

	const leaveReviewUrl = new URL(`/${params.restaurantId}/leave-a-review`, url.origin);
	leaveReviewUrl.searchParams.set('rating', rating);
	if (reservationId) leaveReviewUrl.searchParams.set('reservationId', reservationId);
	if (arg) leaveReviewUrl.searchParams.set('arg', arg);
	throw redirect(302, leaveReviewUrl.pathname + leaveReviewUrl.search);
};
