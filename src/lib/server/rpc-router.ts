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
import { formatDateForApi, formatTimeForApi } from '$lib/server/api/adapters/datetime';
import { filterByPax, slotToLegacySlot } from '$lib/server/api/adapters/slot-state';
import {
	getMockMode,
	synthesizePaymentIntent
} from '$lib/server/api/mocks/payment-intent';
import { ApiReturnStatus } from '$lib/api-types';
import type {
	BookingStatus,
	CreateBookingRequestDTO,
	CreateBookingResponseDTO
} from '$lib/server/api/types';

// PRD §7 Phase 4: the rpc dispatcher runs at /api/<method> so it has no
// :restaurantId path param. The browser client sets `X-RESTO` (see
// widget-rpc-client.ts) carrying `params.restaurantId` from the page store,
// and we read it back here. The previous path went through createLocals →
// event.locals.restaurantId; that plumbing is gone with the shared package.
function ridFromEvent(event: import('@sveltejs/kit').RequestEvent): number {
	const header = event.request.headers.get('x-resto');
	const fromHeader = header ? Number(header) : NaN;
	if (Number.isFinite(fromHeader)) return fromHeader;
	const fromParam = event.params.restaurantId ? Number(event.params.restaurantId) : NaN;
	return fromParam;
}

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
			// Live response shape: { services, restaurantExceptions }.
			// Hide services where reservations are disabled (bookable: false).
			const services = result.data.services ?? [];
			return services
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
			// Live response: { data: [{ date, shifts: [{ id, slots: [...] }] }] }
			// Flatten to a [{ date, time, ...slot }] list; the slot adapter
			// keys off `date` + `time` to build a JS Date in restaurant tz.
			// `serviceId` from the input is unused — Selection.svelte filters
			// rendering off the slot list it gets back, and the eventual
			// SvelteKit loader will scope properly when the BFF surface
			// gains a service-aware availabilities endpoint.
			type LiveSlot = {
				id: number;
				time: string;
				closed: boolean;
				markedAsFull: boolean;
				slotPax: number;
				slotMaxPax: number;
				servicePax: number;
				serviceMaxPax: number;
				possibleGuests: number[];
			};
			type LiveShift = { id: number; slots: LiveSlot[] };
			type LiveDay = { date: string; shifts: LiveShift[] };
			const days = (result.data.data ?? []) as LiveDay[];
			const targetServiceId = Number(input.serviceId);
			const flatSlots = days.flatMap((day) =>
				day.shifts
					.filter(
						(shift) =>
							!Number.isFinite(targetServiceId) || shift.id === targetServiceId
					)
					.flatMap((shift) =>
						shift.slots.map((slot) => ({ ...slot, date: day.date }))
					)
			);
			return filterByPax(flatSlots, input.pax).map((s) =>
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
			// REST replacement for `reservator.book`. Two call shapes from the
			// widget UI today (PRD §6.5):
			//   1. Initial submit (Booking.svelte): full reservation payload,
			//      no paymentIntentId. May return REQUIRES_PAYMENT_INTENT for
			//      services with deposits — Stripe Elements then mints/confirms
			//      a payment intent on the client and the procedure is called
			//      again with `paymentIntentId` only.
			//   2. Confirmation after Stripe success (Payment.svelte):
			//      paymentIntentId only, expects status: OK.
			//
			// The §9.2 payment-intent surface (a)/(b)/(c) is not yet on the live
			// API (PRD §9.2 "Mocking requirement"). When WIDGET_PAYMENT_MOCK_MODE
			// is set, the BFF synthesizes a client_secret here and the
			// `getPaymentIntent` mock keeps a record so the standalone payment
			// route works end-to-end. When the API ships §9.2 (a), the
			// `paymentIntentClientSecret` field on CreateBookingResponseDTO
			// supplants the synthesis path; deleting the mock module is the
			// only follow-up change.
			const rid = input.reservation
				? Number(input.reservation.restaurantId)
				: ridFromEvent(event);
			if (!Number.isFinite(rid)) {
				throw new Error('book: restaurant id missing');
			}

			// Confirmation-after-Stripe call shape: only paymentIntentId carried.
			// PRD §9.2 (c) is still open — until the API ships either a
			// `paymentIntentId` field on CreateBookingRequestDTO or a dedicated
			// `POST /bookings/{id}/confirm-payment` endpoint, we trust the BFF
			// mock to have already flipped the booking's payment status when
			// Stripe Elements confirmed. The widget gets back a synthesized OK.
			if (input.paymentIntentId && !input.reservation) {
				return {
					status: ApiReturnStatus.OK,
					paymentIntent: null as null
				};
			}

			if (!input.reservation) {
				throw new Error('book: missing reservation payload and paymentIntentId');
			}
			const r = input.reservation;

			// REST API source enum still lacks 'widget' (PRD §9.5 — open).
			// Send 'web' until the enum gains the value.
			const body: CreateBookingRequestDTO = {
				pax: r.pax,
				status: 'to_confirm' satisfies BookingStatus,
				date: formatDateForApi(r.date),
				time: formatTimeForApi(r.date),
				source: 'web',
				note: r.notes ?? null,
				firstName: r.contact.firstName ?? null,
				lastName: r.contact.lastName,
				email: r.contact.email,
				phone: r.contact.phone
			};

			const api = createWidgetApi(rid);
			const result = r.id
				? await api.updateBooking(Number(r.id), body)
				: await api.createBooking(body);
			if (!result.ok) {
				if (result.error.code === 'customer_already_booked_service') {
					return { status: ApiReturnStatus.CUSTOMER_ALREADY_BOOKED_SERVICE };
				}
				return { status: 'ERROR', message: result.error.message };
			}

			const booking = result.data as CreateBookingResponseDTO;
			if (booking.status === 'requires_payment_intent') {
				// Pull the client_secret either from the API (PRD §9.2 (a) when
				// shipped) or from the BFF mock under WIDGET_PAYMENT_MOCK_MODE.
				let clientSecret: string | undefined =
					(booking as { paymentIntentClientSecret?: string | null })
						.paymentIntentClientSecret ?? undefined;
				let stripePaymentIntentId: string | undefined =
					booking.stripePaymentIntentId ?? undefined;
				const amountCents = booking.paymentAmountCents ?? 0;
				if (!clientSecret && getMockMode() !== 'off') {
					const minted = synthesizePaymentIntent(booking.id, amountCents);
					clientSecret = minted.clientSecret;
					stripePaymentIntentId = minted.stripePaymentIntentId;
				}
				// PRD §6.4 risk row 3: stripeAccountId is no longer exposed by the
				// REST API. The payment intent is minted server-side, so Stripe
				// Elements only needs PUBLIC_STRIPE_KEY + the intent's clientSecret.
				return {
					status: ApiReturnStatus.REQUIRES_PAYMENT_INTENT,
					paymentIntent: {
						id: stripePaymentIntentId,
						clientSecret,
						amount: amountCents,
						stripeAccountId: null as string | null
					}
				};
			}
			return { status: ApiReturnStatus.OK, paymentIntent: null as null };
		}
	),
	loadReservation: procedure(string(), async ({ input, event }) => {
		// REST replacement for the legacy `reservator.loadReservationToUpdate`.
		// The booking id is numeric in the new schema (PRD §10.1: rid=1).
		// Restaurant scoping is derived from the URL (X-RESTO header that the
		// browser client sets, surfaced as event.params.restaurantId by the
		// route — but the rpc dispatcher runs at /api/<method> with no
		// :restaurantId in the path, so we read X-RESTO directly).
		const numericId = Number(input);
		if (!Number.isFinite(numericId)) {
			throw new Error(`loadReservation: invalid booking id ${input}`);
		}
		const rid = ridFromEvent(event);
		if (!Number.isFinite(rid)) {
			throw new Error('loadReservation: restaurantId missing');
		}
		const result = await createWidgetApi(rid).getBooking(numericId);
		if (!result.ok) {
			throw new Error(`loadReservation: ${result.error.code} ${result.error.message}`);
		}
		return bookingToLegacyReservation(result.data);
	}),
	loadPaymentIntent: procedure(string(), async ({ input, event }) => {
		// REST replacement for the legacy reservator-driven payment-intent
		// load. Per PRD §9.2 the live API does not yet expose
		// `GET /restaurants/{rid}/payment-intents/{id}` or surface a
		// `client_secret` on bookings — the BFF mock under
		// src/lib/server/api/mocks/payment-intent.ts intercepts the
		// adapter call when `WIDGET_PAYMENT_MOCK_MODE` is set. When the
		// API ships §9.2 (a)/(b)/(c), the mock module is deleted and
		// this procedure body is unaffected.
		try {
			const rid = ridFromEvent(event);
			if (!Number.isFinite(rid)) {
				throw new Error('loadPaymentIntent: restaurantId missing');
			}
			const api = createWidgetApi(rid);
			const piResult = await api.getPaymentIntent(input);
			if (!piResult.ok) {
				throw new Error(`loadPaymentIntent: ${piResult.error.code} ${piResult.error.message}`);
			}
			const pi = piResult.data;

			const bookingResult = await api.getBooking(pi.bookingId);
			const reservation = bookingResult.ok
				? bookingToLegacyReservation(bookingResult.data)
				: undefined;

			// Reshape the BFF payment-intent record into the legacy Stripe-style
			// payload Widget.svelte still consumes
			// (`paymentIntent.{id, client_secret, amount, status}`).
			const stripePaymentIntent = {
				id: input,
				client_secret: pi.clientSecret,
				amount: pi.amountCents,
				status: pi.status
			};

			return {
				paymentIntent: stripePaymentIntent,
				reservation,
				// PRD §6.4 risk row 3: stripeAccountId no longer flows from the API.
				stripeAccountId: null as string | null
			};
		} catch (error) {
			console.error(error);
			return { error: 'Failed to load payment intent' };
		}
	}),
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
