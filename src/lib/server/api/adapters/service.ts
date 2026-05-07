// Server-only. Adapt a REST `ShiftAvailability` (from /availabilities) into the
// legacy service shape Selection.svelte / Widget.svelte still consume (string
// id, translation-array name/description, ms-from-midnight start/end times).
// Lives behind the BFF boundary and is replaced wholesale once the UI moves to
// a SvelteKit loader that consumes the REST shape directly.
//
// Sourcing the service tile list from /availabilities (not /services) is what
// makes service exceptions show through to the widget: the API has already
// resolved overrides per-date, so the shift `id` is either the parent service
// id on regular days or the exception id on overridden days, and the rest of
// the BFF — which keys off `shift.id` — keeps working unchanged.

import type { LegacyService } from '$lib/api-types';

export type LiveShiftDTO = {
	id: number;
	name: string;
	description?: string | null;
	startTime: string;
	endTime: string;
	minPaxPerBooking: number;
	maxPaxPerBooking: number;
	bookable: boolean;
	waitlistEnabled: boolean;
	markedAsFull?: boolean;
	autoConfirm?: boolean;
	autoConfirmMaxPax?: number | null;
	captureEnabled?: boolean;
	captureAmountPerPax?: number;
	captureThreshold?: number;
	foreignCaptureEnabled?: boolean;
	foreignCaptureAmountPerPax?: number;
};

// /availabilities wire shape: { data: [{ date, shifts: [{ ...shift, slots }] }] }
// Lives here (not in rpc-router) so the BFF has one source of truth for the DTO
// — the slot fields are read by adapters/slot-state.ts and the shift fields by
// shiftToLegacyService below.
export type LiveSlot = {
	id: number;
	time: string;
	closed: boolean;
	markedAsFull: boolean;
	waitlistEnabled?: boolean;
	slotPax: number;
	slotMaxPax: number;
	servicePax: number;
	serviceMaxPax: number;
	possibleGuests: number[];
	captureEnabled?: boolean | null;
	captureAmountPerPax?: number | null;
	captureThreshold?: number | null;
	foreignCaptureEnabled?: boolean | null;
	foreignCaptureAmountPerPax?: number | null;
};
export type LiveShift = LiveShiftDTO & { slots: LiveSlot[] };
export type LiveDay = { date: string; shifts: LiveShift[] };

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

function timeStringToMs(time: string | undefined | null): number {
	if (!time) return 0;
	const [h, m] = time.split(':').map(Number);
	if (Number.isNaN(h) || Number.isNaN(m)) return 0;
	return h * HOUR_MS + m * MINUTE_MS;
}

function plainToTranslationArray(value: string | undefined | null) {
	if (!value) return [];
	return [
		{
			id: 'rest',
			language: 'FR',
			value,
			entity_id: 'rest'
		}
	];
}

export function shiftToLegacyService(shift: LiveShiftDTO): LegacyService {
	return {
		id: String(shift.id),
		bookable: shift.bookable,
		waitlistEnabled: shift.waitlistEnabled,
		name: plainToTranslationArray(shift.name),
		description: plainToTranslationArray(shift.description),
		startTime: timeStringToMs(shift.startTime),
		endTime: timeStringToMs(shift.endTime),
		minPaxPerReservation: shift.minPaxPerBooking,
		maxPaxPerReservation: shift.maxPaxPerBooking,
		captureEnabled: shift.captureEnabled ?? false,
		captureAmountPerPax: shift.captureAmountPerPax ?? 0,
		captureThreshold: shift.captureThreshold ?? 0,
		foreignCaptureEnabled: shift.foreignCaptureEnabled ?? false,
		foreignCaptureAmountPerPax: shift.foreignCaptureAmountPerPax ?? 0
	};
}
