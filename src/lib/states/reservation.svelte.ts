import type { BookingStatus, SlotTimestamp } from '$lib/api-types';

export const reservation: {
	id: string | undefined;
	serviceId: string | undefined;
	startDate: SlotTimestamp | undefined;
	pax: number | undefined;
	seatingTime: number | undefined;
	notes: string | undefined;
	confirmedStatus: BookingStatus | undefined;
	paymentStatus: string | undefined;
	// Present when the booking already has a saved-card SetupIntent. Locks pax
	// on modify, mirroring the legacy `requires_capture` hold.
	stripeSetupIntentId: string | undefined;
} = $state({
	id: undefined,
	serviceId: undefined,
	startDate: undefined,
	pax: undefined,
	seatingTime: undefined,
	notes: undefined,
	confirmedStatus: undefined,
	paymentStatus: undefined,
	stripeSetupIntentId: undefined
});

export const resetReservation = () => {
	reservation.id = undefined;
	reservation.serviceId = undefined;
	reservation.startDate = undefined;
	reservation.pax = undefined;
	reservation.seatingTime = undefined;
	reservation.notes = undefined;
	reservation.confirmedStatus = undefined;
	reservation.paymentStatus = undefined;
	reservation.stripeSetupIntentId = undefined;
};

export const reservationTemp: {
	id: string | null;
	serviceId: string | null;
	startDate: SlotTimestamp | null;
	pax: number | null;
	seatingTime: number | null;
	notes: string | null;
} = $state({
	id: null,
	serviceId: null,
	startDate: null,
	pax: null,
	seatingTime: null,
	notes: null
});

// The full `book` RPC payload that Booking.svelte stashes before navigating to
// the PAYMENT step. Payment.svelte (in embedded mode) reads this back after
// `stripe.confirmCardPayment` and calls `api.book(...)` synchronously with the
// captured `paymentIntentId`. The legacy webhook-driven flow is gone.
//
// Typed as `unknown`-ish on purpose: the upstream `selection`/`contact` state
// is fed by the existing UI which already has loose nullability. This module
// only round-trips the payload between Booking.svelte and Payment.svelte
// without inspecting fields, so a structural shape isn't worth introducing
// new typecheck errors over.
export type PendingReservationPayload = Record<string, unknown>;

export const pendingReservation: { payload: PendingReservationPayload | null } = $state({
	payload: null
});

export const setPendingReservation = (payload: PendingReservationPayload) => {
	pendingReservation.payload = payload;
};

export const clearPendingReservation = () => {
	pendingReservation.payload = null;
};
