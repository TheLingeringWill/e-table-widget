const getMonthName = (date, locale) => {
    return date.toLocaleString(locale || undefined, { month: 'long' });
};
export class CalendarState {
    type;
    view = 'single';
    today = new Date();
    events = [];
    onChange;
    date = $state(this.today);
    selected = $state(this.today);
    currentMonth = $derived(this.date.getMonth());
    currentMonthName = $derived(getMonthName(this.date));
    minDate = $state(null);
    maxDate = $state(null);
    nextMonthName = $derived(getMonthName(new Date(this.date.getFullYear(), this.date.getMonth() + 1, 1)));
    currentYear = $derived(this.date.getFullYear());
    nextYear = $derived(new Date(this.date.getFullYear(), this.date.getMonth() + 1, 1).getFullYear());
    weekStartsOnMonday = $state(false);
    rangeStart = $state(null);
    rangeEnd = $state(null);
    displayedMonthLabel = $derived.by(() => {
        if (this.view === 'single') {
            return `${this.currentMonthName} ${this.currentYear}`;
        }
        else if (this.currentYear === this.nextYear) {
            return `${this.currentMonthName} - ${this.nextMonthName} ${this.currentYear}`;
        }
        else {
            return `${this.currentMonthName} ${this.currentYear} - ${this.nextMonthName} ${this.nextYear}`;
        }
    });
    eventsMap = $derived.by(() => this.events.reduce((acc, event) => {
        const date = event.start.toDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(event);
        return acc;
    }, {}));
    disabledDates = [];
    disabledDatesMap = $derived.by(() => this.disabledDates.reduce((acc, date) => {
        const range = [];
        if (Array.isArray(date)) {
            // the arrau is a range. Iterate over the range and add the dates to the map
            const [start, end] = date;
            for (let i = start.getTime(); i <= end.getTime(); i += 1000 * 60 * 60 * 24) {
                range.push(new Date(i));
            }
        }
        else {
            range.push(date);
        }
        range.forEach((d) => {
            acc.set(d.toDateString(), true);
        });
        return acc;
    }, new Map()));
    getCalendarRows = (date = this.date, weekStartsOnMonday = this.weekStartsOnMonday, isNextMonth = false) => {
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const weeks = Math.ceil(daysInMonth / 7) + 1;
        const daysInPreviousMonth = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
        let firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        const rows = [];
        if (weekStartsOnMonday) {
            firstDay = firstDay === 0 ? 6 : firstDay - 1;
        }
        let day = 1;
        let daysAfter = 1;
        for (let i = 0; i < weeks; i++) {
            const row = {
                cells: [],
                events: []
            };
            for (let j = 0; j < 7; j++) {
                const events = [];
                let inMonth = false;
                let isInNextMonth = false;
                let isInPreviousMonth = false;
                const corner = (i === 0 && j === 0 && 't-l') ||
                    (i === 0 && j === 6 && 't-r') ||
                    (i === weeks - 1 && j === 0 && 'b-l') ||
                    (i === weeks - 1 && j === 6 && 'b-r') ||
                    null;
                let cellDate = new Date(date.getFullYear(), date.getMonth(), day);
                let cellDay = Number(String(day));
                // const eventsInRows = events
                // 	.filter((event) => {
                // 		return event.start.getDate() <= cellDay && event.end.getDate() >= cellDay;
                // 	})
                // 	.map((event) => {
                // 		return {
                // 			isOverlappingNext: events.some((event) => event.end.getDate() > cellDay),
                // 			isOverlappingPrevious: events.some((event) => event.start.getDate() < cellDay),
                // 			...event
                // 		} satisfies Row<E>['events'][number];
                // 	});
                if (i === 0 && j < firstDay) {
                    cellDay = daysInPreviousMonth - firstDay + j + 1;
                    cellDate = new Date(date.getFullYear(), date.getMonth() - 1, daysInPreviousMonth - firstDay + j + 1);
                    isInPreviousMonth = true;
                }
                else if (day > daysInMonth) {
                    cellDay = daysAfter;
                    cellDate = new Date(date.getFullYear(), date.getMonth() + 1, daysAfter);
                    daysAfter++;
                    isInNextMonth = true;
                }
                else {
                    inMonth = true;
                    cellDay = day;
                    day++;
                }
                const dateString = cellDate.toDateString();
                const isStartOfRange = this.rangeStart
                    ? dateString === this.rangeStart?.toDateString()
                    : false;
                const isEndOfRange = this.rangeEnd ? dateString === this.rangeEnd?.toDateString() : false;
                const isInRange = (this.type === 'calendar-range' &&
                    this.rangeEnd &&
                    this.rangeStart &&
                    !isStartOfRange &&
                    !isEndOfRange &&
                    cellDate < this.rangeEnd &&
                    cellDate > this.rangeStart) ||
                    false;
                const isToday = dateString === new Date().toDateString();
                const isBeforeMinDate = this.minDate && cellDate.getTime() < this.minDate.getTime();
                const isAfterMaxDate = this.maxDate && cellDate.getTime() > this.maxDate.getTime();
                const isDisabled = this.disabledDatesMap.get(dateString) || isBeforeMinDate || isAfterMaxDate;
                row.cells.push({
                    isStartOfRange,
                    isEndOfRange,
                    visible: this.view === 'single' ? true : isNextMonth ? !isInPreviousMonth : !isInNextMonth,
                    isInNextMonth,
                    isInRange,
                    isInPreviousMonth,
                    inMonth,
                    day: cellDay,
                    date: cellDate,
                    isToday,
                    events,
                    corner,
                    attributes: {
                        style: `grid-row-start:${2 + i}; grid-column-start:${j + 1};`,
                        'data-in-range': isInRange,
                        'data-in-month': inMonth,
                        'data-disabled': isDisabled ? true : undefined,
                        disabled: isDisabled ? true : undefined,
                        'data-is-today': isToday,
                        'data-selected': this.type === 'calendar' ? isStartOfRange : isStartOfRange || isEndOfRange,
                        'data-start-of-range': this.type === 'calendar' ? false : this.rangeComplete && isStartOfRange,
                        'data-end-of-range': this.type === 'calendar' ? false : this.rangeComplete && isEndOfRange,
                        'data-date': cellDate.toISOString(),
                        'data-is-past': !isToday && cellDate.getTime() < new Date().getTime()
                    }
                });
            }
            if (!row.cells.every((cell) => !cell.inMonth)) {
                rows.push(row);
            }
        }
        return rows;
    };
    setRange = (start, end) => {
        this.rangeStart = start;
        this.rangeEnd = end;
    };
    rows = $derived.by(this.getCalendarRows);
    nextMonthRows = $derived.by(() => this.getCalendarRows(new Date(this.date.getFullYear(), this.date.getMonth() + 1, 1), this.weekStartsOnMonday, true));
    rangeComplete = $derived(this.rangeStart && this.rangeEnd);
    constructor(options) {
        this.events = options.events || [];
        this.minDate = options.minDate || null;
        this.maxDate = options.maxDate || null;
        this.type = (options.type || 'calendar');
        this.weekStartsOnMonday = options.weekStartsOnMonday;
        this.view = options.view || 'single';
        this.disabledDates = options.disabledDates || [];
        this.onChange = options.onChange || (() => { });
        if (options.type === 'calendar-range') {
            this.rangeStart = options.value?.[0] || null;
            this.rangeEnd = options.value?.[1] || null;
        }
        else {
            this.rangeStart = options.value || null;
        }
    }
    goNextMonth = () => {
        this.date = new Date(this.date.getFullYear(), this.date.getMonth() + 1, 1);
    };
    goPrevMonth = () => {
        this.date = new Date(this.date.getFullYear(), this.date.getMonth() - 1, 1);
    };
    goToToday = () => {
        this.date = this.today;
    };
    cleanDate = (date) => {
        const cleaned = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        cleaned.setUTCHours(0, 0, 0, 0);
        return cleaned;
    };
    calendar = (node) => {
        const onClick = (e) => {
            const maybeCell = e
                .composedPath()
                .find((node) => node instanceof HTMLElement && node.getAttribute('data-date'));
            if (!maybeCell || (maybeCell && !(maybeCell instanceof HTMLElement))) {
                return;
            }
            if (maybeCell.getAttribute('data-disabled')) {
                return;
            }
            const date = new Date(maybeCell.getAttribute('data-date'));
            if (this.type === 'calendar') {
                this.rangeStart = date;
                this.onChange?.(date);
            }
            else if (this.type === 'calendar-range') {
                if (this.rangeStart && this.rangeEnd) {
                    this.rangeStart = date;
                    this.rangeEnd = null;
                }
                else if (this.rangeStart) {
                    if (date < this.rangeStart) {
                        this.rangeEnd = this.rangeStart;
                        this.rangeStart = date;
                    }
                    else {
                        this.rangeEnd = date;
                    }
                }
                else {
                    this.rangeStart = date;
                }
                this.onChange?.([this.rangeStart || null, this.rangeEnd || null]);
            }
        };
        node.addEventListener('click', onClick);
        return {
            destroy: () => {
                node.removeEventListener('click', onClick);
            }
        };
    };
}
