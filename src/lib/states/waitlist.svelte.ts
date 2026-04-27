import type { InferApiTypes } from 'svelte-rpc';
import type { API } from '../../api/api';

export type Slot = InferApiTypes<API>['getServiceSlots']['output'][number];

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
