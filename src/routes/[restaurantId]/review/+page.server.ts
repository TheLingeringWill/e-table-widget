import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const rating = url.searchParams.get('rating');

	const restaurant = locals.restaurant;

	if (!rating) {
		return {
			restaurantName: restaurant?.name ?? '',
			reservation: null
		};
	}

	const ratingNum = parseFloat(rating);
	const threshold = restaurant?.reviewRedirectThreshold ?? 4;

	if (ratingNum >= threshold && restaurant?.googleMapsReviewUrl) {
		throw redirect(302, restaurant.googleMapsReviewUrl);
	}

	const leaveReviewUrl = new URL(`/${params.restaurantId}/leave-a-review`, url.origin);
	leaveReviewUrl.searchParams.set('rating', rating);
	throw redirect(302, leaveReviewUrl.pathname + leaveReviewUrl.search);
};
