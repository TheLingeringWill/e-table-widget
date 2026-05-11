// Canonical types for the REST API DTOs the widget consumes — safe for both
// client and server modules. The server adapter at lib/server/api/types.ts
// re-exports from here so its file presence still satisfies §0.4 item e.
//
// Sourced from https://jonathan-api-local.e-table.co/api-docs/openapi.json.
// Refresh whenever the adapter touches a new field (see PRD §8 risk row 4).

export type BookingStatus =
	| 'to_confirm'
	| 'waiting_list'
	| 'confirmed'
	| 'reconfirmed'
	| 'canceled'
	| 'no_show'
	| 'requires_payment_intent'
	| 'arrived'
	| 'seated'
	| 'finished';

export type BookingSource = 'web' | 'messenger' | 'thefork' | 'api' | 'phone' | 'walk_in' | 'other';

export type BookingCivility = 'mr' | 'mrs' | 'other';

export type SlotSemanticState = 'AVAILABLE' | 'ALMOST_FULL' | 'FULL' | 'CLOSED';

export interface RestaurantResponseDTO {
	id: number;
	name: string;
	timezone: string;
	addressLine1?: string | null;
	addressLine2?: string | null;
	city?: string | null;
}

export interface PaymentResponseDTO {
	status: 'connected' | 'pending' | 'not_connected';
	accountIdLast4?: string | null;
}

export interface MessagingResponseDTO {
	[k: string]: unknown;
}

export interface ReviewSettingsResponseDTO {
	reviewRedirectThreshold: number;
	reviewUrl?: string | null;
}

export interface TrackReviewArgVisitRequestDTO {
	arg: string;
	linkClick?: boolean;
	externalRedirect?: boolean;
	formSubmit?: boolean;
}

export interface WidgetResponseDTO {
	id: number;
	restaurantId: number;
	title: string;
	color: string;
	gtmEnabled: boolean;
	createdAt: string;
	updatedAt: string;
	description?: string | null;
	gtmId?: string | null;
}

export interface RestaurantAggregateResponseDTO {
	restaurant: RestaurantResponseDTO;
	payment: PaymentResponseDTO;
	messaging: MessagingResponseDTO;
	review: ReviewSettingsResponseDTO;
	widget: WidgetResponseDTO;
}

export interface ServiceResponseDTO {
	id: number;
	name: string;
	description?: string | null;
	startTime: string;
	endTime: string;
	minPaxPerReservation: number;
	maxPaxPerReservation: number;
	bookable: boolean;
	waitlistEnabled: boolean;
	captureEnabled?: boolean;
	captureAmountPerPax?: number | null;
	captureThreshold?: number | null;
	foreignCaptureEnabled?: boolean;
	foreignCaptureAmountPerPax?: number | null;
}

export interface SlotAvailabilityResponseDTO {
	date: string;
	time: string;
	closed: boolean;
	markedAsFull: boolean;
	waitlistEnabled?: boolean;
	possibleGuests: number[];
	slotPax: number;
	slotMaxPax: number;
	servicePax: number;
	serviceMaxPax: number;
	captureEnabled?: boolean | null;
	captureAmountPerPax?: number | null;
	captureThreshold?: number | null;
	foreignCaptureEnabled?: boolean | null;
	foreignCaptureAmountPerPax?: number | null;
}

export interface BookingShiftSlotResponseDTO {
	slotId: number;
	shift: { id: number; name: string; startTime: string; endTime: string };
}

export interface BookingDetailResponseDTO {
	id: number;
	restaurantId: number;
	pax: number;
	date: string;
	time: string;
	seatingTime: number;
	status: BookingStatus;
	source: BookingSource;
	note?: string | null;
	comment?: string | null;
	civility?: BookingCivility | null;
	countryCode?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	phone?: string | null;
	availableTransitions: BookingStatus[];
	shiftSlot?: BookingShiftSlotResponseDTO | null;
	stripePaymentIntentId?: string | null;
	paymentStatus?: string | null;
	paymentAmountCents?: number | null;
	paymentCapturedAt?: string | null;
}

export interface CreateBookingRequestDTO {
	pax: number;
	status: BookingStatus;
	date: string;
	time: string;
	source: BookingSource;
	note?: string | null;
	comment?: string | null;
	civility?: BookingCivility | null;
	countryCode?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	phone?: string | null;
	paymentIntentId?: string | null;
}

export interface CreateBookingResponseDTO extends BookingDetailResponseDTO {
	paymentIntentClientSecret?: string | null;
	stripeConnectAccountId?: string | null;
}

