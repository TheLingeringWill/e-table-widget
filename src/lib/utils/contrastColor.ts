/**
 * Color helpers for Zenchef-style auto-contrast theming. Pure + SSR-safe
 * (arithmetic only, no DOM access).
 */

/**
 * Luminance where contrast vs black equals contrast vs white (WCAG 2.x).
 * Above it a color is "light" → needs dark text; at/below it → light text.
 */
const LUMINANCE_THRESHOLD = 0.179;

/**
 * WCAG 2.x relative luminance of a hex color, or `null` if it can't be parsed.
 * Accepts #rgb / #rrggbb with the leading '#' optional, any case.
 * Linearizes each sRGB channel, then L = 0.2126R + 0.7152G + 0.0722B (0..1).
 */
function hexLuminance(hex: string): number | null {
	if (typeof hex !== 'string') return null;

	let h = hex.trim().replace(/^#/, '').toLowerCase();
	if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
	if (h.length !== 6 || !/^[0-9a-f]{6}$/.test(h)) return null;

	const r = parseInt(h.slice(0, 2), 16) / 255;
	const g = parseInt(h.slice(2, 4), 16) / 255;
	const b = parseInt(h.slice(4, 6), 16) / 255;
	const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Pick a legible foreground (black or white) for a brand/background color,
 * Zenchef-style.
 *
 * Compares the color's luminance to LUMINANCE_THRESHOLD — the luminance where
 * contrast vs black equals contrast vs white. Above it → dark text (#000); else
 * white. Invalid/empty input → '#ffffff' (the previous hardcoded value), so
 * this is always at least as safe as the old behavior.
 */
export function getContrastColor(hex: string): '#ffffff' | '#000000' {
	const luminance = hexLuminance(hex);
	if (luminance === null) return '#ffffff';
	return luminance > LUMINANCE_THRESHOLD ? '#000000' : '#ffffff';
}

/**
 * Text color for the brand color placed ON a white/near-white button.
 * Keeps the brand color when it's dark enough to read on white (preserving
 * brand identity); falls back to black when the brand is too light — or can't
 * be parsed (an unparseable string must never be emitted as a CSS color).
 *
 * A brand reads on white iff its luminance is low; reuse the same cutoff.
 */
export function brandTextOnLight(brand: string): string {
	const luminance = hexLuminance(brand);
	if (luminance === null || luminance > LUMINANCE_THRESHOLD) return '#000000';
	return brand;
}
