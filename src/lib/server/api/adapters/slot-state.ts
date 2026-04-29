import type { SlotAvailabilityResponseDTO, SlotSemanticState } from '../types';

// Mirrors the rule used by the legacy api.ts:32 (almostFullThreshold = 1).
// The boundary between AVAILABLE and ALMOST_FULL is when remaining slot capacity
// drops to or below the threshold.
export const ALMOST_FULL_THRESHOLD = 1;

export function deriveSlotState(
	dto: Pick<
		SlotAvailabilityResponseDTO,
		'closed' | 'markedAsFull' | 'slotPax' | 'slotMaxPax' | 'servicePax' | 'serviceMaxPax'
	>
): SlotSemanticState {
	if (dto.closed) return 'CLOSED';
	if (dto.markedAsFull) return 'FULL';
	const slotRemaining = dto.slotMaxPax - dto.slotPax;
	const serviceRemaining = dto.serviceMaxPax - dto.servicePax;
	if (slotRemaining <= 0 || serviceRemaining <= 0) return 'FULL';
	if (slotRemaining <= ALMOST_FULL_THRESHOLD || serviceRemaining <= ALMOST_FULL_THRESHOLD)
		return 'ALMOST_FULL';
	return 'AVAILABLE';
}

export function filterByPax(
	slots: SlotAvailabilityResponseDTO[],
	pax: number
): SlotAvailabilityResponseDTO[] {
	return slots.filter((slot) => slot.possibleGuests.includes(pax));
}
