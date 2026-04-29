// Server-only. Adapt a REST `ServiceResponseDTO` into the legacy service shape
// Selection.svelte / Widget.svelte still consume (string id, translation-array
// name/description, ms-from-midnight start/end times). Lives behind the BFF
// boundary and is replaced wholesale once the UI moves to a SvelteKit loader
// that consumes the REST shape directly.
//
// Live API response field names (verified against jonathan-api-local 2026-04-29)
// differ from the OpenAPI spec; this adapter maps the live shape:
//   id, name, startTime ('HH:MM'), endTime ('HH:MM'),
//   minPaxPerBooking, maxPaxPerBooking, bookable

import type { LegacyService } from '$lib/api-types';

export type LiveServiceDTO = {
	id: number;
	name: string;
	description?: string | null;
	startTime?: string | null;
	endTime?: string | null;
	minPaxPerBooking?: number;
	maxPaxPerBooking?: number;
	bookable?: boolean;
	type?: string;
};

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

export function serviceToLegacyService(dto: LiveServiceDTO): LegacyService {
	return {
		id: String(dto.id),
		bookable: dto.bookable ?? true,
		name: plainToTranslationArray(dto.name),
		description: plainToTranslationArray(dto.description),
		startTime: timeStringToMs(dto.startTime),
		endTime: timeStringToMs(dto.endTime),
		minPaxPerReservation: dto.minPaxPerBooking ?? 1,
		maxPaxPerReservation: dto.maxPaxPerBooking ?? 20
	};
}
