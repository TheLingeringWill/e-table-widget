import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const rating = url.searchParams.get('rating');

	const restaurant = locals.restaurant;

	if (!rating) {
		const reservation = params.reservationId
			? await locals.prisma.reservation.findUnique({
					where: { id: params.reservationId },
					select: {
						id: true,
						startDate: true,
						pax: true
					}
				})
			: null;

		return {
			restaurantName: restaurant?.name ?? '',
			reservation
		};
	}

	const ratingNum = parseFloat(rating);
	const threshold = restaurant?.reviewRedirectThreshold ?? 4;

	if (ratingNum >= threshold && restaurant?.googleMapsReviewUrl) {
		throw redirect(302, restaurant.googleMapsReviewUrl);
	}

	const leaveReviewUrl = new URL(`/${params.restaurantId}/leave-a-review`, url.origin);
	leaveReviewUrl.searchParams.set('rating', rating);
	if (params.reservationId) {
		leaveReviewUrl.searchParams.set('reservationId', params.reservationId);
	}
	throw redirect(302, leaveReviewUrl.pathname + leaveReviewUrl.search);
};