// PUT /restaurants/{id}/bookings/{id} has a tighter shape than POST: it requires
// `seatingTime` (the API derives it from service rules on create but not on
// update) and rejects `status` / `paymentIntentId` (use PATCH /status for state
// transitions, and the standalone-payment route for deposit finalization).
export interface UpdateBookingRequestDTO {
	pax: number;
	date: string;
	time: string;
	seatingTime: number;
	source: BookingSource;
	note?: string | null;
	comment?: string | null;
	civility?: BookingCivility | null;
	countryCode?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	phone?: string | null;
}

export interface UpdateStatusRequestDTO {
	status: BookingStatus;
}

export interface UpsertReviewRequestDTO {
	rating: number;
	bookingId?: number | null;
	customerSheetId?: number | null;
	comment?: string | null;
	arg?: string | null;
}

export interface PaymentIntentResponseDTO {
	clientSecret: string;
	amountCents: number;
	bookingId: number;
	status:
		| 'requires_payment_method'
		| 'requires_confirmation'
		| 'requires_action'
		| 'requires_capture'
		| 'succeeded'
		| 'canceled';
	stripeConnectAccountId?: string | null;
}

export interface CreatePaymentIntentRequestDTO {
	idempotencyKey: string;
	pax: number;
	date: string;
	time: string;
	countryCode: string;
}

export interface CreatePaymentIntentResponseDTO {
	paymentIntentId: string;
	clientSecret: string;
	amountCents: number;
	stripeConnectAccountId: string;
}

export type ApiErrorResult = {
	error: { code: string; message: string };
};

// Legacy ApiReturnStatus enum used by the booking step machine. The new REST
// API surfaces these distinctions either via `BookingStatus` (e.g.
// `requires_payment_intent`) or via structured error codes (PRD §9.6, still
// open). Until those land, Booking.svelte continues to compare against this
// enum; the values match the legacy RPC's status field exactly.
export const ApiReturnStatus = {
	OK: 'OK',
	RESERVATION_DATE_MISMATCH_SERVICE_TIME: 'RESERVATION_DATE_MISMATCH_SERVICE_TIME',
	CUSTOMER_ALREADY_BOOKED_SERVICE: 'CUSTOMER_ALREADY_BOOKED_SERVICE',
	REQUIRES_PAYMENT_INTENT: 'REQUIRES_PAYMENT_INTENT'
} as const;

// UI-facing slot type with the derived semantic state attached. The adapter
// (lib/server/api/adapters/slot-state.ts) computes `state` and ships this shape
// to the client via the BFF.
export interface UiSlot extends SlotAvailabilityResponseDTO {
	state: SlotSemanticState;
}

// UI-facing service type — alias of the DTO until/unless the adapter starts
// adding derived fields.
export type UiService = ServiceResponseDTO;

// -----------------------------------------------------------------------------
// Legacy in-flight types (delete in Phase 4 once Widget.svelte and friends move
// off the RPC return shapes). These mirror what InferApiTypes<API> resolved to
// before the migration: services carry translated name arrays, slots are JS
// Date objects with the extended state vocabulary that includes 'OPEN'.
// They exist solely so files like src/lib/states/{selection,waitlist}.svelte.ts
// can stop importing `InferApiTypes` from `svelte-rpc` while the runtime call
// sites remain on the legacy RPC path.
// -----------------------------------------------------------------------------

export type LegacySlotState = 'AVAILABLE' | 'ALMOST_FULL' | 'FULL' | 'CLOSED' | 'OPEN';

export type LegacyTranslationArray = {
	id: string;
	language: string;
	value: string;
	entity_id: string;
}[];

export interface LegacyService {
	id: string;
	bookable?: boolean;
	waitlistEnabled?: boolean;
	name: LegacyTranslationArray;
	description?: LegacyTranslationArray;
	startTime: number;
	endTime: number;
	minPaxPerReservation: number;
	maxPaxPerReservation: number;
	[k: string]: unknown;
}

// A REST timestamp pair in the restaurant's local clock, mirroring the
// SlotAvailabilityResponseDTO / BookingDetailResponseDTO `date` + `time`
// fields directly. Carried as strings end-to-end so display and submission
// can never drift from the restaurant clock no matter what timezone the
// browser is in.
export type SlotTimestamp = { date: string; time: string };

export interface LegacySlot {
	date: string; // 'YYYY-MM-DD' in restaurant local clock
	time: string; // 'HH:MM' in restaurant local clock
	pax: number;
	state: LegacySlotState;
	waitlistEnabled?: boolean;
	possibleGuests?: number[];
	[k: string]: unknown;
}
