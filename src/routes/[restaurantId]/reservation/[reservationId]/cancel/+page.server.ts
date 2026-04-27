import type { Actions } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Reservator } from 'shared';

export const load = async ({ locals, params, url }) => {
	const { reservationId } = params;

	let reservation;
	try {
		// Load reservation and validate cancellation deadline
		reservation = await locals.reservator.loadReservationToCancel(reservationId);
	} catch (err) {
		// If validation fails (deadline passed or cancellation disabled), show error
		error(403, err instanceof Error ? err.message : 'Cette réservation ne peut pas être annulée.');
	}

	if (!reservation) {
		error(404);
	}

	const restaurant = await locals.prisma.restaurant.findFirst({
		where: {
			id: reservation.restaurantId
		},
		select: {
			id: true,
			name: true
		}
	});

	if (!restaurant) {
		error(404);
	}

	const widget = await locals.prisma.widget.findFirst({
		where: {
			restaurantId: reservation.restaurantId
		},
		select: {
			id: true,
			name: true
		}
	});

	locals.tinybird?.ingest('cancel_reservation', {
		restaurantId: restaurant.id
	});

	return {
		reservation,
		restaurant,
		builder: url.searchParams.get('builder') === 'true',
		widget
	};
};

export const actions = {
	default: async ({ params, locals }) => {
		const { reservationId } = params;

		if (!reservationId) {
			error(500);
		}

		const reservation = await locals.prisma.reservation.findFirst({
			where: {
				id: reservationId
			},
			select: {
				id: true,
				restaurantId: true,
				serviceId: true,
				startDate: true,
				pax: true,
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

		// Pass customer name as actorName for widget cancellations
		await locals.reservator.cancelReservationWithPaymentIntentsAndSendEmail(
			reservation.id,
			'CANCELED',
			undefined,
			{
				firstName: reservation.customer?.firstName,
				lastName: reservation.customer?.lastName
			}
		);

		// updateServiceDayStats(locals.db, reservation.serviceId, reservation.startTime, {
		// 	isFull: false,
		// 	reservations: -1,
		// 	pax: reservation.pax * -1,
		// 	canceled: 1
		// });
	}
} satisfies Actions;
