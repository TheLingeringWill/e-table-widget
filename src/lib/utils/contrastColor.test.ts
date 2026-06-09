import { describe, it, expect } from 'vitest';
import { getContrastColor, brandTextOnLight } from './contrastColor';

describe('getContrastColor', () => {
	it.each(['#022c22', '#000000', '#1a1a40', '#7a0019', '022c22'])(
		'returns white on dark brand %s',
		(c) => expect(getContrastColor(c)).toBe('#ffffff')
	);

	it.each(['#ffffff', '#fafafa', '#f5e6c8', '#ffd700', 'fafafa'])(
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

	it('mid-grey #808080 picks black (WCAG luminance ≈ 0.216 > 0.179)', () => {
		expect(getContrastColor('#808080')).toBe('#000000');
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

	it('falls back to black for invalid input (treated as light)', () => {
		expect(brandTextOnLight('')).toBe('#000000');
	});
});
