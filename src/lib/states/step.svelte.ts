import { accordionToOpen, resetSelection } from './selection.svelte';
import { resetWaitlist } from './waitlist.svelte';

export const Steps = {
	SELECTION: 'SELECTION',
	CONTACT: 'CONTACT',
	BOOKING: 'BOOKING',
	PAYMENT: 'PAYMENT',
	PAYMENT_SECRET: 'PAYMENT_SECRET',
	ERROR: 'ERROR',
	DONE: 'DONE'
};

type Step = (typeof Steps)[keyof typeof Steps];

export let step: { step: Step } = $state({
	step: 'SELECTION'
});

export const nextStep = () => {
	if (step.step === 'SELECTION') {
		step.step = 'CONTACT';
	} else if (step.step === 'CONTACT') {
		step.step = 'BOOKING';
	} else if (step.step === 'BOOKING' || step.step === 'PAYMENT') {
		step.step = 'DONE';
	} else if (step.step === 'DONE' || step.step === 'ERROR') {
		resetSelection();
		step.step = 'SELECTION';
	}
};

// `openIndex` is the Selection step bar segment to open on the way back. When
// returning to SELECTION every step usually has a value, so the bar's active
// index would be null and the content area below it would be empty. Default to
// the time/slots segment (index 2) so there is always content on screen; the
// header's quick-jump buttons pass their own target (date 0, pax 1, time 2).
// Set accordionToOpen (not openedAccordion) because Selection remounts on the
// way back and its onMount honors accordionToOpen — a direct openedAccordion
// write would be clobbered by the remount's openAccordion() recompute.
export const previousStep = (Step: Step | null = null, openIndex: number = 2) => {
	if (step.step === 'CONTACT') {
		resetWaitlist();
		accordionToOpen.index = openIndex;
		step.step = 'SELECTION';
	} else if (step.step === 'PAYMENT') {
		step.step = 'CONTACT';
	} else if (step.step === 'BOOKING') {
		step.step = 'CONTACT';
	} else if (step.step === 'DONE' || step.step === 'ERROR') {
		accordionToOpen.index = openIndex;
		step.step = 'SELECTION';
	}
};

export const gotoStep = (s: Step) => {
	step.step = s;
};
