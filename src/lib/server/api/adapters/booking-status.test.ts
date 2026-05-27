import { describe, it, expect } from 'vitest';
import { resolveBookingStatus, wouldRequireConfirmation } from './booking-status';

const BASE_ARGS = {
	shiftAutoConfirm: false,
	shiftAutoConfirmMaxPax: null as number | null,
	shiftWaitlistEnabled: false,
	shiftMarkedAsFull: false,
	shiftCaptureEnabled: false,
	shiftForeignCaptureEnabled: false,
	slot: { markedAsFull: false, slotPax: 0, slotMaxPax: 20 },
	pax: 2,
	hasPaymentIntentId: false,
	joiningWaitlist: false
};

function resolve(overrides: Record<string, unknown>) {
	const merged = { ...BASE_ARGS, ...overrides };
	if (overrides.slot) {
		merged.slot = { ...BASE_ARGS.slot, ...(overrides.slot as Record<string, unknown>) };
	}
	return resolveBookingStatus(merged as typeof BASE_ARGS);
}

describe('resolveBookingStatus', () => {
	// --- Payment Intent + Capture (Scenario 3) ---

	it('returns confirmed when PI + shift capture enabled', () => {
		expect(resolve({ hasPaymentIntentId: true, shiftCaptureEnabled: true })).toBe('confirmed');
	});

	it('returns confirmed when PI + shift foreignCapture enabled', () => {
		expect(resolve({ hasPaymentIntentId: true, shiftForeignCaptureEnabled: true })).toBe(
			'confirmed'
		);
	});

	it('returns confirmed when PI + slot-level capture overrides shift', () => {
		expect(
			resolve({
				hasPaymentIntentId: true,
				shiftCaptureEnabled: false,
				slot: { captureEnabled: true }
			})
		).toBe('confirmed');
	});

	it('returns confirmed when PI + slot-level foreignCapture overrides shift', () => {
		expect(
			resolve({
				hasPaymentIntentId: true,
				shiftForeignCaptureEnabled: false,
				slot: { foreignCaptureEnabled: true }
			})
		).toBe('confirmed');
	});

	it('does not confirm when PI present but no capture enabled', () => {
		expect(resolve({ hasPaymentIntentId: true })).toBe('to_confirm');
	});

	// --- Waitlist (Scenario 4) ---

	it('returns waiting_list when joiningWaitlist + shift waitlist enabled', () => {
		expect(resolve({ joiningWaitlist: true, shiftWaitlistEnabled: true })).toBe('waiting_list');
	});

	it('returns waiting_list when joiningWaitlist + slot waitlist overrides shift', () => {
		expect(
			resolve({
				joiningWaitlist: true,
				shiftWaitlistEnabled: false,
				slot: { waitlistEnabled: true }
			})
		).toBe('waiting_list');
	});

	it('returns waiting_list when slot full (slotPax >= slotMaxPax) + waitlist', () => {
		expect(
			resolve({
				shiftWaitlistEnabled: true,
				slot: { slotPax: 20, slotMaxPax: 20 }
			})
		).toBe('waiting_list');
	});

	it('returns waiting_list when shift markedAsFull + waitlist', () => {
		expect(resolve({ shiftMarkedAsFull: true, shiftWaitlistEnabled: true })).toBe('waiting_list');
	});

	it('returns waiting_list when slot markedAsFull + waitlist', () => {
		expect(
			resolve({
				shiftWaitlistEnabled: true,
				slot: { markedAsFull: true }
			})
		).toBe('waiting_list');
	});

	// --- Auto-confirm (Scenario 1) ---

	it('returns confirmed when autoConfirm enabled, no pax cap', () => {
		expect(resolve({ shiftAutoConfirm: true })).toBe('confirmed');
	});

	it('returns confirmed when autoConfirm + pax within cap', () => {
		expect(resolve({ shiftAutoConfirm: true, shiftAutoConfirmMaxPax: 4, pax: 2 })).toBe(
			'confirmed'
		);
	});

	it('returns confirmed when pax equals cap exactly', () => {
		expect(resolve({ shiftAutoConfirm: true, shiftAutoConfirmMaxPax: 2, pax: 2 })).toBe(
			'confirmed'
		);
	});

	it('returns to_confirm when autoConfirm + pax exceeds cap (Scenario 2)', () => {
		expect(resolve({ shiftAutoConfirm: true, shiftAutoConfirmMaxPax: 1, pax: 2 })).toBe(
			'to_confirm'
		);
	});

	// --- Default (Scenario 2) ---

	it('returns to_confirm as default', () => {
		expect(resolve({})).toBe('to_confirm');
	});

	// --- Priority cascade ---

	it('PI + capture takes priority over autoConfirm', () => {
		expect(
			resolve({
				hasPaymentIntentId: true,
				shiftCaptureEnabled: true,
				shiftAutoConfirm: true
			})
		).toBe('confirmed');
	});

	it('PI + capture takes priority over waitlist', () => {
		expect(
			resolve({
				hasPaymentIntentId: true,
				shiftCaptureEnabled: true,
				joiningWaitlist: true,
				shiftWaitlistEnabled: true
			})
		).toBe('confirmed');
	});

	it('joiningWaitlist takes priority over slot-full check', () => {
		expect(
			resolve({
				joiningWaitlist: true,
				shiftWaitlistEnabled: true,
				slot: { slotPax: 20, slotMaxPax: 20 }
			})
		).toBe('waiting_list');
	});

	it('full slot without waitlist falls through to autoConfirm', () => {
		expect(
			resolve({
				shiftWaitlistEnabled: false,
				shiftAutoConfirm: true,
				slot: { slotPax: 20, slotMaxPax: 20 }
			})
		).toBe('confirmed');
	});

	it('full slot without waitlist or autoConfirm falls to to_confirm', () => {
		expect(
			resolve({
				shiftWaitlistEnabled: false,
				shiftAutoConfirm: false,
				slot: { slotPax: 20, slotMaxPax: 20 }
			})
		).toBe('to_confirm');
	});
});

