// Canonical types for the REST API DTOs the widget consumes — safe for both
// client and server modules. The server adapter at lib/server/api/types.ts
// re-exports from here so its file presence still satisfies §0.4 item e.
//
// Sourced from https://jonathan-api-local.e-table.co/api-docs/openapi.json.
// Refresh whenever the adapter touches a new field (see PRD §8 risk row 4).

// Mirrors the API's domain BookingStatus enum (api/src/domain/model/booking.rs).
// Note: the end-of-visit state is `ended` (not `finished`), and `to_reconfirm`
// is a distinct status the API emits — both must be present or status-driven
// branches silently miss those bookings.
export type BookingStatus =
	| 'to_confirm'
	| 'to_reconfirm'
	| 'waiting_list'
	| 'confirmed'
	| 'reconfirmed'
	| 'canceled'
	| 'no_show'
	| 'requires_payment_intent'
	| 'arrived'
	| 'seated'
	| 'ended';

export type BookingSource = 'web' | 'messenger' | 'thefork' | 'api' | 'phone' | 'walk_in' | 'other';

export type BookingCivility = 'mr' | 'mrs' | 'other';

export type SlotSemanticState = 'AVAILABLE' | 'ALMOST_FULL' | 'FULL' | 'CLOSED';

export interface RestaurantResponseDTO {
	id: number;
	name: string;
	timezone: string;
	address: string;
	city: string;
	zipCode?: string | null;
	countryCode: string;
	phone: string;
	email: string;
	websiteUrl?: string | null;
	description?: string | null;
	logoUrl?: string | null;
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

export interface WidgetTranslationResponseDTO {
	id: number;
	language: string;
	description: string;
	createdAt: string;
	updatedAt: string;
}

export interface WidgetResponseDTO {
	id: number;
	restaurantId: number;
	title: string;
	color: string;
	gtmEnabled: boolean;
	alternativeRestaurantsEnabled: boolean;
	alternativeRestaurantIds: number[];
	createdAt: string;
	updatedAt: string;
	translations: WidgetTranslationResponseDTO[];
	gtmId?: string | null;
}

// Owner-curated sibling restaurant rendered on the no-slot path. `widgetLink`
// is the absolute URL of the sibling's own booking widget.
export interface WidgetAlternativeRestaurantResponseDTO {
	id: number;
	name: string;
	city: string;
	widgetLink: string;
	logoUrl?: string | null;
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

export type LeadTimeReferenceDTO = 'service' | 'booking';

export interface BookingShiftResponseDTO {
	id: number;
	name: string;
	startTime: string;
	endTime: string;
	cancellable: boolean;
	cancellableBefore: number;
	cancellableBeforeReference: LeadTimeReferenceDTO;
	updatable: boolean;
	updatableBefore: number;
	updatableWithPayment: boolean;
}

export interface BookingShiftSlotResponseDTO {
	slotId: number;
	shift: BookingShiftResponseDTO;
}

export interface BookingDetailResponseDTO {
	id: number;
	restaurantId: number;
	customerSheetId?: number | null;
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
	stripeSetupIntentId?: string | null;
	paymentStatus?: string | null;
	paymentAmountCents?: number | null;
	paymentCapturedAt?: string | null;
	cancelLate: boolean;
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
	language?: string | null;
	countryCode?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	phone?: string | null;
	paymentIntentId?: string | null;
	setupIntentId?: string | null;
	experienceId?: number | null;
}

export interface CreateBookingResponseDTO extends BookingDetailResponseDTO {
	paymentIntentClientSecret?: string | null;
	stripeConnectAccountId?: string | null;
}

export interface UpdateBookingRequestDTO {
	pax: number;
	date: string;
	time: string;
	seatingTime: number;
	source: BookingSource;
	status?: BookingStatus;
	paymentIntentId?: string | null;
	// Saved-card deposit on modify: the `SetupIntent` (`seti_…`) the widget
	// confirmed client-side when the guest moved an existing booking into a
	// deposit-required slot. The API verifies it succeeded and persists
	// `stripeSetupIntentId` — without this the saved card never reaches the booking.
	setupIntentId?: string | null;
	customerSheetId?: number | null;
	note?: string | null;
	comment?: string | null;
	civility?: BookingCivility | null;
	language?: string | null;
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

export interface RewardReviewRequestDTO {
	bookingId: number;
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

// Saved-card (SetupIntent) model — the migration's replacement for the manual
// PaymentIntent hold. A SetupIntent saves the guest's card without holding
// funds; the card is charged later only on no-show / late cancel. The presence
// of `setupIntentId` on a booking is the discriminator for the saved-card model
// (vs. the legacy `stripePaymentIntentId` hold). Mirrors the PaymentIntent DTOs.
export interface CreateSetupIntentRequestDTO {
	pax: number;
	date: string;
	time: string;
	countryCode?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
}

export interface CreateSetupIntentResponseDTO {
	setupIntentId: string;
	clientSecret: string;
	amountCents: number;
	stripeConnectAccountId: string;
}

// Experience-driven SetupIntent: amount is the experience price × pax (per
// guest, like the slot capture policy) instead of the slot deposit policy.
// Same response shape as the slot path.
export interface CreateSetupIntentForExperienceRequestDTO {
	experienceId: number;
	pax: number;
	email?: string;
	firstName?: string;
	lastName?: string;
}

export interface SetupIntentResponseDTO {
	id: string;
	clientSecret: string;
	amountCents: number;
	status: string;
	// Populated from the SetupIntent's `booking_id` metadata, set for
	// staff-initiated setups (the booking exists before the card is saved). On the
	// standalone save-card link (`{origin}/{rid}/pay/{seti_...}`) the GET response
	// carries the owning bookingId so the confirm-saved-card RPC can finalize it.
	bookingId?: number;
	stripeConnectAccountId?: string;
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
	REQUIRES_PAYMENT_INTENT: 'REQUIRES_PAYMENT_INTENT',
	MODIFICATION_NOT_ALLOWED: 'MODIFICATION_NOT_ALLOWED'
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
	// Whether the shift is a regular service (true) or a service-exception
	// override (false). Service and exception ids come from separate
	// sequences, so the discriminator must travel with the id.
	isStandard?: boolean;
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

// REST `ExperienceResponseDTO` — an offer that optionally targets one
// availability shift: a service (targetIsStandard true) or a service
// exception (false), with the field omitted entirely when the experience
// applies to every shift. startDate/endDate (inclusive) bound when it is
// offered. `name`/`note` arrive per-language; the BFF resolves them to
// translation arrays before the UI sees them (mirrors how shifts become
// LegacyService).
export interface ExperienceResponseDTO {
	id: number;
	targetServiceId?: number;
	targetIsStandard: boolean;
	imageUrl?: string | null;
	priceCents: number;
	paymentOption: 'none' | 'save_card';
	active: boolean;
	startDate: string;
	endDate: string;
	translations: { language: string; name: string; note?: string | null }[];
}

// Widget-state shape for an experience tile (string id, translation-array
// name/note), mirroring LegacyService. The target fields are written by the
// adapter but never read by the UI — the BFF already filtered by shift/date.
export interface LegacyExperience {
	id: string;
	targetServiceId?: string;
	targetIsStandard?: boolean;
	imageUrl?: string;
	priceCents: number;
	paymentOption: 'none' | 'save_card';
	name: LegacyTranslationArray;
	note?: LegacyTranslationArray;
	[k: string]: unknown;
}

// A REST timestamp pair in the restaurant's local clock, mirroring the
// SlotAvailabilityResponseDTO / BookingDetailResponseDTO `date` + `time`
// fields directly. Carried as strings end-to-end so display and submission
// can never drift from the restaurant clock no matter what timezone the
// browser is in.
export type SlotTimestamp = { date: string; time: string };

export const TERMINAL_BOOKING_STATUSES: ReadonlySet<BookingStatus> = new Set([
	'arrived',
	'seated',
	'ended',
	'no_show',
	'canceled'
]);

export function isTerminalBookingStatus(status: BookingStatus): boolean {
	return TERMINAL_BOOKING_STATUSES.has(status);
}

export interface LegacySlot {
	date: string; // 'YYYY-MM-DD' in restaurant local clock
	time: string; // 'HH:MM' in restaurant local clock
	pax: number;
	state: LegacySlotState;
	waitlistEnabled?: boolean;
	possibleGuests?: number[];
	[k: string]: unknown;
}
