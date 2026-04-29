// Widget-local copy of `shared/utils/time` — ported verbatim during PRD §7
// Phase 4 so the widget no longer depends on the `shared` workspace package.
//
// `formatTime` takes milliseconds-from-midnight (NOT a Date or epoch ms).
// Constructing `new Date(ms)` would interpret it as a UTC epoch and skew
// the display by the local timezone offset (e.g. 12:00 → 13:00 in CET).

export const hours = (n: number, zeroPadding = false, miliseconds = true) => {
	const totalHours = Math.floor(n / (miliseconds ? 1000 * 60 * 60 : 60));
	return zeroPadding ? (totalHours < 10 ? '0' + totalHours : totalHours) : totalHours;
};

export const minutes = (n: number, zeroPadding = false, miliseconds = true) => {
	const totalMinutes = Math.floor(n / (miliseconds ? 1000 * 60 : 60)) % 60;
	return zeroPadding ? (totalMinutes < 10 ? '0' + totalMinutes : totalMinutes) : totalMinutes;
};

export const formatTime = (milliseconds: number): string => {
	const h = Math.floor(milliseconds / (1000 * 60 * 60));
	const m = Math.floor((milliseconds / (1000 * 60)) % 60);
	const fh = h < 10 ? `0${h}` : `${h}`;
	const fm = m < 10 ? `0${m}` : `${m}`;
	return `${fh}:${fm}`;
};

export const getTimeFromDate = (date: Date): number => {
	// Legacy callers pass a `Date` and use the result with `formatTime`
	// (so it must be milliseconds-from-midnight). Compute it from local
	// hours/minutes — the shared/utils/time helpers used the same shape.
	return date.getHours() * 60 * 60 * 1000 + date.getMinutes() * 60 * 1000;
};
