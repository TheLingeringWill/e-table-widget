export const reservation: {
	id: string | undefined;
	serviceId: string | undefined;
	startDate: Date | undefined;
	pax: number | undefined;
	notes: string | undefined;
} = $state({
	id: undefined,
	serviceId: undefined,
	startDate: undefined,
	pax: undefined,
	notes: undefined
});

export const resetReservation = () => {
	reservation.id = undefined;
	reservation.serviceId = undefined;
	reservation.startDate = undefined;
	reservation.pax = undefined;
	reservation.notes = undefined;
};

export const reservationTemp: {
	id: string | null;
	serviceId: string | null;
	startDate: Date | null;
	pax: number | null;
	notes: string | null;
} = $state({
	id: null,
	serviceId: null,
	startDate: null,
	pax: null,
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
