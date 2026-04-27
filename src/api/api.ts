import type { LANGUAGE_CODE } from 'prisma-shared';
import { procedure } from 'svelte-rpc';
import { boolean, date, number, object, optional, string } from 'valibot';

type TranslationArray = {
	language: LANGUAGE_CODE;
	value: string;
}[];

export const router = {
	getServices: procedure()
		.input(object({ restaurantId: string(), date: date() }))
		.handle(async ({ input, event }) => {
			const services = await event.locals.reservator.getAvailableServicesWithExceptions(
				input.restaurantId,
				input.date
			);
			// Hide services where reservations are disabled (bookable: false)
			return services.filter((service) => service.bookable !== false);
		}),
	getServiceSlots: procedure()
		.input(object({ restaurantId: string(), serviceId: string(), pax: number(), date: date() }))
		.handle(async ({ input, event }) => {
			return event.locals.reservator.getServiceSlots({
				restaurantId: input.restaurantId,
				serviceId: input.serviceId,
				pax: input.pax,
				date: input.date,
				options: {
					includeTableCount: true,
					almostFullThreshold: 1
				}
			});
		}),
	book: procedure()
		.input(
			object({
				reservation: optional(
					object({
						id: optional(string()),
						restaurantId: string(),
						serviceId: string(),
						pax: number(),
						date: date(),
						notes: optional(string()),
						contact: object({
							firstName: optional(string()),
							lastName: string(),
							phone: string(),
							email: string()
						})
					})
				),
				paymentIntentId: optional(string()),
				joiningWaitlist: optional(boolean())
			})
		)
		.handle(async ({ input, event }) => {
			// Widget operations: Pass customer name as actorName to ensure it's displayed in history
			const actorName = input.reservation?.contact
				? {
						firstName: input.reservation.contact.firstName,
						lastName: input.reservation.contact.lastName
					}
				: undefined;

			return event.locals.reservator.book({
				reservation: input.reservation
					? {
							restaurantId: input.reservation.restaurantId,
							serviceId: input.reservation.serviceId,
							pax: input.reservation.pax,
							date: input.reservation.date,
							notes: input.reservation.notes,
							contact: input.reservation.contact,
							source: 'WIDGET'
						}
					: undefined,
				paymentIntentId: input.paymentIntentId,
				reservationIdToUpdate: input.reservation?.id,
				actorName,
				options: {
					bypassServiceRebooking: false,
					joiningWaitlist: input.joiningWaitlist
				}
			});
		}),
	loadReservation: procedure()
		.input(string())
		.handle(async ({ input, event }) => {
			return event.locals.reservator.loadReservationToUpdate(input);
		}),
	loadPaymentIntent: procedure()
		.input(string())
		.handle(async ({ input, event }) => {
			try {
				const stripePaymentIntent = await event.locals.reservator.loadStripePaymentIntent(
					input,
					event.locals.restaurant?.stripeAccountId ?? undefined
				);
				const metadata = event.locals.reservator.parsePaymentIntentMetadata(stripePaymentIntent);

				let reservation = metadata.reservationId
					? await event.locals.reservator.loadReservationToUpdate(metadata.reservationId)
					: undefined;

				if (!reservation) {
					reservation = {
						serviceId: metadata.serviceId,
						startDate: metadata.date,
						pax: metadata.pax,
						notes: metadata.notes,
						contact: {
							firstName: metadata.contactFirstName,
							lastName: metadata.contactLastName,
							phone: metadata.contactPhone,
							email: metadata.contactEmail
						}
					};
				}

				return {
					paymentIntent: stripePaymentIntent,
					reservation,
					stripeAccountId: event.locals.restaurant?.stripeAccountId ?? null
				};
			} catch (error) {
				console.error(error);
				return { error: 'Failed to load payment intent' };
			}
		}),
	getAlternativeRestaurant: procedure()
		.input(
			object({
				restaurantId: string(),
				date: date(),
				serviceId: string(),
				pax: number(),
				requestedTime: number() // milliseconds from midnight
			})
		)
		.handle(async ({ input, event }) => {
			const ONE_HOUR_MS = 3600000;
			const minTime = input.requestedTime - ONE_HOUR_MS;
			const maxTime = input.requestedTime + ONE_HOUR_MS;

			// Step 1: Get owner userIds for current restaurant
			const ownerships = await event.locals.prisma.membership.findMany({
				where: {
					restaurantId: input.restaurantId,
					role: 'OWNER'
				},
				select: {
					userId: true
				}
			});

			const ownerUserIds = ownerships.map((m) => m.userId);

			if (ownerUserIds.length === 0) {
				return { found: false as const };
			}

			// Step 2: Find alternative restaurants owned by the same user(s)
			const alternatives = await event.locals.prisma.membership.findMany({
				where: {
					userId: { in: ownerUserIds },
					role: 'OWNER',
					restaurant: {
						id: { not: input.restaurantId },
						deletedAt: null
					}
				},
				select: {
					restaurant: {
						select: {
							id: true,
							name: true,
							addressLine1: true,
							addressLine2: true,
							city: true,
							timezone: true,
							widgets: {
								take: 1,
								select: { id: true }
							}
						}
					}
				},
				distinct: ['restaurantId']
			});

			// Helper to get French translation or first available
			const getTranslationValue = (
				translations: { language: LANGUAGE_CODE; value: string | undefined }[]
			): string => {
				return translations.find((t) => t.language === 'FR')?.value || translations[0]?.value || '';
			};

			// Step 3: Check each alternative restaurant sequentially (exit on first match)
			for (const { restaurant } of alternatives) {
				// Skip restaurants without widgets
				if (!restaurant.widgets.length) {
					continue;
				}

				// Get services for this restaurant on the selected date
				const services = await event.locals.reservator.getAvailableServicesWithExceptions(
					restaurant.id,
					input.date
				);

				// Filter services whose time range overlaps with our ±1 hour window
				// Use <= and >= to include services that start/end exactly at window boundaries
				const overlappingServices = services.filter(
					(service) => service.startTime <= maxTime && service.endTime >= minTime
				);

				for (const service of overlappingServices) {
					// Check pax constraints
					if (input.pax < service.minPaxPerReservation || input.pax > service.maxPaxPerReservation) {
						continue;
					}

					// Get slots for this service
					const slots = await event.locals.reservator.getServiceSlots({
						restaurantId: restaurant.id,
						serviceId: service.id,
						pax: input.pax,
						date: input.date,
						options: {
							includeTableCount: true,
							almostFullThreshold: 1
						}
					});

					// Find first AVAILABLE or ALMOST_FULL slot within time window
					const validSlot = slots.find((slot) => {
						const slotTime = event.locals.reservator.zonedDateUtils.dateToTime(slot.date);
						return (
							slotTime >= minTime &&
							slotTime <= maxTime &&
							(slot.state === 'AVAILABLE' || slot.state === 'ALMOST_FULL')
						);
					});

					if (validSlot) {

						// Format address
						const addressParts = [restaurant.addressLine1, restaurant.addressLine2, restaurant.city].filter(
							Boolean
						);

						return {
							found: true as const,
							restaurant: {
								id: restaurant.id,
								name: restaurant.name,
								address: addressParts.join(', '),
								widgetId: restaurant.widgets[0].id
							},
							service: {
								id: service.id,
								name: getTranslationValue(service.name)
							},
							slot: {
								date: validSlot.date,
								state: validSlot.state as 'AVAILABLE' | 'ALMOST_FULL'
							}
						};
					}
				}
			}

			return { found: false as const };
		})
};

export type API = typeof router;
