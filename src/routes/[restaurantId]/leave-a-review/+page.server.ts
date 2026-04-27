import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const rating = url.searchParams.get('rating');
	const reservationId = url.searchParams.get('reservationId');

	const restaurant = locals.restaurant;

	let reservation = null;
	if (reservationId) {
		reservation = await locals.prisma.reservation.findUnique({
			where: { id: reservationId },
			select: {
				id: true,
				startDate: true,
				pax: true
			}
		});
	}

	return {
		restaurantName: restaurant?.name ?? '',
		rating: rating ? parseFloat(rating) : null,
		reservationId,
		reservation
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const rating = parseFloat(formData.get('rating') as string);
		const comment = (formData.get('comment') as string) || undefined;
		const reservationId = (formData.get('reservationId') as string) || undefined;

		if (!rating || rating < 1 || rating > 5) {
			return fail(400, { error: 'Note invalide' });
		}

		const reservation = reservationId
			? await locals.prisma.reservation.findUnique({
					where: { id: reservationId },
					select: {
						id: true,
						restaurantId: true,
						customerId: true,
						review: true
					}
				})
			: undefined;

		const data = {
			rating,
			comment: comment && comment.length > 0 ? comment : undefined
		};

		if (reservation?.review) {
			await locals.prisma.review.update({
				where: { id: reservation.review.id },
				data
			});
		} else {
			await locals.prisma.review.create({
				data: {
					...data,
					reservation: reservation
						? { connect: { id: reservation.id } }
						: undefined,
					restaurant: {
						connect: {
							id: locals.restaurant?.id ?? reservation?.restaurantId
						}
					},
					customer: reservation?.customerId
						? { connect: { id: reservation.customerId } }
						: undefined
				}
			});
		}

		if (reservation?.id) {
			await locals.logger.logReservationReviewed(reservation.id);
		}

		return { success: true };
	}
};
