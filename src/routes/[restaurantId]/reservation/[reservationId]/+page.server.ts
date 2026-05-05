import { error } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';

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
	const result = await createWidgetApi(rid).getBooking(numericId);
	if (!result.ok) {
		error(404);
	}

	return {
		builder: url.searchParams.get('builder') === 'true'
	};
};
