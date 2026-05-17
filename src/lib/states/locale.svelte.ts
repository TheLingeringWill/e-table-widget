import { browser } from '$app/environment';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import {
	SUPPORTED_LOCALES,
	DEFAULT_LOCALE,
	type Locale,
	isSupportedLocale
} from '$lib/i18n/detect';

/**
 * Client-side locale state. The initial value is set by `+layout.svelte`
 * from the server-detected `data.locale` so SSR and the first client render
 * agree on the language.
 *
 * `setLocale()` is the single mutation entry point — it writes the
 * `widget_lang` cookie with iframe-friendly attributes (`SameSite=None;
 * Secure`), syncs `?lang=` into the URL, and then reloads the page so the
 * server hook re-picks the locale from the new cookie and Paraglide
 * compiles a fresh SSR pass with the right language. We deliberately do
 * the cookie write ourselves (rather than relying on Paraglide's runtime
 * setLocale) because Paraglide writes the cookie without the third-party
 * attributes the widget needs when embedded in a customer iframe.
 */

const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~400 days

export const currentLocale = $state<{ value: Locale }>({ value: DEFAULT_LOCALE });

export const initLocale = (locale: Locale | undefined) => {
	const next = locale && isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
	currentLocale.value = next;
	// Pin Paraglide's client-side `getLocale()` to the server-decided locale so
	// post-hydration message rendering doesn't fall back to its cookie strategy
	// (the `widget_lang` cookie is shared across same-origin iframes, so a
	// sibling iframe could otherwise force this one into the wrong language).
	if (browser) {
		overwriteGetLocale(() => next);
	}
};

export const setLocale = (next: Locale) => {
	if (!isSupportedLocale(next)) return;
	if (currentLocale.value === next) return;

	currentLocale.value = next;

	if (!browser) return;

	// Cookie: iframe-friendly (SameSite=None; Secure) so the widget keeps
	// its language when embedded on a third-party origin.
	document.cookie = [
		`widget_lang=${next}`,
		'path=/',
		`max-age=${COOKIE_MAX_AGE}`,
		'SameSite=None',
		'Secure'
	].join('; ');

	// Sync the URL so a hard reload or deep-link copy still reflects the
	// user's choice, then full-page reload so SSR rebuilds with the new
	// locale (cleanest way to keep the Paraglide compiled bundle and
	// the server's `event.locals.locale` aligned).
	const url = new URL(window.location.href);
	url.searchParams.set('lang', next);
	window.location.assign(url.toString());
};

export { SUPPORTED_LOCALES, type Locale };
