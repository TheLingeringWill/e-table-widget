// Widget-local copy of the legacy `shared/utils/zonedDateUtils`. Ported
// verbatim during PRD §7 Phase 4 so the widget no longer depends on the
// `shared` workspace package. dayjs is the runtime; format strings stay
// dayjs-style (DD/MM/YYYY, HH:mm) because every call site already speaks
// that vocabulary.

import dayjs from 'dayjs';
import timezoned from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
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

export class ZonedDateUtils {
	readonly timezone: string;
	private formatLocale: string | undefined;

	// `formatLocale` left undefined → defer to the reactive `currentLocale`
	// at format time so language switches re-render dates without rebuilding
	// the instance. An explicit constructor arg still wins.
	constructor(timezone: string, formatLocale?: string) {
		this.timezone = timezone;
		this.formatLocale = formatLocale;
		dayjs.extend(utc);
		dayjs.extend(timezoned);
	}

	private formatDateToString(date: Date, zoned: boolean = true): string {
		return date.toLocaleString('en-GB', {
			...(zoned && { timeZone: this.timezone }),
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timeZoneName: 'longOffset'
		});
	}

	private parseDateByFormattedString(dateString: string) {
		const commaSplit = dateString.split(',');
		const spaceSplit = dateString.split(' ');
		const [day, month, year] = commaSplit[0].split('/');
		const [hour, minute, second] = spaceSplit[1].split(':');
		const timezoneOffset = spaceSplit[2].split('GMT')[1];
		return { day, month, year, hour, minute, second, timezoneOffset };
	}

	private parseDateByDate(date: Date, zoned: boolean = true) {
		return this.parseDateByFormattedString(this.formatDateToString(date, zoned));
	}

	dateToMidnight(date: Date): Date {
		const { day, month, year, timezoneOffset } = this.parseDateByDate(date);
		return new Date(`${year}-${month}-${day}T00:00:00.000${timezoneOffset}`);
	}

	dateToEndOfDay(date: Date): Date {
		const { day, month, year, timezoneOffset } = this.parseDateByDate(date);
		return new Date(`${year}-${month}-${day}T23:59:59.999${timezoneOffset}`);
	}

	dateToNextDayMidnight(date: Date): Date {
		const dateToMidnight = this.dateToMidnight(date);
		return new Date(dateToMidnight.getTime() + 24 * 60 * 60 * 1000);
	}

	newDateToMidnight(): Date {
		return this.dateToMidnight(new Date());
	}

	dateToTime(date: Date, dateMidnight?: Date): number {
		return (
			date.getTime() - (dateMidnight ? dateMidnight.getTime() : this.dateToMidnight(date).getTime())
		);
	}

	getDateNowToTime(): number {
		return this.dateToTime(new Date());
	}

	convertToInternalDate(date: Date): Date {
		const { day, month, year, hour, minute, second } = this.parseDateByDate(date);
		return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
	}

	inferDateToZone(date: Date): Date {
		const parsedDateNowMidnight = this.parseDateByDate(this.dateToMidnight(new Date()));
		const parsedDate = this.parseDateByDate(date, false);
		return new Date(
			`${parsedDate.year}-${parsedDate.month}-${parsedDate.day}T${parsedDate.hour}:${parsedDate.minute}:${parsedDate.second}${parsedDateNowMidnight.timezoneOffset}`
		);
	}

	isDateToday(date: Date): boolean {
		const parsedDateNowMidnight = this.parseDateByDate(this.dateToMidnight(new Date()));
		const parsedDate = this.parseDateByDate(date);
		return (
			parsedDateNowMidnight.day === parsedDate.day &&
			parsedDateNowMidnight.month === parsedDate.month &&
			parsedDateNowMidnight.year === parsedDate.year
		);
	}

	getWeekday(date: Date): number {
		return dayjs(date).tz(this.timezone).day();
	}

	format(format: string, date?: Date, locale?: string, timezone?: string): string {
		return dayjs(date ?? new Date())
			.tz(timezone ?? this.timezone)
			.locale(locale ?? this.formatLocale ?? currentLocale.value)
			.format(format);
	}
}
