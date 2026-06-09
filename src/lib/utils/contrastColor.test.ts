import { describe, it, expect } from 'vitest';
import { getContrastColor, brandTextOnLight } from './contrastColor';

describe('getContrastColor', () => {
	it.each(['#022c22', '#000000', '#1a1a40', '#7a0019', '022c22'])(
		'returns white on dark brand %s',
		(c) => expect(getContrastColor(c)).toBe('#ffffff')
	);

	// Mid-tone brands must keep WHITE text — the reported bug was these flipping
	// to black. Calibrated to the reference widget, which renders white on both
	// sage green (#708173) and a light orange (#d19956, lum 0.37), and on greys
	// up to ~#b0b0b0. These are the exact colors the user tested.
	it.each([
		'#708173', // sage green (restaurant 1)
		'#d19956', // orange (user's Zenchef test) — lum 0.37
		'#d39e5f', // same orange, with overlay
		'#8a9a85',
		'#94a48f',
		'#808080',
		'#a0a0a0',
		'#b0b0b0',
		'#c0c0c0' // silver, lum 0.53 — still white
	])('returns white on mid-tone brand %s (Zenchef keeps white)', (c) =>
		expect(getContrastColor(c)).toBe('#ffffff')
	);

	// Only genuinely light / pastel brands (lum ≥ ~0.70) flip to black.
	it.each(['#ffffff', '#fafafa', '#f5e6c8', '#ffd700', '#e8e8e8', '#ffe4b5', '#f0e68c', 'fafafa'])(
		'returns black on light brand %s',
		(c) => expect(getContrastColor(c)).toBe('#000000')
	);

	it('expands 3-digit shorthand', () => {
		expect(getContrastColor('#fff')).toBe('#000000');
		expect(getContrastColor('#000')).toBe('#ffffff');
	});

	it('is case-insensitive and #-optional', () => {
		expect(getContrastColor('#FFFFFF')).toBe('#000000');
		expect(getContrastColor('022C22')).toBe('#ffffff');
	});

	it('pale beige #f5deb3 picks black (genuinely light, lum > 0.65)', () => {
		expect(getContrastColor('#f5deb3')).toBe('#000000');
	});

	it.each(['', 'not-a-color', '#12', '#1234', '#1234567', undefined as unknown as string])(
		'falls back to white for invalid input %s',
		(c) => expect(getContrastColor(c)).toBe('#ffffff')
	);

	it('always returns one of the two literals', () => {
		for (const c of ['#123456', '#abcdef', '#999999']) {
			expect(['#ffffff', '#000000']).toContain(getContrastColor(c));
		}
	});
});

describe('brandTextOnLight', () => {
	it('keeps a dark brand color unchanged (reads on white)', () => {
		expect(brandTextOnLight('#022c22')).toBe('#022c22');
		expect(brandTextOnLight('#1a1a40')).toBe('#1a1a40');
	});

	it('falls back to black for a light brand (would not read on white)', () => {
		expect(brandTextOnLight('#f5e6c8')).toBe('#000000');
		expect(brandTextOnLight('#ffffff')).toBe('#000000');
	});

	// A mid-tone like sage green keeps WHITE text on the brand surface, but is
	// only ~3:1 against white — so on the white CTA button it must be black.
	it('falls back to black for a mid-tone that does not read on white', () => {
		expect(brandTextOnLight('#8a9a85')).toBe('#000000');
		expect(brandTextOnLight('#94a48f')).toBe('#000000');
	});

	it('falls back to black for invalid input (treated as light)', () => {
		expect(brandTextOnLight('')).toBe('#000000');
	});
});
