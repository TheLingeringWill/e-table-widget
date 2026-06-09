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
			arg
		};
	}

	const ratingNum = parseFloat(rating);
	const threshold = reviewSettings?.reviewRedirectThreshold ?? 4;
	const externalBranch = ratingNum >= threshold && !!reviewSettings?.reviewUrl;

	if (arg) {
		try {
			await api.trackReviewArgVisit({
				arg,
				linkClick: true,
				externalRedirect: externalBranch
			});
		} catch {
			// tracking is best-effort — never block the redirect
		}
	}

	if (externalBranch) {
		// The external redirect skips the leave-a-review form, so the review
		// (and the reward email the API sends on upsert) must be recorded here.
		// Best-effort: a recording failure must not break the redirect UX.
		if (ratingNum >= 1 && ratingNum <= 5) {
			const numericReservationId = Number(reservationId);
			const bookingId =
				reservationId && Number.isFinite(numericReservationId) ? numericReservationId : null;
			try {
				const upsertResult = await api.upsertReview({
					rating: ratingNum,
					bookingId,
					comment: null,
					arg
				});
				if (!upsertResult.ok) {
					console.error('review upsert failed before external redirect', upsertResult.error);
				}
			} catch (err) {
				console.error('review upsert failed before external redirect', err);
			}
		}
		throw redirect(302, reviewSettings!.reviewUrl!);
	}

	const leaveReviewUrl = new URL(`/${params.restaurantId}/leave-a-review`, url.origin);
	leaveReviewUrl.searchParams.set('rating', rating);
	if (reservationId) leaveReviewUrl.searchParams.set('reservationId', reservationId);
	if (arg) leaveReviewUrl.searchParams.set('arg', arg);
	throw redirect(302, leaveReviewUrl.pathname + leaveReviewUrl.search);
};
