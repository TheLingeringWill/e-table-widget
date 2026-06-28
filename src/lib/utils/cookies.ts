import { browser } from '$app/environment';

/**
 * Client-side cookie helpers with iframe-friendly attributes.
 *
 * The widget runs as a third-party iframe, so persisted state has to use
 * `SameSite=None; Secure` to be readable in that cross-site context — the same
 * attributes the `widget_lang` cookie already relies on (see
 * `src/lib/states/locale.svelte.ts`). This is the store behind "remember me",
 * mirroring how Zenchef persists the booking contact: a single shared
 * `formDataFromCookies` cookie with no Max-Age (a session cookie).
 */

/**
 * "Remember me" cookie name — matches Zenchef's. Host-only (no `domain`
 * attribute), so it is one shared cookie across every restaurant served from
 * this widget host, exactly like Zenchef's single bookings-domain cookie.
 */
export const CONTACT_COOKIE = 'formDataFromCookies';

/** Read a cookie value (URL-decoded), or null if absent / unavailable. */
export function getCookie(name: string): string | null {
	if (!browser) return null;
	const prefix = `${name}=`;
	for (const part of document.cookie.split('; ')) {
		if (part.startsWith(prefix)) {
			try {
				return decodeURIComponent(part.slice(prefix.length));
			} catch {
				return null;
			}
		}
	}
	return null;
}

/**
 * Persist a cookie value (URL-encoded — the JSON payload contains `;`, `,`, `"`,
 * spaces). No Max-Age/Expires → a session cookie, matching Zenchef (Safari
 * additionally caps it at ~7 days).
 */
export function setCookie(name: string, value: string): void {
	if (!browser) return;
	document.cookie = [
		`${name}=${encodeURIComponent(value)}`,
		'path=/',
		'SameSite=None',
		'Secure'
	].join('; ');
}

/** Delete a cookie (immediate expiry — mirrors Zenchef's `expires: new Date`). */
export function deleteCookie(name: string): void {
	if (!browser) return;
	document.cookie = [`${name}=`, 'path=/', 'max-age=0', 'SameSite=None', 'Secure'].join('; ');
}
