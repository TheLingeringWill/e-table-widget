import { describe, it, expect } from 'vitest';
import { isTerminalBookingStatus, TERMINAL_BOOKING_STATUSES } from './api-types';
import type { BookingStatus } from './api-types';

describe('isTerminalBookingStatus', () => {
	const terminalStatuses: BookingStatus[] = ['arrived', 'seated', 'finished', 'no_show', 'canceled'];
	const nonTerminalStatuses: BookingStatus[] = [
		'to_confirm',
		'waiting_list',
		'confirmed',
		'reconfirmed',
		'requires_payment_intent'
	];

	it.each(terminalStatuses)('returns true for %s', (status) => {
		expect(isTerminalBookingStatus(status)).toBe(true);
	});

	it.each(nonTerminalStatuses)('returns false for %s', (status) => {
		expect(isTerminalBookingStatus(status)).toBe(false);
	});

	it('TERMINAL_BOOKING_STATUSES contains exactly 5 statuses', () => {
		expect(TERMINAL_BOOKING_STATUSES.size).toBe(5);
	});
});
