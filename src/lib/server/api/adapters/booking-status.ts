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

	// Auto-confirm honors the shift's autoConfirm flag. autoConfirmMaxPax is
	// an OPTIONAL pax cap: when set, pax must be <= cap; when null/undefined,
	// there is no cap and all party sizes auto-confirm. Mirrors the management
	// UI in app/.../tab-automation.tsx where the cap is a separate optional
	// switch on top of the base autoConfirm toggle.
	if (
		args.shiftAutoConfirm &&
		(args.shiftAutoConfirmMaxPax == null || args.pax <= args.shiftAutoConfirmMaxPax)
	) {
		return 'confirmed';
	}

	return 'to_confirm';
}
