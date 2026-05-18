/**
 * Server-side locale detection for the widget.
 *
 * Precedence: ?lang= query > widget_lang cookie > Accept-Language header > DEFAULT_LOCALE.
 *
 * Mirrors the strategy advertised in `vite.config.ts` (`['cookie',
 * 'preferredLanguage', 'baseLocale']`), but we apply detection ourselves
 * in `hooks.server.ts` so we can prefer the URL query param and write the
 * cookie with iframe-friendly attributes (`SameSite=None; Secure`). The
 * Paraglide runtime then reads the cookie we just wrote, so server-rendered
 * markup matches our detected locale.
 */

export const SUPPORTED_LOCALES = ['fr', 'en', 'de', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const isSupportedLocale = (value: unknown): value is Locale =>
	typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);

/**
 * Parse an `Accept-Language` header and return the first supported locale.
 * Honors `q=` quality weights when picking among multiple tags.
 *
 *   "en-US,en;q=0.9,fr;q=0.8" → "en"
 *   "de,fr-FR;q=0.7,en;q=0.5" → "fr"
 */
const parseAcceptLanguage = (header: string | null): Locale | undefined => {
	if (!header) return undefined;
	const candidates = header
		.split(',')
		.map((raw) => {
			const [tag, ...params] = raw.trim().split(';');
			const qParam = params.find((p) => p.trim().startsWith('q='));
			const q = qParam ? parseFloat(qParam.split('=')[1] ?? '1') : 1;
			const primary = tag.split('-')[0]?.toLowerCase();
			return { primary, q: Number.isFinite(q) ? q : 0 };
		})
		.filter((c): c is { primary: string; q: number } => Boolean(c.primary))
		.sort((a, b) => b.q - a.q);

	for (const c of candidates) {
		if (isSupportedLocale(c.primary)) return c.primary;
	}
	return undefined;
};

/**
 * Resolve the locale for an incoming request.
 *
 * Returns `{ locale, urlOverride }`. `urlOverride` is the (validated) value
 * pulled from `?lang=`; callers persist it to the `widget_lang` cookie so
 * subsequent requests without the query param still resolve correctly.
 */
export const pickLocale = (input: {
	url: URL;
	cookieValue: string | undefined;
	acceptLanguage: string | null;
}): { locale: Locale; urlOverride: Locale | undefined } => {
	const urlRaw = input.url.searchParams.get('lang')?.toLowerCase();
	const urlOverride = isSupportedLocale(urlRaw) ? urlRaw : undefined;

	const cookieLocale = isSupportedLocale(input.cookieValue) ? input.cookieValue : undefined;
	const headerLocale = parseAcceptLanguage(input.acceptLanguage);

	const locale = urlOverride ?? cookieLocale ?? headerLocale ?? DEFAULT_LOCALE;
	return { locale, urlOverride };
};