const WRC_BASE = {
	shiftAutoConfirm: false,
	shiftAutoConfirmMaxPax: null as number | null,
	shiftCaptureEnabled: false,
	shiftForeignCaptureEnabled: false,
	slot: { captureEnabled: null as boolean | null, foreignCaptureEnabled: null as boolean | null },
	pax: 2
};

function wrc(overrides: Record<string, unknown>) {
	const merged = { ...WRC_BASE, ...overrides };
	if (overrides.slot) {
		merged.slot = { ...WRC_BASE.slot, ...(overrides.slot as Record<string, unknown>) };
	}
	return wouldRequireConfirmation(merged as typeof WRC_BASE);
}

describe('wouldRequireConfirmation', () => {
	it('returns true when no auto-confirm, no capture', () => {
		expect(wrc({})).toBe(true);
	});

	it('returns false when auto-confirm enabled, no pax cap', () => {
		expect(wrc({ shiftAutoConfirm: true })).toBe(false);
	});

	it('returns false when auto-confirm + pax within cap', () => {
		expect(wrc({ shiftAutoConfirm: true, shiftAutoConfirmMaxPax: 4, pax: 2 })).toBe(false);
	});

	it('returns true when auto-confirm + pax exceeds cap', () => {
		expect(wrc({ shiftAutoConfirm: true, shiftAutoConfirmMaxPax: 1, pax: 2 })).toBe(true);
	});

	it('returns false when shift capture enabled', () => {
		expect(wrc({ shiftCaptureEnabled: true })).toBe(false);
	});

	it('returns false when shift foreign capture enabled', () => {
		expect(wrc({ shiftForeignCaptureEnabled: true })).toBe(false);
	});

	it('returns false when slot-level capture overrides shift', () => {
		expect(wrc({ slot: { captureEnabled: true } })).toBe(false);
	});

	it('returns false when slot-level foreignCapture overrides shift', () => {
		expect(wrc({ slot: { foreignCaptureEnabled: true } })).toBe(false);
	});

	it('returns false when both capture and auto-confirm active', () => {
		expect(wrc({ shiftAutoConfirm: true, shiftCaptureEnabled: true })).toBe(false);
	});
});
