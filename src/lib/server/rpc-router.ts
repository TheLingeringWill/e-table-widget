import {
	boolean,
	number,
	object,
	optional,
	picklist,
	string,
	type GenericSchema,
	type InferOutput
} from 'valibot';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezoned from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezoned);
import type { CountryCode } from 'libphonenumber-js';
import { convertToE164 } from '$lib/utils/phone';
import { createWidgetApi } from '$lib/server/api/widget-api';
import { computeAvailableDates } from '$lib/server/api/availableDates';
import { bookingToLegacyReservation } from '$lib/server/api/adapters/booking';
import { shiftToLegacyService, type LiveDay } from '$lib/server/api/adapters/service';
import { experienceToLegacyExperience } from '$lib/server/api/adapters/experience';
import { filterByPax, slotToLegacySlot } from '$lib/server/api/adapters/slot-state';
import {
	resolveBookingStatus,
	wouldRequireConfirmation
} from '$lib/server/api/adapters/booking-status';
import { ApiReturnStatus } from '$lib/api-types';
import type { LegacyService, LegacySlot } from '$lib/api-types';
import type {
	BookingStatus,
	CreateBookingRequestDTO,
	UpdateBookingRequestDTO
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
	// Zenchef-style "all slots of the day" feed. Returns every bookable shift for
	// the date with its own slots, grouped by service, so the widget can render a
	// service-name header per group and let the user pick a time without first
	// picking a service — the chosen slot's owning service travels back in the
	// group. Replaces the old getServices + getServiceSlots pair: it is their
	// union minus the `shift.id === serviceId` filter, with per-shift grouping.
	// The shift id is the parent service id on regular days or the exception id on
	// overridden days (the API resolves overrides per-date in
	// resolve_shifts_for_day, api/src/domain/service/availability.rs), so the
	// group's service.id is exactly what `book` later filters on.
	getDaySlots: procedure(
		object({
			restaurantId: string(),
			pax: number(),
			date: string(),
			isModifying: optional(boolean())
		}),
		async ({ input }) => {
			const rid = Number(input.restaurantId);
			if (!Number.isFinite(rid)) {
				throw new Error(`getDaySlots: invalid restaurant id ${input.restaurantId}`);
			}
			const day = input.date;
			const result = await createWidgetApi(rid).getAvailabilities({
				startDate: day,
				endDate: day
			});
			if (!result.ok) {
				throw new Error(`getDaySlots: ${result.error.code} ${result.error.message}`);
			}
			const days = result.data.data as LiveDay[];

			const groups: Array<{ service: LegacyService; slots: LegacySlot[] }> = [];
			for (const d of days) {
				for (const shift of d.shifts) {
					if (shift.bookable !== true) continue;
					let raw = shift.slots.map((slot) => ({ ...slot, date: d.date }));
					if (input.isModifying) {
						raw = raw.filter(
							(slot) =>
								!wouldRequireConfirmation({
									shiftAutoConfirm: shift.autoConfirm ?? false,
									shiftAutoConfirmMaxPax: shift.autoConfirmMaxPax ?? null,
									shiftCaptureEnabled: shift.captureEnabled ?? false,
									shiftForeignCaptureEnabled: shift.foreignCaptureEnabled ?? false,
									slot: {
										captureEnabled: slot.captureEnabled ?? null,
										foreignCaptureEnabled: slot.foreignCaptureEnabled ?? null
									},
									pax: input.pax
								})
						);
					}
					const slots = filterByPax(raw, input.pax).map((s) => slotToLegacySlot(s, input.pax));
					// Omit a shift that yields no slots after pax filtering, so the UI
					// never renders a service header with no times under it (Zenchef
					// drops empty groups). Past-slot pruning stays client-side
					// (timezone/now-dependent) in Selection.svelte.
					if (slots.length > 0) {
						groups.push({ service: shiftToLegacyService(shift), slots });
					}
				}
			}
			return groups;
		}
	),
	getExperiences: procedure(
		object({ restaurantId: string(), serviceId: string(), isStandard: boolean(), date: string() }),
		async ({ input }) => {
			// Fetch all the restaurant's experiences and keep the active ones that
			// are offered on the booking date (inclusive range) and target the
			// chosen availability shift — or every shift (null target), mapped to
			// the legacy widget shape. `isStandard` disambiguates the colliding
			// service / service-exception id spaces (the shift tile carries it).
			const rid = Number(input.restaurantId);
			if (!Number.isFinite(rid)) {
				throw new Error(`getExperiences: invalid restaurant id ${input.restaurantId}`);
			}
			const result = await createWidgetApi(rid).getExperiences();
			if (!result.ok) {
				throw new Error(`getExperiences: ${result.error.code} ${result.error.message}`);
			}
			return result.data
				.filter((e) => {
					if (!e.active) return false;
					// Lexicographic compare is safe on zero-padded ISO dates.
					if (input.date < e.startDate || input.date > e.endDate) return false;
					if (e.targetServiceId == null) return true; // targets every shift
					return (
						e.targetIsStandard === input.isStandard && String(e.targetServiceId) === input.serviceId
					);
				})
				.map(experienceToLegacyExperience);
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
					// Required only on the update path. The API derives seating_time
					// from service rules on create; on update it must be sent back
					// as-is (or with the new desired duration). The widget sources it
					// from getBooking via loadReservation.
					seatingTime: optional(number()),
					date: object({ date: string(), time: string() }),
					notes: optional(string()),
					contact: object({
						civility: picklist(['mr', 'mrs', 'other']),
						countryCode: string(),
						firstName: string(),
						lastName: string(),
						phone: string(),
						email: string()
					})
				})
			),
			paymentIntentId: optional(string()),
			setupIntentId: optional(string()),
			experienceId: optional(string()),
			joiningWaitlist: optional(boolean()),
			// Customer's chosen locale, sent explicitly by Booking.svelte. Drives
			// confirmation-email localization on the API. Authoritative over the
			// `event.locals.locale` fallback (unreliable in a third-party iframe).
			language: optional(string())
		}),
		async ({ input, event }) => {
			// REST replacement for `reservator.book`. Call shapes from the widget UI:
			//   1. Initial submit (Booking.svelte): full reservation payload,
			//      no paymentIntentId/setupIntentId. May return REQUIRES_PAYMENT_INTENT
			//      for services with deposits — Stripe Elements then mints/confirms
			//      a setup intent on the client.
			//   2. After Stripe confirm (Payment.svelte): full reservation
			//      payload PLUS setupIntentId (saved-card model) — the API verifies
			//      the SetupIntent succeeded and persists the booking. The legacy
			//      paymentIntentId path (manual hold, `requires_capture`) is still
			//      accepted for backward compatibility.
			const rid = input.reservation ? Number(input.reservation.restaurantId) : ridFromEvent(event);
			if (!Number.isFinite(rid)) {
				throw new Error('book: restaurant id missing');
			}

			if (!input.reservation) {
				throw new Error('book: missing reservation payload');
			}
			const r = input.reservation;

			// BFF is the chokepoint for E.164: client-side conversion in Contact.svelte
			// falls through to the raw input when parsing fails (and a future non-widget
			// caller may not convert at all), so normalize here using the contact's
			// countryCode. convertToE164 itself falls through on parse failure, so
			// malformed input still reaches the API as-is (the API rejects it).
			const normalizedPhone = convertToE164(r.contact.phone, r.contact.countryCode as CountryCode);

			const dateStr = r.date.date;
			const timeStr = r.date.time;
			const api = createWidgetApi(rid);

			const existingBooking = r.id ? await api.getBooking(Number(r.id)) : null;
			const existingHasAuthorizedPI =
				!!existingBooking?.ok && existingBooking.data.paymentStatus === 'requires_capture';

			// A saved-card SetupIntent guarantees the booking the same way a
			// captured PaymentIntent hold does, so treat either as "has payment".
			const hasPayment = !!input.paymentIntentId || !!input.setupIntentId;
			const piFallback: BookingStatus = 'confirmed';
			let resolvedStatus: BookingStatus =
				hasPayment || existingHasAuthorizedPI
					? piFallback
					: input.joiningWaitlist
						? 'waiting_list'
						: 'to_confirm';
			let slotHasCapture = false;
			const availResult = await api.getAvailabilities({
				startDate: dateStr,
				endDate: dateStr
			});
			if (availResult.ok) {
				const days = availResult.data.data as LiveDay[];
				const shift = days.flatMap((d) => d.shifts).find((s) => s.id === Number(r.serviceId));
				const slot = shift?.slots.find((sl) => sl.time === timeStr);
				if (shift && slot) {
					const captureEnabled = slot.captureEnabled ?? shift.captureEnabled ?? false;
					const foreignCaptureEnabled =
						slot.foreignCaptureEnabled ?? shift.foreignCaptureEnabled ?? false;
					slotHasCapture = !!(captureEnabled || foreignCaptureEnabled);
					resolvedStatus = resolveBookingStatus({
						shiftAutoConfirm: shift.autoConfirm ?? false,
						shiftAutoConfirmMaxPax: shift.autoConfirmMaxPax ?? null,
						shiftWaitlistEnabled: shift.waitlistEnabled,
						shiftMarkedAsFull: shift.markedAsFull ?? false,
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
						hasPaymentIntentId: hasPayment || existingHasAuthorizedPI,
						joiningWaitlist: input.joiningWaitlist ?? false
					});
				}
			}

			if (
				r.id &&
				(resolvedStatus === 'waiting_list' || (resolvedStatus === 'to_confirm' && !slotHasCapture))
			) {
				return { status: ApiReturnStatus.MODIFICATION_NOT_ALLOWED, message: null };
			}

			const result = r.id
				? await api.updateBooking(Number(r.id), {
						pax: r.pax,
						date: dateStr,
						time: timeStr,
						seatingTime: r.seatingTime ?? 0,
						source: existingBooking?.ok ? existingBooking.data.source : 'web',
						status: resolvedStatus,
						paymentIntentId: input.paymentIntentId ?? null,
						// Forward the saved-card SetupIntent on edits too — the create
						// path already does. Without this, modifying a booking into a
						// deposit-required slot confirms the card in Stripe but never
						// links it to the booking, so the app never sees the saved card.
						setupIntentId: input.setupIntentId ?? null,
						customerSheetId: existingBooking?.ok
							? (existingBooking.data.customerSheetId ?? null)
							: null,
						comment:
							r.notes || (existingBooking?.ok ? (existingBooking.data.comment ?? null) : null),
						civility: r.contact.civility,
						language: input.language ?? event.locals.locale ?? null,
						countryCode: r.contact.countryCode,
						firstName: r.contact.firstName ?? null,
						lastName: r.contact.lastName,
						email: r.contact.email,
						phone: normalizedPhone
					} satisfies UpdateBookingRequestDTO)
				: await api.createBooking(
						{
							pax: r.pax,
							status: resolvedStatus,
							date: dateStr,
							time: timeStr,
							source: 'web',
							comment: r.notes ?? null,
							civility: r.contact.civility,
							language: input.language ?? event.locals.locale,
							countryCode: r.contact.countryCode,
							firstName: r.contact.firstName,
							lastName: r.contact.lastName,
							email: r.contact.email,
							phone: normalizedPhone,
							paymentIntentId: input.paymentIntentId ?? null,
							setupIntentId: input.setupIntentId ?? null,
							experienceId: input.experienceId ? Number(input.experienceId) : null
						} satisfies CreateBookingRequestDTO,
						{ force: resolvedStatus === 'waiting_list' || resolvedStatus === 'to_confirm' }
					);
			if (!result.ok) {
				if (result.error.code === 'customer_already_booked_service') {
					return { status: ApiReturnStatus.CUSTOMER_ALREADY_BOOKED_SERVICE };
				}
				return { status: 'ERROR', message: result.error.message };
			}

			const finalBookingStatus: BookingStatus =
				(result.data?.status as BookingStatus | undefined) ?? resolvedStatus;
			return {
				status: ApiReturnStatus.OK,
				paymentIntent: null as null,
				bookingStatus: finalBookingStatus,
				bookingId: result.data?.id != null ? String(result.data.id) : null
			};
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
	createSetupIntent: procedure(
		object({
			restaurantId: string(),
			date: object({ date: string(), time: string() }),
			pax: number(),
			countryCode: string()
		}),
		async ({ input }) => {
			const rid = Number(input.restaurantId);
			if (!Number.isFinite(rid)) {
				throw new Error(`createSetupIntent: invalid restaurant id ${input.restaurantId}`);
			}
			const result = await createWidgetApi(rid).createSetupIntent({
				pax: input.pax,
				date: input.date.date,
				time: input.date.time,
				countryCode: input.countryCode
			});
			if (!result.ok) {
				// Per API contract: 409 means "no deposit required for this slot, or
				// restaurant not onboarded" — fall through to legacy book() path.
				// Any other error is a real failure that must not be masked, otherwise
				// a deposit-required slot silently slips into book() with no saved card.
				if (result.error.code === 'http_409' || result.error.code === 'no_deposit_required') {
					return { ok: false as const, error: result.error };
				}
				throw new Error(`createSetupIntent: ${result.error.code} ${result.error.message}`);
			}
			return {
				ok: true as const,
				setupIntentId: result.data.setupIntentId,
				clientSecret: result.data.clientSecret,
				amount: result.data.amountCents,
				stripeAccountId: result.data.stripeConnectAccountId
			};
		}
	),
	createExperienceSetupIntent: procedure(
		object({
			restaurantId: string(),
			experienceId: string(),
			pax: number()
		}),
		async ({ input }) => {
			// Price-driven SetupIntent for a `save_card` experience: the held
			// amount is the experience price × pax, mirroring the slot capture
			// policy's per-guest scaling. Same response shape as createSetupIntent
			// so Payment.svelte's confirmCardSetup path is unchanged. A 409 means
			// the experience does not require a saved card.
			const rid = Number(input.restaurantId);
			if (!Number.isFinite(rid)) {
				throw new Error(`createExperienceSetupIntent: invalid restaurant id ${input.restaurantId}`);
			}
			const result = await createWidgetApi(rid).createExperienceSetupIntent({
				experienceId: Number(input.experienceId),
				pax: input.pax
			});
			if (!result.ok) {
				if (result.error.code === 'http_409' || result.error.code === 'no_deposit_required') {
					return { ok: false as const, error: result.error };
				}
				throw new Error(
					`createExperienceSetupIntent: ${result.error.code} ${result.error.message}`
				);
			}
			return {
				ok: true as const,
				setupIntentId: result.data.setupIntentId,
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
				'to_reconfirm',
				'waiting_list',
				'confirmed',
				'reconfirmed',
				'canceled',
				'no_show',
				'arrived',
				'seated',
				'ended'
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
	confirmSavedCard: procedure(
		object({ bookingId: string(), setupIntentId: string() }),
		async ({ input, event }) => {
			// Standalone saved-card finalization path. After Stripe confirms the
			// pre-existing booking's SetupIntent client-side, the widget calls this
			// to have the API verify the SetupIntent succeeded, mark the booking
			// `card_saved`, and transition it to `reconfirmed`. Replaces the
			// standalone flow's old bare setBookingStatus(reconfirmed) call.
			const rid = ridFromEvent(event);
			if (!Number.isFinite(rid)) {
				throw new Error('confirmSavedCard: restaurantId missing');
			}
			const numericId = Number(input.bookingId);
			if (!Number.isFinite(numericId)) {
				throw new Error(`confirmSavedCard: invalid booking id ${input.bookingId}`);
			}
			const result = await createWidgetApi(rid).confirmSavedCard(numericId, input.setupIntentId);
			if (!result.ok) {
				return { ok: false as const, error: result.error };
			}
			return { ok: true as const, status: result.data.status };
		}
	),
	loadSetupIntent: procedure(string(), async ({ input, event }) => {
		// REST replacement for loadPaymentIntent in the saved-card model. Hits the
		// live SetupIntent GET endpoint. The GET response now carries `bookingId`
		// (resolved from the SetupIntent's `booking_id` metadata, set for
		// staff-initiated setups), which the standalone confirm-saved-card path
		// needs. We don't fetch the full booking here (`reservation` stays
		// undefined) — the standalone page summary is populated from the route's
		// own load — but we surface `bookingId` so the confirm RPC can finalize.
		try {
			const rid = ridFromEvent(event);
			if (!Number.isFinite(rid)) {
				throw new Error('loadSetupIntent: restaurantId missing');
			}
			const api = createWidgetApi(rid);
			const siResult = await api.getSetupIntent(input);
			if (!siResult.ok) {
				throw new Error(`loadSetupIntent: ${siResult.error.code} ${siResult.error.message}`);
			}
			const si = siResult.data;

			// Reshape the BFF setup-intent record into the legacy Stripe-style
			// payload Widget.svelte still consumes
			// (`paymentIntent.{id, client_secret, amount, status}`).
			const stripeSetupIntent = {
				id: input,
				client_secret: si.clientSecret,
				amount: si.amountCents,
				status: si.status
			};

			return {
				setupIntent: stripeSetupIntent,
				reservation: undefined as ReturnType<typeof bookingToLegacyReservation> | undefined,
				bookingId: si.bookingId ?? null,
				stripeAccountId: si.stripeConnectAccountId ?? null
			};
		} catch (error) {
			console.error(error);
			return { error: 'Failed to load setup intent' };
		}
	}),
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
	getWidgetAlternatives: procedure(object({ restaurantId: string() }), async ({ input, event }) => {
		// Owner-curated sibling restaurants, shown at the bottom of the slot
		// step when no slot is available. The API resolves the curated ids in
		// stored order, filtered to same-group + live, and returns `[]` when
		// the toggle is off or the restaurant is ungrouped. Any error degrades
		// to an empty list — the no-slot UX must never break on this.
		const rid = Number(input.restaurantId) || ridFromEvent(event);
		if (!Number.isFinite(rid)) return [];
		const result = await createWidgetApi(rid).getWidgetAlternatives();
		return result.ok ? result.data.restaurants : [];
	}),
	getAvailableDates: procedure(
		object({ restaurantId: string(), startDate: string(), endDate: string(), timezone: string() }),
		async ({ input }) => {
			const rid = Number(input.restaurantId);
			if (!Number.isFinite(rid)) {
				throw new Error(`getAvailableDates: invalid restaurant id ${input.restaurantId}`);
			}
			const result = await createWidgetApi(rid).getAvailabilities({
				startDate: input.startDate,
				endDate: input.endDate
			});
			if (!result.ok) {
				throw new Error(`getAvailableDates: ${result.error.code} ${result.error.message}`);
			}
			// Same reduction the SSR preload uses (computeAvailableDates) so the
			// client fallback and the preloaded dates can never disagree.
			return computeAvailableDates(result.data.data as LiveDay[], input.timezone);
		}
	)
};

export type API = typeof router;
