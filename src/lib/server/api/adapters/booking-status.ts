// Pure mirror of the API's booking status assignment rules. Called from the
// book RPC handler before createBooking/updateBooking. Mirrors the flat-args
// shape of resolveDepositPolicy.

import type { BookingStatus } from '$lib/api-types';

type SlotOverrides = {
	markedAsFull: boolean;
	slotPax: number;
	slotMaxPax: number;
	waitlistEnabled?: boolean | null;
	captureEnabled?: boolean | null;
	foreignCaptureEnabled?: boolean | null;
};

export function resolveBookingStatus(args: {
	shiftAutoConfirm: boolean;
	shiftAutoConfirmMaxPax: number | null;
	shiftWaitlistEnabled: boolean;
	shiftMarkedAsFull: boolean;
	shiftCaptureEnabled: boolean;
	shiftForeignCaptureEnabled: boolean;
	slot: SlotOverrides;
	pax: number;
	hasPaymentIntentId: boolean;
	hasReservationId: boolean;
	joiningWaitlist: boolean;
}): BookingStatus {
	const captureEnabled = args.slot.captureEnabled ?? args.shiftCaptureEnabled;
	const foreignCaptureEnabled = args.slot.foreignCaptureEnabled ?? args.shiftForeignCaptureEnabled;

	// Payment-intent path: capture or foreign-capture being enabled forces
	// confirmed (widget) or reconfirmed (standalone). The customer's isForeign
	// is NOT a gate here — per spec, the resolved foreignCaptureEnabled boolean
	// alone is the trigger, regardless of the booker.
	if (args.hasPaymentIntentId && (captureEnabled || foreignCaptureEnabled)) {
		return args.hasReservationId ? 'reconfirmed' : 'confirmed';
	}

	const waitlistEnabled = args.slot.waitlistEnabled ?? args.shiftWaitlistEnabled;
	// Honor explicit user intent: the widget classifies a slot as FULL on three
	// conditions (markedAsFull, slotPax≥slotMaxPax, and pax∉possibleGuests), but
	// the third — "full for this party size" — depends on possibleGuests, which
	// this resolver doesn't see. Trusting joiningWaitlist when waitlist is
	// configured covers all three uniformly without re-deriving them server-side.
	if (args.joiningWaitlist && waitlistEnabled) {
		return 'waiting_list';
	}

	const slotIsFull = args.slot.markedAsFull || args.slot.slotPax >= args.slot.slotMaxPax;
	const isFull = args.shiftMarkedAsFull || slotIsFull;
	if (isFull && waitlistEnabled) {
		return 'waiting_list';
	}

	// Auto-confirm requires both autoConfirm=true AND a numeric cap that
	// admits the requested pax. A missing/null cap is treated as "no admission"
	// per the spec literal `pax <= autoConfirmMaxPax` — null cannot satisfy.
	if (
		args.shiftAutoConfirm &&
		typeof args.shiftAutoConfirmMaxPax === 'number' &&
		args.pax <= args.shiftAutoConfirmMaxPax
	) {
		return 'confirmed';
	}

	return 'to_confirm';
}
