import { browser } from '$app/environment';

/**
 * Client-side cookie helpers with iframe-friendly attributes.
 *
 * The widget runs as a third-party iframe, so persisted state must survive a
 * cross-site context. `SameSite=None; Secure` alone is NOT enough — an
 * unpartitioned third-party cookie is blocked outright by Safari ITP and by
 * Chrome whenever third-party cookies are off (always in Incognito), so the
 * write silently no-ops and "remember me" never prefills when embedded. We
 * therefore also set `Partitioned` (CHIPS): the browser keeps the cookie keyed
 * to the embedding restaurant's top-level site, which IS allowed cross-site in
 * Chrome 114+, Safari 18.4+, and Firefox (which partitions third-party cookies
 * anyway). See `src/lib/states/locale.svelte.ts` for the `widget_lang` cookie,
 * which intentionally stays unpartitioned because its language choice has
 * non-cookie fallbacks (`?lang=` URL param + `Accept-Language`).
 *
 * This is the store behind "remember me", mirroring how Zenchef persists the
 * booking contact: a `formDataFromCookies` cookie with no Max-Age (a session
 * cookie).
 */

/**
 * "Remember me" cookie name — matches Zenchef's. Host-only (no `domain`
 * attribute) and `Partitioned`, so the browser keeps a separate copy per
 * embedding site (the restaurant's top-level domain) rather than one cookie
 * shared across every restaurant. Cross-restaurant sharing never actually
 * worked when embedded anyway — the unpartitioned cookie was being blocked.
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
		'Secure',
		'Partitioned'
	].join('; ');
}

/**
 * Delete a cookie (immediate expiry — mirrors Zenchef's `expires: new Date`).
 * Carries `Partitioned` too: a partitioned cookie can only be cleared from the
 * same partition it was written in.
 */
export function deleteCookie(name: string): void {
	if (!browser) return;
	document.cookie = [
		`${name}=`,
		'path=/',
		'max-age=0',
		'SameSite=None',
		'Secure',
		'Partitioned'
	].join('; ');
}
