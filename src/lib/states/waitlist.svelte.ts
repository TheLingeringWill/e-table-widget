import type { LegacySlot } from '$lib/api-types';

export type Slot = LegacySlot;

export let waitlist: {
	isWaitlist: boolean;
	selectedUnavailableSlot: Slot | null;
} = $state({
	isWaitlist: false,
	selectedUnavailableSlot: null
});

export const resetWaitlist = () => {
	waitlist.isWaitlist = false;
	waitlist.selectedUnavailableSlot = null;
};

export const joinWaitlist = () => {
	waitlist.isWaitlist = true;
};
