import { error } from '@sveltejs/kit';

export const load = async ({ locals, params, url }) => {
	const { reservationId } = params;

	const reservation = await locals.prisma.reservation.findFirst({
		where: {
			id: reservationId,
			restaurantId: params.restaurantId,
			endDate: {
				gt: new Date()
			}
		},
		select: {
			id: true,
			restaurantId: true,
			startDate: true,
			pax: true,
			status: true,
			restaurant: {
				select: {
					name: true
				}
			},
			customer: {
				select: {
					firstName: true,
					lastName: true
				}
			}
		}
	});

	if (!reservation) {
		error(404);
	}

	if (reservation.status === 'TO_RECONFIRM') {
		await locals.prisma.reservation.update({
			where: {
				id: reservation.id
			},
			data: {
				status: 'RECONFIRMED'
			}
		});

		// Log the reconfirmation with customer name as actor
		await locals.logger.logReservationStatusChange(
			reservation.id,
			'RESERVATION_RECONFIRMED',
			'RECONFIRMED',
			{
				firstName: reservation.customer?.firstName,
				lastName: reservation.customer?.lastName
			}
		);
	}
	return {
		reservation
	};
};
