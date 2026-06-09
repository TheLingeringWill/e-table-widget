/**
 * Color helpers for Zenchef-style auto-contrast theming. Pure + SSR-safe
 * (arithmetic only, no DOM access).
 */

/**
 * Cutoff for foreground ON the brand surface (text, borders, day squares).
 * Zenchef keeps white text on the brand color unless the brand is genuinely
 * LIGHT/pastel — not at the contrast-parity point (0.179), which would flip a
 * mid-tone like sage green (lum ≈ 0.30) to black even though white reads fine
 * there and is the desired look. 0.45 keeps white through the mid-tones and
 * only switches to black for near-white / pale brands.
 */
const SURFACE_LIGHT_CUTOFF = 0.45;

/**
 * Cutoff for the brand color used as TEXT on the white CTA button. Here the
 * background is white, so the brand must have real contrast against white to
 * stay legible — that is the contrast-parity luminance (0.179, where contrast
 * vs black equals contrast vs white). A brand above it (e.g. sage green at
 * 0.30, only ~3:1 on white) falls back to black; a dark brand is kept.
 */
const READS_ON_WHITE_CUTOFF = 0.179;

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
 * Pick a legible foreground (black or white) for the brand SURFACE, Zenchef-
 * style: keep white unless the brand is genuinely light/pastel.
 *
 * Flips to black only when luminance exceeds SURFACE_LIGHT_CUTOFF, so mid-tone
 * brands (e.g. sage green) keep white text — matching the reference widget.
 * Invalid/empty input → '#ffffff' (the previous hardcoded value), so this is
 * always at least as safe as the old behavior.
 */
export function getContrastColor(hex: string): '#ffffff' | '#000000' {
	const luminance = hexLuminance(hex);
	if (luminance === null) return '#ffffff';
	return luminance > SURFACE_LIGHT_CUTOFF ? '#000000' : '#ffffff';
}

/**
 * Text color for the brand color placed ON a white/near-white button.
 * Keeps the brand color when it's dark enough to read on white (preserving
 * brand identity); falls back to black when the brand is too light — or can't
 * be parsed (an unparseable string must never be emitted as a CSS color).
 *
 * Uses READS_ON_WHITE_CUTOFF (stricter than the surface cutoff): the button
 * background is white, so the brand needs real contrast against white to stay.
 */
export function brandTextOnLight(brand: string): string {
	const luminance = hexLuminance(brand);
	if (luminance === null || luminance > READS_ON_WHITE_CUTOFF) return '#000000';
	return brand;
}
