import { resetSelection } from './selection.svelte';
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

export const previousStep = (Step: Step | null = null) => {
	if (step.step === 'CONTACT') {
		resetWaitlist();
		step.step = 'SELECTION';
	} else if (step.step === 'PAYMENT') {
		step.step = 'CONTACT';
	} else if (step.step === 'BOOKING') {
		step.step = 'CONTACT';
	} else if (step.step === 'DONE' || step.step === 'ERROR') {
		step.step = 'SELECTION';
	}
};

export const gotoStep = (s: Step) => {
	step.step = s;
};
