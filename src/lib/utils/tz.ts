// Widget-local replacement for `shared/utils/tz`. The shared module
// normalised the legacy `Europe__Paris` storage format back to the
// IANA `Europe/Paris` form. The REST aggregate already returns the
// proper IANA form, but call sites still feed values through `tz()`,
// so keep it as a defensive identity-with-fix-up.
export function tz(value: string): string {
	if (!value) return 'Europe/Paris';
	return value.replace('__', '/');
}
