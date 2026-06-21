import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezoned from 'dayjs/plugin/timezone';
import type { LiveDay } from './adapters/service';
import { createWidgetApi } from './widget-api';

dayjs.extend(utc);
dayjs.extend(timezoned);

// Number of days ahead the widget calendar lets a guest book. Shared by the
// SSR preload and the client fallback so both request the same window.
export const AVAILABLE_DATES_WINDOW_DAYS = 120;

// Reduce the live availability response to the list of bookable date strings
// (YYYY-MM-DD), dropping days with no bookable shift and pruning today once all
// of today's shifts have already ended (timezone-aware). Pure — shared by the
// getAvailableDates RPC and the SSR preload so they can never diverge.
export function computeAvailableDates(days: LiveDay[], timezone: string): string[] {
	const todayStr = dayjs().tz(timezone).format('YYYY-MM-DD');
	const now = dayjs().tz(timezone);

	return days
		.filter((d) => {
			const bookable = d.shifts.filter((s) => s.bookable);
			if (bookable.length === 0) return false;
			if (d.date !== todayStr) return true;
			return bookable.some((s) => {
				if (s.endTime <= s.startTime) return true;
				return dayjs.tz(`${todayStr}T${s.endTime}`, timezone).isAfter(now);
			});
		})
		.map((d) => d.date);
}

// Fetch + reduce the bookable dates for the default 120-day window starting
// "today" in the restaurant's timezone. Returns the available date strings and
// the window's end date (ISO) so the calendar can cap navigation. Returns null
// on any upstream failure so callers can fall back to the client fetch rather
// than blocking the page. Server-only (imports the REST client).
export async function loadAvailableDates(
	restaurantId: number,
	timezone: string
): Promise<{ dates: string[]; endDate: string } | null> {
	const today = dayjs().tz(timezone);
	const startDate = today.format('YYYY-MM-DD');
	const endDate = today.add(AVAILABLE_DATES_WINDOW_DAYS, 'day').format('YYYY-MM-DD');

	const result = await createWidgetApi(restaurantId).getAvailabilities({ startDate, endDate });
	if (!result.ok) return null;

	const dates = computeAvailableDates(result.data.data as LiveDay[], timezone);
	return { dates, endDate };
}
