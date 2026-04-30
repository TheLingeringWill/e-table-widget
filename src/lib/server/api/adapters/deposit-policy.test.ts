import { describe, expect, test } from 'vitest';

import { isForeignPhone, resolveDepositPolicy } from './deposit-policy';

const baseShift = {
	shiftCaptureEnabled: true,
	shiftCaptureAmountPerPax: 2000,
	shiftCaptureThreshold: 2,
	shiftForeignCaptureEnabled: false,
	shiftForeignCaptureAmountPerPax: 0
};

describe('resolveDepositPolicy', () => {
	test('disabled when capture_enabled false', () => {
		const result = resolveDepositPolicy({
			...baseShift,
			shiftCaptureEnabled: false,
			slot: {},
			pax: 4,
			isForeign: false
		});
		expect(result.required).toBe(false);
	});

	test('uses shift amount when no slot override', () => {
		const result = resolveDepositPolicy({
			...baseShift,
			slot: {},
			pax: 4,
			isForeign: false
		});
		expect(result.required).toBe(true);
		expect(result.amountCents).toBe(8000);
	});

	test('slot amount overrides shift', () => {
		const result = resolveDepositPolicy({
			...baseShift,
			slot: { captureAmountPerPax: 5000 },
			pax: 3,
			isForeign: false
		});
		expect(result.required).toBe(true);
		expect(result.amountCents).toBe(15000);
	});

	test('slot threshold override disables when pax below', () => {
		const result = resolveDepositPolicy({
			...baseShift,
			slot: { captureThreshold: 6 },
			pax: 4,
			isForeign: false
		});
		expect(result.required).toBe(false);
	});

	test('slot disable overrides shift enable', () => {
		const result = resolveDepositPolicy({
			...baseShift,
			slot: { captureEnabled: false },
			pax: 4,
			isForeign: false
		});
		expect(result.required).toBe(false);
	});

	test('foreign path uses foreign amount', () => {
		const result = resolveDepositPolicy({
			...baseShift,
			shiftForeignCaptureEnabled: true,
			shiftForeignCaptureAmountPerPax: 5000,
			slot: {},
			pax: 2,
			isForeign: true
		});
		expect(result.required).toBe(true);
		expect(result.amountCents).toBe(10000);
		expect(result.isForeignPath).toBe(true);
	});

	test('foreign path disabled returns required false', () => {
		const result = resolveDepositPolicy({
			...baseShift,
			shiftCaptureEnabled: false,
			shiftForeignCaptureEnabled: false,
			slot: {},
			pax: 4,
			isForeign: true
		});
		expect(result.required).toBe(false);
	});

	test('foreign falls back to standard when foreign disabled', () => {
		const result = resolveDepositPolicy({
			...baseShift,
			slot: {},
			pax: 4,
			isForeign: true
		});
		expect(result.required).toBe(true);
		expect(result.isForeignPath).toBe(false);
		expect(result.amountCents).toBe(8000);
	});
});

describe('isForeignPhone', () => {
	test('returns false for FR phone', () => {
		expect(isForeignPhone('+33612345678')).toBe(false);
	});

	test('returns true for non-FR phone', () => {
		expect(isForeignPhone('+447700900000')).toBe(true);
	});

	test('returns false for empty/undefined', () => {
		expect(isForeignPhone(undefined)).toBe(false);
		expect(isForeignPhone(null)).toBe(false);
		expect(isForeignPhone('')).toBe(false);
	});
});
