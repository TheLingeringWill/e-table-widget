// Snapshot-time cutoff math for the cancel/modify management page.
//
// Booking `date` + `time` and shift `startTime` are restaurant-local wall-clock
// strings (see slotFormat.ts header). To compare them against "now" we build
// both sides as tz-aware dayjs values in the restaurant timezone — never via
// `new Date(y, m-1, d, h, mn)`, which would interpret the wall-clock in the
// browser tz and shift the underlying instant.

import dayjs from 'dayjs';
import timezoned from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import type { BookingShiftResponseDTO, LeadTimeReferenceDTO, SlotTimestamp } from '$lib/api-types';

dayjs.extend(utc);
dayjs.extend(timezoned);

export type CutoffAction = 'cancel' | 'update';

export type CutoffStatus =
	| { allowed: true; reason: null; cutoff: SlotTimestamp }
	| { allowed: false; reason: 'master_disabled'; cutoff: null }
	| { allowed: false; reason: 'no_shift'; cutoff: null }
	| { allowed: false; reason: 'in_past'; cutoff: null }
	| { allowed: false; reason: 'past_cutoff'; cutoff: SlotTimestamp };

export interface ComputeCutoffArgs {
	action: CutoffAction;
	booking: { date: string; time: string };
	shift: BookingShiftResponseDTO | null;
	restaurantTimezone: string;
	now?: Date;
}

export function computeCutoff(args: ComputeCutoffArgs): CutoffStatus {
	const { action, booking, shift, restaurantTimezone } = args;
	if (!shift) return { allowed: false, reason: 'no_shift', cutoff: null };

	const enabled = action === 'cancel' ? shift.cancellable : shift.updatable;
	const minutes = action === 'cancel' ? shift.cancellableBefore : shift.updatableBefore;
	const ref: LeadTimeReferenceDTO =
		action === 'cancel' ? shift.cancellableBeforeReference : 'booking';

	if (!enabled) return { allowed: false, reason: 'master_disabled', cutoff: null };

	const refTime = ref === 'service' ? shift.startTime : booking.time;
	const refInstant = dayjs.tz(`${booking.date}T${refTime}`, restaurantTimezone);
	const cutoffInstant = refInstant.subtract(minutes, 'minute');
	const nowInstant = dayjs(args.now ?? new Date()).tz(restaurantTimezone);

	if (refInstant.isBefore(nowInstant)) {
		return { allowed: false, reason: 'in_past', cutoff: null };
	}

	const cutoffSlot: SlotTimestamp = {
		date: cutoffInstant.tz(restaurantTimezone).format('YYYY-MM-DD'),
		time: cutoffInstant.tz(restaurantTimezone).format('HH:mm')
	};

	return cutoffInstant.isBefore(nowInstant)
		? { allowed: false, reason: 'past_cutoff', cutoff: cutoffSlot }
		: { allowed: true, reason: null, cutoff: cutoffSlot };
}
