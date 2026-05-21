// Predicates for hiding services/slots whose time is at-or-before "now" in the
// restaurant's local timezone. Mirrors the tz-aware pattern in `cancelCutoff.ts`:
// build both sides as dayjs values in the restaurant tz, never via
// `new Date(y, m-1, d, h, mn)` (which would interpret wall-clock in the browser tz).

import dayjs from 'dayjs';
import timezoned from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { formatTime } from './time';
import type { LegacyService, LegacySlot } from '$lib/api-types';

dayjs.extend(utc);
dayjs.extend(timezoned);

export function isServiceEnded(
	service: Pick<LegacyService, 'startTime' | 'endTime'>,
	selectedDateStr: string,
	timezone: string,
	now: Date = new Date()
): boolean {
	if (service.endTime < service.startTime) return false;
	const endInstant = dayjs.tz(`${selectedDateStr}T${formatTime(service.endTime)}`, timezone);
	const nowInstant = dayjs(now).tz(timezone);
	return !endInstant.isAfter(nowInstant);
}

export function isSlotPast(
	slot: Pick<LegacySlot, 'date' | 'time'>,
	timezone: string,
	now: Date = new Date()
): boolean {
	const slotInstant = dayjs.tz(`${slot.date}T${slot.time}`, timezone);
	const nowInstant = dayjs(now).tz(timezone);
	return !slotInstant.isAfter(nowInstant);
}
