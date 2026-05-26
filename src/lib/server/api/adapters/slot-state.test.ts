import { describe, it, expect } from 'vitest';
import { deriveSlotState, filterByPax, slotToLegacySlot } from './slot-state';
import { buildSlotAvailabilityDTO } from '$lib/test/fixtures';

describe('deriveSlotState', () => {
	it('returns CLOSED when slot is closed', () => {
		expect(deriveSlotState(buildSlotAvailabilityDTO({ closed: true }))).toBe('CLOSED');
	});

	it('returns FULL when markedAsFull', () => {
		expect(deriveSlotState(buildSlotAvailabilityDTO({ markedAsFull: true }))).toBe('FULL');
	});

	it('returns FULL when slot at capacity (slotPax >= slotMaxPax)', () => {
		expect(deriveSlotState(buildSlotAvailabilityDTO({ slotPax: 20, slotMaxPax: 20 }))).toBe(
			'FULL'
		);
	});

	it('returns FULL when service at capacity', () => {
		expect(
			deriveSlotState(buildSlotAvailabilityDTO({ servicePax: 100, serviceMaxPax: 100 }))
		).toBe('FULL');
	});

	it('returns FULL when pax not in possibleGuests (Scenario 5)', () => {
		expect(deriveSlotState(buildSlotAvailabilityDTO({ possibleGuests: [1, 2, 3] }), 5)).toBe(
			'FULL'
		);
	});

	it('returns ALMOST_FULL when slot remaining equals threshold', () => {
		expect(deriveSlotState(buildSlotAvailabilityDTO({ slotPax: 19, slotMaxPax: 20 }))).toBe(
			'ALMOST_FULL'
		);
	});

	it('returns ALMOST_FULL when service remaining equals threshold', () => {
		expect(
			deriveSlotState(buildSlotAvailabilityDTO({ servicePax: 99, serviceMaxPax: 100 }))
		).toBe('ALMOST_FULL');
	});

	it('returns AVAILABLE when plenty of capacity', () => {
		expect(deriveSlotState(buildSlotAvailabilityDTO())).toBe('AVAILABLE');
	});

	it('returns AVAILABLE when pax is in possibleGuests', () => {
		expect(deriveSlotState(buildSlotAvailabilityDTO({ possibleGuests: [2, 3, 4] }), 3)).toBe(
			'AVAILABLE'
		);
	});

	it('CLOSED takes priority over markedAsFull', () => {
		expect(deriveSlotState(buildSlotAvailabilityDTO({ closed: true, markedAsFull: true }))).toBe(
			'CLOSED'
		);
	});
});

describe('filterByPax', () => {
	it('removes closed slots', () => {
		const slots = [
			buildSlotAvailabilityDTO({ time: '19:00', closed: true }),
			buildSlotAvailabilityDTO({ time: '20:00', closed: false })
		];
		const result = filterByPax(slots, 2);
		expect(result).toHaveLength(1);
		expect(result[0].time).toBe('20:00');
	});

	it('keeps full-but-not-closed slots', () => {
		const slots = [
			buildSlotAvailabilityDTO({ time: '19:00', markedAsFull: true, closed: false }),
			buildSlotAvailabilityDTO({ time: '20:00' })
		];
		const result = filterByPax(slots, 2);
		expect(result).toHaveLength(2);
	});

	it('returns empty array when all slots are closed', () => {
		const slots = [
			buildSlotAvailabilityDTO({ closed: true }),
			buildSlotAvailabilityDTO({ closed: true })
		];
		expect(filterByPax(slots, 2)).toHaveLength(0);
	});
});

describe('slotToLegacySlot', () => {
	it('maps all fields from DTO to legacy shape', () => {
		const dto = buildSlotAvailabilityDTO({
			date: '2026-06-01',
			time: '19:30',
			waitlistEnabled: true,
			possibleGuests: [2, 4, 6],
			captureEnabled: true,
			captureAmountPerPax: 2500,
			captureThreshold: 4,
			foreignCaptureEnabled: true,
			foreignCaptureAmountPerPax: 3000
		});
		const result = slotToLegacySlot(dto, 4);
		expect(result.date).toBe('2026-06-01');
		expect(result.time).toBe('19:30');
		expect(result.pax).toBe(4);
		expect(result.waitlistEnabled).toBe(true);
		expect(result.possibleGuests).toEqual([2, 4, 6]);
		expect((result as Record<string, unknown>).captureEnabled).toBe(true);
		expect((result as Record<string, unknown>).captureAmountPerPax).toBe(2500);
		expect((result as Record<string, unknown>).captureThreshold).toBe(4);
		expect((result as Record<string, unknown>).foreignCaptureEnabled).toBe(true);
		expect((result as Record<string, unknown>).foreignCaptureAmountPerPax).toBe(3000);
	});

	it('derives FULL state when slot is at capacity', () => {
		const dto = buildSlotAvailabilityDTO({ slotPax: 20, slotMaxPax: 20 });
		expect(slotToLegacySlot(dto, 2).state).toBe('FULL');
	});

	it('derives AVAILABLE state for a normal slot', () => {
		const dto = buildSlotAvailabilityDTO();
		expect(slotToLegacySlot(dto, 2).state).toBe('AVAILABLE');
	});
});
