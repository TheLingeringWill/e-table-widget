import {
	boolean,
	date,
	number,
	object,
	optional,
	picklist,
	string,
	type GenericSchema,
	type InferOutput
} from 'valibot';
import { createWidgetApi } from '$lib/server/api/widget-api';
import { bookingToLegacyReservation } from '$lib/server/api/adapters/booking';
import { shiftToLegacyService, type LiveDay } from '$lib/server/api/adapters/service';
import { formatDateForApi } from '$lib/server/api/adapters/datetime';
import { filterByPax, slotToLegacySlot } from '$lib/server/api/adapters/slot-state';
import { resolveBookingStatus } from '$lib/server/api/adapters/booking-status';
import { ApiReturnStatus } from '$lib/api-types';
import type { BookingStatus, CreateBookingRequestDTO } from '$lib/server/api/types';

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
	getServices: procedure(object({ restaurantId: string(), date: date() }), async ({ input }) => {
		// Source the per-date service tile list from /availabilities, not
		// /services. The API resolves service exceptions (overrides /
		// closures) at the shift level — see resolve_shifts_for_day in
		// api/src/domain/service/availability.rs — and emits one shift per
		// effective service for the date, with id = parent service id on
		// regular days or id = exception id on overridden days. Sourcing
		// the tile list from this same call keeps the BFF aligned with
		// what the user will see in the slots panel: when /availabilities
		// returns the override shift, the tile carries the override's id,
		// name, hours, and pax bounds, and the subsequent getServiceSlots
		// call (which filters by shift.id === selection.service.id) hits.
		const rid = Number(input.restaurantId);
		if (!Number.isFinite(rid)) {
			throw new Error(`getServices: invalid restaurant id ${input.restaurantId}`);
		}
		const day = formatDateForApi(input.date);
		const result = await createWidgetApi(rid).getAvailabilities({
			startDate: day,
			endDate: day
		});
		if (!result.ok) {
			throw new Error(`getServices: ${result.error.code} ${result.error.message}`);
		}
		const days = result.data.data as LiveDay[];
		const shifts = days.flatMap((d) => d.shifts);
		return shifts.filter((s) => s.bookable === true).map(shiftToLegacyService);
	}),
	getServiceSlots: procedure(
		object({ restaurantId: string(), serviceId: string(), pax: number(), date: date() }),
		async ({ input }) => {
			// REST replacement for `reservator.getServiceSlots`. The new endpoint
			// takes a date range with no pax filter — we send a single-day
			// range and filter client-side per PRD §6.2 ("the adapter filters
			// slots client-side by `slot.possibleGuests.includes(pax)`").
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
				throw new Error(`getServiceSlots: ${result.error.code} ${result.error.message}`);
			}
			// Filtering by `shift.id === selection.service.id` works because
			// getServices now sources the tile id from the same /availabilities
			// shifts — overrides flow through with their exception id intact.
			const targetServiceId = Number(input.serviceId);
			if (!Number.isFinite(targetServiceId)) {
				throw new Error(`getServiceSlots: invalid service id ${input.serviceId}`);
			}
			const days = result.data.data as LiveDay[];
			const flatSlots = days.flatMap((day) =>
				day.shifts
					.filter((shift) => shift.id === targetServiceId)
					.flatMap((shift) => shift.slots.map((slot) => ({ ...slot, date: day.date })))
			);
			return filterByPax(flatSlots, input.pax).map((s) => slotToLegacySlot(s, input.pax));
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
					date: object({ date: string(), time: string() }),
					notes: optional(string()),
					contact: object({
						civility: picklist(['mr', 'mrs', 'other']),
						countryCode: string(),
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
			// REST replacement for `reservator.book`. Call shapes from the widget UI:
			//   1. Initial submit (Booking.svelte): full reservation payload,
			//      no paymentIntentId. May return REQUIRES_PAYMENT_INTENT for
			//      services with deposits — Stripe Elements then mints/confirms
			//      a payment intent on the client.
			//   2. After Stripe confirm (Payment.svelte): full reservation
			//      payload PLUS paymentIntentId. The API verifies the intent
			//      is in `requires_capture` and persists the booking with
			//      status = Reconfirmed.
			const rid = input.reservation ? Number(input.reservation.restaurantId) : ridFromEvent(event);
			if (!Number.isFinite(rid)) {
				throw new Error('book: restaurant id missing');
			}

			if (!input.reservation) {
				throw new Error('book: missing reservation payload');
			}
			const r = input.reservation;

			const dateStr = r.date.date;
			const timeStr = r.date.time;
			const api = createWidgetApi(rid);

			// Resolve booking status from the live shift+slot at this date/time.
			// Lenient on lookup miss: a non-PI booking falls back to 'to_confirm'
			// (the API stays authoritative); a PI booking falls back to
			// 'confirmed'/'reconfirmed' because the widget only attaches a PI
			// after createPaymentIntent succeeds, which itself only happens when
			// capture is required — so PI presence is a reliable capture signal
			// even if the post-hoc availabilities lookup fails.
			const piFallback: BookingStatus = r.id ? 'reconfirmed' : 'confirmed';
			let resolvedStatus: BookingStatus = input.paymentIntentId ? piFallback : 'to_confirm';
			const availResult = await api.getAvailabilities({
				startDate: dateStr,
				endDate: dateStr
			});
			if (availResult.ok) {
				const days = availResult.data.data as LiveDay[];
				const shift = days.flatMap((d) => d.shifts).find((s) => s.id === Number(r.serviceId));
				const slot = shift?.slots.find((sl) => sl.time === timeStr);
				if (shift && slot) {
					resolvedStatus = resolveBookingStatus({
						shiftAutoConfirm: shift.autoConfirm ?? false,
						shiftAutoConfirmMaxPax: shift.autoConfirmMaxPax ?? null,
						shiftWaitlistEnabled: shift.waitlistEnabled,
						shiftCaptureEnabled: shift.captureEnabled ?? false,
						shiftForeignCaptureEnabled: shift.foreignCaptureEnabled ?? false,
						slot: {
							markedAsFull: slot.markedAsFull,
							slotPax: slot.slotPax,
							slotMaxPax: slot.slotMaxPax,
							waitlistEnabled: slot.waitlistEnabled,
							captureEnabled: slot.captureEnabled,
							foreignCaptureEnabled: slot.foreignCaptureEnabled
						},
						pax: r.pax,
						hasPaymentIntentId: !!input.paymentIntentId,
						hasReservationId: !!r.id
					});
				}
			}

			const body: CreateBookingRequestDTO = {
				pax: r.pax,
				status: resolvedStatus,
				date: dateStr,
				time: timeStr,
				source: 'web',
				note: r.notes ?? null,
				civility: r.contact.civility,
				countryCode: r.contact.countryCode,
				firstName: r.contact.firstName ?? null,
				lastName: r.contact.lastName,
				email: r.contact.email,
				phone: r.contact.phone,
				paymentIntentId: input.paymentIntentId ?? null
			};

			const result = r.id
				? await api.updateBooking(Number(r.id), body)
				: await api.createBooking(body);
			if (!result.ok) {
				if (result.error.code === 'customer_already_booked_service') {
					return { status: ApiReturnStatus.CUSTOMER_ALREADY_BOOKED_SERVICE };
				}
				return { status: 'ERROR', message: result.error.message };
			}

			return { status: ApiReturnStatus.OK, paymentIntent: null as null };
		}
	),
	createPaymentIntent: procedure(
		object({
			restaurantId: string(),
			date: object({ date: string(), time: string() }),
			pax: number(),
			countryCode: string()
		}),
		async ({ input }) => {
			const rid = Number(input.restaurantId);
			if (!Number.isFinite(rid)) {
				throw new Error(`createPaymentIntent: invalid restaurant id ${input.restaurantId}`);
			}
			const result = await createWidgetApi(rid).createPaymentIntent({
				idempotencyKey: crypto.randomUUID(),
				pax: input.pax,
				date: input.date.date,
				time: input.date.time,
				countryCode: input.countryCode
			});
			if (!result.ok) {
				// Per API contract: 409 means "no deposit required for this slot, or
				// restaurant not onboarded" — fall through to legacy book() path.
				// Any other error is a real failure that must not be masked, otherwise
				// a deposit-required slot silently slips into book() with no payment.
				if (result.error.code === 'http_409' || result.error.code === 'no_deposit_required') {
					return { ok: false as const, error: result.error };
				}
				throw new Error(`createPaymentIntent: ${result.error.code} ${result.error.message}`);
			}
			return {
				ok: true as const,
				paymentIntentId: result.data.paymentIntentId,
				clientSecret: result.data.clientSecret,
				amount: result.data.amountCents,
				stripeAccountId: result.data.stripeConnectAccountId
			};
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
	setBookingStatus: procedure(
		object({
			bookingId: string(),
			status: picklist([
				'to_confirm',
				'waiting_list',
				'confirmed',
				'reconfirmed',
				'canceled',
				'no_show',
				'arrived',
				'seated',
				'finished'
			])
		}),
		async ({ input, event }) => {
			// Standalone-payment finalization path. After Stripe authorizes the
			// pre-existing booking's payment intent, the widget calls this to
			// transition the booking into 'reconfirmed' (the booking already
			// exists in the API for standalone flows).
			const rid = ridFromEvent(event);
			if (!Number.isFinite(rid)) {
				throw new Error('setBookingStatus: restaurantId missing');
			}
			const numericId = Number(input.bookingId);
			if (!Number.isFinite(numericId)) {
				throw new Error(`setBookingStatus: invalid booking id ${input.bookingId}`);
			}
			const result = await createWidgetApi(rid).setBookingStatus(
				numericId,
				input.status as BookingStatus
			);
			if (!result.ok) {
				return { ok: false as const, error: result.error };
			}
			return { ok: true as const, status: result.data.status };
		}
	),
	loadPaymentIntent: procedure(string(), async ({ input, event }) => {
		// REST replacement for the legacy reservator-driven payment-intent
		// load. Hits the live PaymentIntent GET endpoint.
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
			requestedTime: string() // 'HH:MM'
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
						slot: { date: string; time: string; state: 'AVAILABLE' | 'ALMOST_FULL' };
				  };
		}
	)
};

export type API = typeof router;
