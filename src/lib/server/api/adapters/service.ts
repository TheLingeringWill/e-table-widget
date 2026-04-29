// Server-only. Adapt a REST `ServiceResponseDTO` into the legacy service shape
// Selection.svelte / Widget.svelte still consume (string id, translation-array
// name/description, ms-from-midnight start/end times). Lives behind the BFF
// boundary and is replaced wholesale once the UI moves to a SvelteKit loader
// that consumes the REST shape directly.

import type { LegacyService } from '$lib/api-types';
import type { ServiceResponseDTO } from '../types';

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

function timeStringToMs(time: string | undefined | null): number {
	if (!time) return 0;
	const [h, m] = time.split(':').map(Number);
	if (Number.isNaN(h) || Number.isNaN(m)) return 0;
	return h * HOUR_MS + m * MINUTE_MS;
}

// Wrap a plain string in the single-language translation-array shape the
// legacy widget code expects (it picks French first, then any). Server-side
// REST already returns the localized string, so we just package it up.
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

export function serviceToLegacyService(dto: ServiceResponseDTO): LegacyService {
	return {
		id: String(dto.id),
		bookable: dto.bookable,
		name: plainToTranslationArray(dto.name),
		description: plainToTranslationArray(dto.description),
		startTime: timeStringToMs(dto.startTime),
		endTime: timeStringToMs(dto.endTime),
		minPaxPerReservation: dto.minPaxPerReservation,
		maxPaxPerReservation: dto.maxPaxPerReservation
	};
}
