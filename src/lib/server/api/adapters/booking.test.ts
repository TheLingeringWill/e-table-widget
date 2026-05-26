import { describe, it, expect } from 'vitest';
import { bookingToLegacyReservation } from './booking';
import { buildBookingDetailDTO } from '$lib/test/fixtures';

describe('bookingToLegacyReservation', () => {
	it('maps all fields from a complete DTO', () => {
		const dto = buildBookingDetailDTO({
			id: 42,
			pax: 4,
			date: '2026-07-15',
			time: '20:30',
			seatingTime: 120,
			comment: 'Window seat please',
			paymentStatus: 'requires_capture',
			civility: 'mrs',
			countryCode: 'DE',
			firstName: 'Anna',
			lastName: 'Schmidt',
			email: 'anna@example.de',
			phone: '+491234567890',
			shiftSlot: {
				slotId: 300,
				shift: {
					id: 150,
					name: 'Lunch',
					startTime: '12:00',
					endTime: '15:00',
					cancellable: true,
					cancellableBefore: 12,
					cancellableBeforeReference: 'booking',
					updatable: true,
					updatableBefore: 12,
					updatableWithPayment: false
				}
			}
		});

		const result = bookingToLegacyReservation(dto);

		expect(result.id).toBe('42');
		expect(result.serviceId).toBe('150');
		expect(result.startDate).toEqual({ date: '2026-07-15', time: '20:30' });
		expect(result.pax).toBe(4);
		expect(result.seatingTime).toBe(120);
		expect(result.notes).toBe('Window seat please');
		expect(result.paymentStatus).toBe('requires_capture');
		expect(result.contact).toEqual({
			civility: 'mrs',
			countryCode: 'DE',
			firstName: 'Anna',
			lastName: 'Schmidt',
			email: 'anna@example.de',
			phone: '+491234567890'
		});
	});

	it('handles null shiftSlot gracefully', () => {
		const dto = buildBookingDetailDTO({ shiftSlot: null });
		expect(bookingToLegacyReservation(dto).serviceId).toBeNull();
	});

	it('handles missing date/time', () => {
		const dto = buildBookingDetailDTO();
		// Simulate missing date/time by overriding
		(dto as Record<string, unknown>).date = null;
		(dto as Record<string, unknown>).time = null;
		expect(bookingToLegacyReservation(dto).startDate).toBeNull();
	});

	it('defaults nullable contact fields to null', () => {
		const dto = buildBookingDetailDTO({
			civility: undefined,
			countryCode: undefined,
			firstName: undefined,
			lastName: undefined,
			email: undefined,
			phone: undefined
		});
		const result = bookingToLegacyReservation(dto);
		expect(result.contact.civility).toBeNull();
		expect(result.contact.countryCode).toBeNull();
		expect(result.contact.firstName).toBeNull();
		expect(result.contact.lastName).toBeNull();
		expect(result.contact.email).toBeNull();
		expect(result.contact.phone).toBeNull();
	});

	it('maps comment to notes', () => {
		const dto = buildBookingDetailDTO({ comment: null });
		expect(bookingToLegacyReservation(dto).notes).toBeNull();
	});
});
