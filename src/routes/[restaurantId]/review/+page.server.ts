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

	const api = createWidgetApi(rid);

	// PRD §6.3: redirect threshold + Google Maps URL come from the REST
	// aggregate (`.review.reviewRedirectThreshold`, `.review.reviewUrl`).
	const aggregate = await api.getAggregate();
	const restaurantName = aggregate.ok ? aggregate.data.restaurant.name : '';
	const reviewSettings = aggregate.ok ? aggregate.data.review : undefined;

	if (!rating) {
		if (arg) {
			try {
				await api.trackReviewArgVisit({ arg, linkClick: true });
			} catch {
				// tracking is best-effort — never block the rating-picker view
			}
		}
		return {
			restaurantName,
			reservation: null,
			reservationId,
			arg,
			thankYou: false
		};
	}

	const ratingNum = parseFloat(rating);
	const threshold = reviewSettings?.reviewRedirectThreshold ?? 5;
	const highRating = ratingNum >= 1 && ratingNum <= 5 && ratingNum >= threshold;

	if (arg) {
		try {
			await api.trackReviewArgVisit({
				arg,
				linkClick: true,
				externalRedirect: highRating && !!reviewSettings?.reviewUrl
			});
		} catch {
			// tracking is best-effort — never block the redirect
		}
	}

	if (highRating) {
		// Threshold-or-above ratings are never stored in our DB: reward the
		// customer (champagne flag + reward message) and send them to the
		// external review page. Best-effort: a reward failure must not break
		// the redirect UX.
		const numericReservationId = Number(reservationId);
		if (reservationId && Number.isFinite(numericReservationId)) {
			try {
				const rewardResult = await api.rewardReview({ bookingId: numericReservationId });
				if (!rewardResult.ok) {
					console.error('review reward failed before external redirect', rewardResult.error);
				}
			} catch (err) {
				console.error('review reward failed before external redirect', err);
			}
		}
		if (reviewSettings?.reviewUrl) {
			throw redirect(302, reviewSettings.reviewUrl);
		}
		// No external review URL configured — show an inline thank-you instead.
		return {
			restaurantName,
			reservation: null,
			reservationId,
			arg,
			thankYou: true
		};
	}

	const leaveReviewUrl = new URL(`/${params.restaurantId}/leave-a-review`, url.origin);
	leaveReviewUrl.searchParams.set('rating', rating);
	if (reservationId) leaveReviewUrl.searchParams.set('reservationId', reservationId);
	if (arg) leaveReviewUrl.searchParams.set('arg', arg);
	throw redirect(302, leaveReviewUrl.pathname + leaveReviewUrl.search);
};
