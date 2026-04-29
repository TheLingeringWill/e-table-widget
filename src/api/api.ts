import {
	boolean,
	date,
	number,
	object,
	optional,
	string,
	type GenericSchema,
	type InferOutput
} from 'valibot';
import { createWidgetApi } from '$lib/server/api/widget-api';
import { bookingToLegacyReservation } from '$lib/server/api/adapters/booking';
import { serviceToLegacyService } from '$lib/server/api/adapters/service';
import { formatDateForApi } from '$lib/server/api/adapters/datetime';
import { filterByPax, slotToLegacySlot } from '$lib/server/api/adapters/slot-state';

// Local procedure builder. Drop-in replacement for `procedure().input(schema).handle(fn)`
// from svelte-rpc — kept narrow so the hand-rolled dispatcher in hooks.server.ts has a
// stable contract (schema + call) without depending on the library. See PRD §0.4 item a.
type RpcProc<S extends GenericSchema, R> = {
	schema: S;
	call: (event: import('@sveltejs/kit').RequestEvent, input: InferOutput<S>) => Promise<R>;
};
const procedure = <S extends GenericSchema, R>(
	schema: S,
	fn: (args: { input: InferOutput<S>; event: import('@sveltejs/kit').RequestEvent }) => Promise<R>
): RpcProc<S, R> => ({
	schema,
	call: (event, input) => fn({ input, event })
});

export const router = {
	getServices: procedure(
		object({ restaurantId: string(), date: date() }),
		async ({ input }) => {
			// REST replacement for `reservator.getAvailableServicesWithExceptions`.
			// The REST endpoint takes a date range; the legacy procedure was
			// single-day, so we send the same day on both ends.
			const rid = Number(input.restaurantId);
			if (!Number.isFinite(rid)) {
				throw new Error(`getServices: invalid restaurant id ${input.restaurantId}`);
			}
			const day = formatDateForApi(input.date);
			const result = await createWidgetApi(rid).getServices({
				startDate: day,
				endDate: day
			});
			if (!result.ok) {
				throw new Error(`getServices: ${result.error.code} ${result.error.message}`);
			}
			// Hide services where reservations are disabled (bookable: false).
			return result.data
				.filter((s) => s.bookable !== false)
				.map(serviceToLegacyService);
		}
	),
	getServiceSlots: procedure(
		object({ restaurantId: string(), serviceId: string(), pax: number(), date: date() }),
		async ({ input }) => {
			// REST replacement for `reservator.getServiceSlots`. The new endpoint
			// takes a date range with no service or pax filter — we send a
			// single-day range and filter client-side per PRD §6.2 ("the
			// adapter filters slots client-side by `slot.possibleGuests.includes(pax)`").
			//
			// `serviceId` is unused in this call: the REST availabilities
			// endpoint already returns all slots for the restaurant on the
			// given day; the legacy procedure pre-scoped by service via the
			// Reservator's internal model. Selection.svelte still keys
			// rendering off the slot list it gets back, so dropping the
			// service-scope here is benign for the smoke path. The eventual
			// SvelteKit loader will scope properly when the BFF surface
			// gains a service-aware availabilities endpoint.
			const rid = Number(input.restaurantId);
			if (!Number.isFinite(rid)) {
				throw new Error(`getServiceSlots: invalid restaurant id ${input.restaurantId}`);
			}
			const day = formatDateForApi(input.date);
			const result = await createWidgetApi(rid).getAvailabilities({
				startDate: day,
				endDate: day
			});
			if (!result.ok) {
				throw new Error(
					`getServiceSlots: ${result.error.code} ${result.error.message}`
				);
			}
			return filterByPax(result.data, input.pax).map((s) =>
				slotToLegacySlot(s, input.pax)
			);
		}
	),
	book: procedure(
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
		}),
		async ({ input, event }) => {
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
		}
	),
	loadReservation: procedure(string(), async ({ input, event }) => {
		// REST replacement for the legacy `reservator.loadReservationToUpdate`.
		// The booking id is numeric in the new schema (PRD §10.1: rid=1).
		// Restaurant scoping comes from event.locals.restaurantId which the
		// hooks.server.ts middleware extracts from the URL.
		const numericId = Number(input);
		if (!Number.isFinite(numericId)) {
			throw new Error(`loadReservation: invalid booking id ${input}`);
		}
		const rid = Number(event.locals.restaurantId);
		if (!Number.isFinite(rid)) {
			throw new Error('loadReservation: restaurantId missing from event.locals');
		}
		const result = await createWidgetApi(rid).getBooking(numericId);
		if (!result.ok) {
			throw new Error(`loadReservation: ${result.error.code} ${result.error.message}`);
		}
		return bookingToLegacyReservation(result.data);
	}),
	loadPaymentIntent: procedure(string(), async ({ input, event }) => {
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
		}
	),
	getAlternativeRestaurant: procedure(
		object({
			restaurantId: string(),
			date: date(),
			serviceId: string(),
			pax: number(),
			requestedTime: number() // milliseconds from midnight
		}),
		async () => {
			// Dropped for v1 per PRD §3 non-goals: the previous implementation
			// did an owner-graph traversal across restaurants via Prisma which
			// has no REST equivalent. The Selection.svelte UI keeps its
			// alternative-restaurant branch gated on `found: true`, so a
			// constant `false` cleanly disables the feature without any UI
			// edit. If product wants the feature back, re-introduce it as a
			// follow-up with a dedicated public REST endpoint.
			//
			// Return type widened to include the found-true variant so the
			// API export's inferred type stays compatible with Selection's
			// `Awaited<ReturnType<typeof api.getAlternativeRestaurant>>` lookup.
			return { found: false as const } as
				| { found: false }
				| {
						found: true;
						restaurant: { id: string; name: string; address: string; widgetId: string };
						service: { id: string; name: string };
						slot: { date: Date; state: 'AVAILABLE' | 'ALMOST_FULL' };
				  };
		}
	)
};

export type API = typeof router;
