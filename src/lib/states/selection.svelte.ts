import type { API } from '../../api/api';
import type { InferApiTypes } from 'svelte-rpc';
import { gotoStep } from './step.svelte';

export let openedAccordion: {
	index: number | null;
} = $state({
	index: null
});
export let accordionToOpen: {
	index: number | null;
} = $state({
	index: null
});

export let selection: {
	service: InferApiTypes<API>['getServices']['output'][number] | null;
	pax: number | null;
	date: Date | null;
	slot: InferApiTypes<API>['getServiceSlots']['output'][number] | null;
} = $state({
	service: null,
	pax: null,
	date: null,
	slot: null
});

export const resetSelection = () => {
	selection.service = null;
	selection.pax = null;
	selection.date = null;
	selection.slot = null;
};

export const gotoSelection = (openAccordion: number | null = -1, reset = false) => {
	if (openAccordion !== -1) {
		accordionToOpen.index = openAccordion;
	}
	if (reset) {
		resetSelection();
	}
	gotoStep('SELECTION');
};
