// Server-only. Types mirroring the REST API DTOs the widget consumes.
// Sourced from the OpenAPI spec at https://jonathan-api-local.e-table.co/api-docs/openapi.json
// Refresh whenever the adapter touches a new field (see PRD §8 risk row 4).

export type BookingStatus =
	| 'to_confirm'
	| 'confirmed'
	| 'reconfirmed'
	| 'canceled'
	| 'no_show'
	| 'requires_payment_intent'
	| 'arrived'
	| 'seated'
	| 'finished';

export type BookingSource =
	| 'web'
	| 'messenger'
	| 'thefork'
	| 'api'
	| 'phone'
	| 'walk_in'
	| 'other';

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
	status: 'connected' | 'pending' | 'disconnected';
	accountIdLast4?: string | null;
}

export interface MessagingResponseDTO {
	[k: string]: unknown;
}

export interface ReviewSettingsResponseDTO {
	reviewRedirectThreshold: number;
	reviewUrl?: string | null;
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
	captureEnabled?: boolean;
	captureAmountPerPax?: number | null;
}

export interface SlotAvailabilityResponseDTO {
	date: string;
	time: string;
	closed: boolean;
	markedAsFull: boolean;
	possibleGuests: number[];
	slotPax: number;
	slotMaxPax: number;
	servicePax: number;
	serviceMaxPax: number;
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
	status: BookingStatus;
	source: BookingSource;
	notes?: string | null;
	customerFirstName?: string | null;
	customerLastName?: string | null;
	customerEmail?: string | null;
	customerPhone?: string | null;
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
	notes?: string | null;
	customerFirstName?: string | null;
	customerLastName?: string | null;
	customerEmail?: string | null;
	customerPhone?: string | null;
	paymentIntentId?: string | null;
}

export interface CreateBookingResponseDTO extends BookingDetailResponseDTO {
	// When the API supports it (PRD §9.2), this carries the Stripe client_secret.
	// Until then, the BFF mock at src/lib/server/api/mocks/payment-intent.ts synthesizes one.
	paymentIntentClientSecret?: string | null;
}

export interface UpdateStatusRequestDTO {
	status: BookingStatus;
}

export interface UpsertReviewRequestDTO {
	rating: number;
	bookingId?: number | null;
	customerSheetId?: number | null;
	comment?: string | null;
}

export interface PaymentIntentResponseDTO {
	clientSecret: string;
	amountCents: number;
	bookingId: number;
	status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
}

export type ApiErrorResult = {
	error: { code: string; message: string };
};
