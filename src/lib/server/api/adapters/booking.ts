// Server-only. Adapt a REST `BookingDetailResponseDTO` into the legacy
// reservation-to-update shape Widget.svelte expects (nested contact, slot
// timestamp as `{ date, time }` strings, optional service block).

import type { SlotTimestamp } from '$lib/api-types';
import type { BookingCivility, BookingDetailResponseDTO } from '../types';

export type LegacyReservationToUpdate = {
	id: string;
	serviceId: string | null;
	startDate: SlotTimestamp | null;
	pax: number;
	notes?: string | null;
	contact: {
		civility?: BookingCivility | null;
		countryCode?: string | null;
		firstName?: string | null;
		lastName?: string | null;
		email?: string | null;
		phone?: string | null;
	};
	service?: unknown;
};

export function bookingToLegacyReservation(
	dto: BookingDetailResponseDTO
): LegacyReservationToUpdate {
	return {
		id: String(dto.id),
		serviceId: dto.shiftSlot?.shift.id ? String(dto.shiftSlot.shift.id) : null,
		startDate: dto.date && dto.time ? { date: dto.date, time: dto.time } : null,
		pax: dto.pax,
		notes: dto.note ?? null,
		contact: {
			civility: dto.civility ?? null,
			countryCode: dto.countryCode ?? null,
			firstName: dto.firstName ?? null,
			lastName: dto.lastName ?? null,
			email: dto.email ?? null,
			phone: dto.phone ?? null
		}
	};
}
