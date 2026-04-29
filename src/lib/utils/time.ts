// Widget-local replacement for the time helpers from `shared/utils/time`.

export function formatTime(date: Date | string | number): string {
	const d = date instanceof Date ? date : new Date(date);
	const h = d.getHours().toString().padStart(2, '0');
	const m = d.getMinutes().toString().padStart(2, '0');
	return `${h}:${m}`;
}

export function getTimeFromDate(date: Date): { hour: number; minute: number } {
	return { hour: date.getHours(), minute: date.getMinutes() };
}

export const hours: number[] = Array.from({ length: 24 }, (_, i) => i);
export const minutes: number[] = Array.from({ length: 60 }, (_, i) => i);
