// Widget-local replacement for `shared/utils/phone`. Wraps libphonenumber-js
// with the E.164 conversion + validation helpers the widget consumes — on the
// client (Contact.svelte) and on the server (rpc-router.ts). Display formatting,
// the dynamic placeholder, and the country picker are owned by intl-tel-input
// in Contact.svelte.
//
// The intl-tel-input UI gives us a CountryCode at all times; we still
// defensively default to 'FR' when missing.

import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export function convertToE164(value: string, country: CountryCode = 'FR'): string {
	const parsed = parsePhoneNumberFromString(value, country);
	return parsed?.number ?? value;
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
