// Format slot/reservation timestamps that arrive from the REST API as
// `{ date: 'YYYY-MM-DD', time: 'HH:MM' }` in the restaurant's local clock.
//
// These strings are already timezone-aware — feeding them through dayjs's
// `.tz(restaurantTimezone)` would shift the underlying instant and corrupt
// the display when the browser tz differs from the restaurant's. So we
// parse them as plain local-clock literals (no zone) and format directly.
//
// Locale is read from the reactive `currentLocale` $state at call time, so
// language switches re-render dates wherever these helpers are used inside
// `.svelte` template expressions. All supported locales are eagerly imported
// below so dayjs can switch synchronously.

import dayjs from 'dayjs';
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import 'dayjs/locale/it';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';
import 'dayjs/locale/nl';
import 'dayjs/locale/pt';
import 'dayjs/locale/zh';
import { currentLocale } from '$lib/states/locale.svelte';

export function formatSlotDateTime(date: string, time: string, format: string): string {
	return dayjs(`${date}T${time}`).locale(currentLocale.value).format(format);
}

export function formatSlotDate(date: string, format: string): string {
	return dayjs(date).locale(currentLocale.value).format(format);
}

export function slotKey(date: string, time: string): string {
	return `${date}T${time}`;
}

// Parse a `'YYYY-MM-DD'` slot/reservation date string into a JS `Date` at
// midnight in the *browser's* local clock — the form `selection.date` (the
// calendar picker's value) takes. The browser-local interpretation is fine
// because `selection.date` only feeds `/availabilities` queries and the
// calendar UI; both work in calendar days, not absolute instants.
export function parseSlotDateAsCalendarDate(date: string): Date {
	const [y, m, d] = date.split('-').map(Number);
	return new Date(y, (m ?? 1) - 1, d ?? 1);
}
