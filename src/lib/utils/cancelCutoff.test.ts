import { describe, it, expect } from 'vitest';
import { computeCutoff, type ComputeCutoffArgs } from './cancelCutoff';
import type { BookingShiftResponseDTO, LeadTimeReferenceDTO } from '$lib/api-types';

// Fixture: a service that opens at 19:00 for a booking reserved at 20:00, with a
// 60-minute cancellation lead time. The restaurant lives in Europe/Paris (CEST,
// UTC+2 on this June date); every `now` below is built with an explicit +02:00
// offset so the absolute instant is independent of the machine running the test.
const TZ = 'Europe/Paris';
const DATE = '2026-06-28';

function makeShift(over: Partial<BookingShiftResponseDTO> = {}): BookingShiftResponseDTO {
	return {
		id: 1,
		name: 'Dinner',
		startTime: '19:00',
		endTime: '23:00',
		cancellable: true,
		cancellableBefore: 60,
		cancellableBeforeReference: 'service',
		updatable: true,
		updatableBefore: 60,
		updatableWithPayment: false,
		...over
	};
}

function args(ref: LeadTimeReferenceDTO, nowIso: string): ComputeCutoffArgs {
	return {
		action: 'cancel',
		booking: { date: DATE, time: '20:00' },
		shift: makeShift({ cancellableBeforeReference: ref }),
		restaurantTimezone: TZ,
		now: new Date(nowIso)
	};
}

describe('computeCutoff', () => {
	// The regression: with a `service` reference the cutoff anchor is the service
	// start (19:00), which is earlier than the reservation (20:00). The old guard
	// tested the anchor and hard-blocked (`in_past`) the moment the service opened;
	// the fix judges `in_past` from the reservation time, so this is a (late)
	// `past_cutoff` instead.
	it('service ref between service start and reservation → past_cutoff (was in_past)', () => {
		const result = computeCutoff(args('service', `${DATE}T19:30:00+02:00`));
		expect(result.reason).toBe('past_cutoff');
		expect(result.cutoff).toEqual({ date: DATE, time: '18:00' });
	});

	it('service ref after the reservation time → in_past', () => {
		const result = computeCutoff(args('service', `${DATE}T20:30:00+02:00`));
		expect(result).toEqual({ allowed: false, reason: 'in_past', cutoff: null });
	});

	it('service ref well before the cutoff → allowed', () => {
		const result = computeCutoff(args('service', `${DATE}T17:00:00+02:00`));
		expect(result.allowed).toBe(true);
		expect(result.reason).toBeNull();
		expect(result.cutoff).toEqual({ date: DATE, time: '18:00' });
	});

	// `booking` ref is the unchanged path: here the anchor IS the reservation time,
	// so the guard behaves identically before and after the fix.
	it('booking ref between cutoff and reservation → past_cutoff (unchanged guard)', () => {
		const result = computeCutoff(args('booking', `${DATE}T19:30:00+02:00`));
		expect(result.reason).toBe('past_cutoff');
		expect(result.cutoff).toEqual({ date: DATE, time: '19:00' });
	});

	it('no shift → no_shift', () => {
		const result = computeCutoff({
			action: 'cancel',
			booking: { date: DATE, time: '20:00' },
			shift: null,
			restaurantTimezone: TZ,
			now: new Date(`${DATE}T17:00:00+02:00`)
		});
		expect(result).toEqual({ allowed: false, reason: 'no_shift', cutoff: null });
	});

	it('cancellation disabled on the shift → master_disabled', () => {
		const result = computeCutoff({
			action: 'cancel',
			booking: { date: DATE, time: '20:00' },
			shift: makeShift({ cancellable: false }),
			restaurantTimezone: TZ,
			now: new Date(`${DATE}T17:00:00+02:00`)
		});
		expect(result).toEqual({ allowed: false, reason: 'master_disabled', cutoff: null });
	});
});
