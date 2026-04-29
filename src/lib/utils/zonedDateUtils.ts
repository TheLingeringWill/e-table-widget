// Widget-local replacement for the `shared/utils/zonedDateUtils` helper.
// Keeps the small surface area the widget actually consumes: format/parse
// dates in the restaurant's IANA timezone using date-fns + date-fns-tz.
//
// PRD §6.2 ("Date/time normalization"): the widget operates on JS Date
// objects in restaurant timezone — REST API returns split `date` and
// `time` strings the adapter combines back into a Date.

import { format as formatTz, toZonedTime } from 'date-fns-tz';
import { parse as parseDateFns } from 'date-fns';

export class ZonedDateUtils {
	timezone: string;
	locale: string;

	constructor(timezone: string, locale: string = 'fr') {
		this.timezone = timezone || 'Europe/Paris';
		this.locale = locale;
	}

	format(pattern: string, date: Date | string | number): string {
		const d = date instanceof Date ? date : new Date(date);
		// Map dayjs/legacy patterns to date-fns patterns where they differ.
		// `DD/MM/YYYY` works in both. `PPP` etc. work in date-fns. The only
		// gotcha is dayjs `HH:mm` vs date-fns `HH:mm` (same).
		return formatTz(d, pattern, { timeZone: this.timezone });
	}

	parse(input: string, pattern: string = 'yyyy-MM-dd'): Date {
		const parsed = parseDateFns(input, pattern, new Date());
		return toZonedTime(parsed, this.timezone);
	}

	now(): Date {
		return toZonedTime(new Date(), this.timezone);
	}
}
