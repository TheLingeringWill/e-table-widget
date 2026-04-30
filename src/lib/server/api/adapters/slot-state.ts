import type { LegacySlot } from '$lib/api-types';
import type { SlotAvailabilityResponseDTO, SlotSemanticState } from '../types';

// Mirrors the rule used by the legacy api.ts:32 (almostFullThreshold = 1).
// The boundary between AVAILABLE and ALMOST_FULL is when remaining slot capacity
// drops to or below the threshold.
export const ALMOST_FULL_THRESHOLD = 1;

export function deriveSlotState(
	dto: Pick<
		SlotAvailabilityResponseDTO,
		| 'closed'
		| 'markedAsFull'
		| 'slotPax'
		| 'slotMaxPax'
		| 'servicePax'
		| 'serviceMaxPax'
		| 'possibleGuests'
	>,
	pax?: number
): SlotSemanticState {
	if (dto.closed) return 'CLOSED';
	if (dto.markedAsFull) return 'FULL';
	const slotRemaining = dto.slotMaxPax - dto.slotPax;
	const serviceRemaining = dto.serviceMaxPax - dto.servicePax;
	if (slotRemaining <= 0 || serviceRemaining <= 0) return 'FULL';
	// "Full for this party size" — the API drops pax from possibleGuests when
	// the slot can't fit a party of that size (effective_remaining <
	// min_pax_per_booking). From the user's viewpoint that's full.
	if (pax !== undefined && !dto.possibleGuests.includes(pax)) return 'FULL';
	if (slotRemaining <= ALMOST_FULL_THRESHOLD || serviceRemaining <= ALMOST_FULL_THRESHOLD)
		return 'ALMOST_FULL';
	return 'AVAILABLE';
}

export function filterByPax(
	slots: SlotAvailabilityResponseDTO[],
	pax: number
): SlotAvailabilityResponseDTO[] {
	// Keep all non-CLOSED slots — both AVAILABLE-for-this-pax and FULL-for-
	// this-pax. The API drops `pax` from `possibleGuests` when the slot can't
	// fit a party of that size (capacity reached, marked_as_full, or
	// effective_remaining < min_pax_per_booking). From the user's viewpoint
	// all three are "full for my party," so the widget treats them uniformly:
	// a non-CLOSED slot whose possibleGuests excludes `pax` shows as FULL and
	// the waitlist gate decides whether to render + open the panel.
	return slots.filter((slot) => !slot.closed);
}

// Build a JS Date in the restaurant's wall-clock from a 'YYYY-MM-DD' /
// 'HH:MM' pair. Mirrors `combineDateAndTime` in adapters/booking.ts; kept
// local to slot-state so the slot adapter has no cross-file dep.
function combineDateAndTime(date: string, time: string): Date {
	const [y, m, d] = date.split('-').map(Number);
	const [h, mn] = time.split(':').map(Number);
	return new Date(y, (m ?? 1) - 1, d ?? 1, h ?? 0, mn ?? 0);
}

// Adapt a REST `SlotAvailabilityResponseDTO` to the legacy slot shape
// Selection.svelte / Widget.svelte still consume:
//   - date: JS Date in restaurant tz
//   - state: derived semantic state (PRD §6.2)
//   - pax: requested pax (the new API doesn't echo it; carry from input)
//   - possibleGuests passes through
export function slotToLegacySlot(dto: SlotAvailabilityResponseDTO, pax: number): LegacySlot {
	return {
		date: combineDateAndTime(dto.date, dto.time),
		pax,
		state: deriveSlotState(dto, pax),
		waitlistEnabled: dto.waitlistEnabled,
		possibleGuests: dto.possibleGuests
	};
}
