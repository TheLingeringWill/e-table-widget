// Widget-local replacement for `shared/utils/phone`. Wraps libphonenumber-js
// with the four helpers the widget Contact component consumes.
//
// The intl-tel-input UI in Contact.svelte gives us a CountryCode at all
// times; we still defensively default to 'FR' when missing.

import { parsePhoneNumberFromString, AsYouType, type CountryCode } from 'libphonenumber-js';

export function formatPhoneAsYouType(value: string, country: CountryCode = 'FR'): string {
	return new AsYouType(country).input(value);
}

export function convertToE164(value: string, country: CountryCode = 'FR'): string {
	const parsed = parsePhoneNumberFromString(value, country);
	return parsed?.number ?? value;
}

export function formatPhoneNumberForDisplay(value: string, country: CountryCode = 'FR'): string {
	const parsed = parsePhoneNumberFromString(value, country);
	return parsed?.formatNational() ?? value;
}

export type PhoneValidationError = 'PHONE_REQUIRED' | 'PHONE_INVALID';

export function getPhoneValidationError(
	value: string | undefined | null,
	country: CountryCode = 'FR'
): PhoneValidationError | null {
	if (!value) return 'PHONE_REQUIRED';
	const parsed = parsePhoneNumberFromString(value, country);
	if (!parsed) return 'PHONE_INVALID';
	if (!parsed.isValid()) return 'PHONE_INVALID';
	return null;
}
