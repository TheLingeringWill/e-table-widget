import { describe, it, expect } from 'vitest';
import { getContrastColor, brandTextOnLight } from './contrastColor';

describe('getContrastColor', () => {
	// Cutoff is the WCAG contrast-parity luminance (0.178): only genuinely dark
	// brands stay white; mid-tones (incl. sage green) flip to black.
	it('uses black on both sage green and the orange at the 0.178 cutoff', () => {
		expect(getContrastColor('#708173')).toBe('#000000'); // sage green, lum 0.20
		expect(getContrastColor('#db9648')).toBe('#000000'); // orange, lum 0.37
	});

	// WHITE: only genuinely dark brands (lum <= 0.178).
	it.each(['#022c22', '#000000', '#1a1a40', '#7a0019', '022c22'])(
		'returns white on dark brand %s',
		(c) => expect(getContrastColor(c)).toBe('#ffffff')
	);

	// BLACK: mid-tones and light brands — sage green, greys, the orange, pastels.
	it.each([
		'#708173', // sage green, lum 0.20
		'#7f8f79',
		'#808080', // mid-grey, lum 0.22
		'#db9648', // orange the user tested
		'#d19956',
		'#8a9a85',
		'#a0a0a0',
		'#c0c0c0',
		'#ffd700',
		'#f5e6c8',
		'#ffffff',
		'#fafafa'
	])('returns black on mid-tone/light brand %s', (c) => expect(getContrastColor(c)).toBe('#000000'));

	it('expands 3-digit shorthand', () => {
		expect(getContrastColor('#fff')).toBe('#000000');
		expect(getContrastColor('#000')).toBe('#ffffff');
	});

	it('is case-insensitive and #-optional', () => {
		expect(getContrastColor('#FFFFFF')).toBe('#000000');
		expect(getContrastColor('022C22')).toBe('#ffffff');
	});

	it('pale beige #f5deb3 picks black (genuinely light)', () => {
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
