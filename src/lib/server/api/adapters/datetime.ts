// Datetime helpers for the REST adapter.
// REST returns date as 'YYYY-MM-DD' and time as 'HH:MM' in the restaurant's timezone.
// The widget's UI works in JS Date objects; conversion uses the restaurant tz from the aggregate.

export function formatDateForApi(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function formatTimeForApi(d: Date): string {
	const h = String(d.getHours()).padStart(2, '0');
	const m = String(d.getMinutes()).padStart(2, '0');
	return `${h}:${m}`;
}

export function parseRestDateTime(date: string, time: string): { date: string; time: string } {
	// Pass-through for the scaffold; tz-aware reconstruction happens in the consumer
	// using the restaurant timezone from the aggregate response.
	return { date, time };
}
