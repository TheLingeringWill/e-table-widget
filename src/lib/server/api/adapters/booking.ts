// Server-only. Adapt a REST `BookingDetailResponseDTO` into the legacy
// reservation-to-update shape Widget.svelte expects (nested contact, JS Date
// for startDate, optional service block). This bridge exists for the
// migration window: src/api/api.ts's `loadReservation` and `loadPaymentIntent`
// procedures used to reach into Reservator and return rows with these field
// names; preserving the shape lets the UI code stay untouched until the
// Widget.svelte data path itself moves to a SvelteKit loader.

import type { BookingCivility, BookingDetailResponseDTO } from '../types';

export type LegacyReservationToUpdate = {
	id: string;
	serviceId: string | null;
	startDate: Date | null;
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

// Build a JS Date in restaurant timezone from the REST API's split
// `date: 'YYYY-MM-DD'` + `time: 'HH:MM'` representation. The REST API serves
// times in the restaurant's local clock, so combining naively yields a Date
// whose getTime() reflects the restaurant wall-clock — which is what the
// existing widget code consumes via `zonedDateUtils.format` later on.
function combineDateAndTime(date: string, time: string): Date | null {
	if (!date || !time) return null;
	const [y, m, d] = date.split('-').map(Number);
	const [h, mn] = time.split(':').map(Number);
	if ([y, m, d, h, mn].some((n) => Number.isNaN(n))) return null;
	return new Date(y, (m ?? 1) - 1, d ?? 1, h ?? 0, mn ?? 0);
}

export function bookingToLegacyReservation(
	dto: BookingDetailResponseDTO
): LegacyReservationToUpdate {
	return {
		id: String(dto.id),
		serviceId: dto.shiftSlot?.shift.id ? String(dto.shiftSlot.shift.id) : null,
		startDate: combineDateAndTime(dto.date, dto.time),
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
