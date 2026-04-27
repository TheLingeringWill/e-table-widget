import { gotoStep, Steps } from './step.svelte';

export const error: { message: string | null; code: string | null } = $state({
	message: null,
	code: null
});

export const gotoError = (message: string | null = null, code: string | null = null) => {
	error.message = message;
	error.code = code;
	gotoStep(Steps.ERROR);
};
