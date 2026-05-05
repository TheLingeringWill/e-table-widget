// Datetime helpers for the REST adapter.
// REST returns date as 'YYYY-MM-DD' and time as 'HH:MM' in the restaurant's timezone.
// Slot/reservation timestamps from REST stay as strings end-to-end; only the
// user-picked calendar date (selection.date) is a JS Date that needs
// conversion back to the API's date string for /availabilities queries.

export function formatDateForApi(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}
