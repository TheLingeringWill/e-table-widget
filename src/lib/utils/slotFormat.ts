// Format slot/reservation timestamps that arrive from the REST API as
// `{ date: 'YYYY-MM-DD', time: 'HH:MM' }` in the restaurant's local clock.
//
// These strings are already timezone-aware — feeding them through dayjs's
// `.tz(restaurantTimezone)` would shift the underlying instant and corrupt
// the display when the browser tz differs from the restaurant's. So we
// parse them as plain local-clock literals (no zone) and format directly.

import dayjs from 'dayjs';
import 'dayjs/locale/fr';

export function formatSlotDateTime(date: string, time: string, format: string): string {
	return dayjs(`${date}T${time}`).locale('fr').format(format);
}

export function formatSlotDate(date: string, format: string): string {
	return dayjs(date).locale('fr').format(format);
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
