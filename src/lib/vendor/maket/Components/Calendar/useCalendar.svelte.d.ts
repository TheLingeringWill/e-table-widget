import type { Colors } from '../../types/index.js';
export type Cell<E extends Event> = {
    inMonth: boolean;
    isStartOfRange: boolean;
    isEndOfRange: boolean;
    day: number;
    date: Date;
    visible: boolean;
    isToday?: boolean;
    events: E[];
    isInNextMonth: boolean;
    isInPreviousMonth: boolean;
    isInRange: boolean;
    corner: 't-l' | 't-r' | 'b-l' | 'b-r' | null;
    attributes: Record<string, any>;
};
export type CalendarType = 'calendar' | 'calendar-range';
type Rows<E extends Event> = Row<E>[];
type Row<E extends Event> = {
    cells: Cell<E>[];
    events: (E & {
        isOverlappingPrevious: boolean;
        isOverlappingNext: boolean;
    })[];
};
export type Event = {
    start: Date;
    end: Date;
    color: Colors;
} | Record<string, any>;
type CalendarOptions<E extends Event | undefined, T extends CalendarType> = {
    minDate?: Date;
    maxDate?: Date;
    events: E[];
    disabledDates?: (Date | [Date, Date])[];
    weekStartsOnMonday: boolean;
    onChange?: (date: T extends 'calendar-range' ? [Date | null, Date | null] : Date | null) => void;
    view?: 'single' | 'double';
} & (T extends 'calendar-range' ? {
    type: 'calendar-range';
    value: [Date | null, Date | null] | null;
} : {
    type: 'calendar';
    value: Date | null;
});
export declare class CalendarState<E extends Event, T extends CalendarType> {
    type: T;
    view: 'single' | 'double';
    today: Date;
    events: E[];
    onChange: (date: T extends 'calendar-range' ? [Date | null, Date | null] : Date | null) => void;
    date: Date;
    selected: Date;
    currentMonth: number;
    currentMonthName: string;
    minDate: Date | null;
    maxDate: Date | null;
    nextMonthName: string;
    currentYear: number;
    nextYear: number;
    weekStartsOnMonday: boolean;
    rangeStart: Date | null;
    rangeEnd: Date | null;
    displayedMonthLabel: string;
    eventsMap: Record<string, E[]>;
    disabledDates: (Date | [Date, Date])[];
    disabledDatesMap: Map<string, boolean>;
    getCalendarRows: (date?: Date, weekStartsOnMonday?: boolean, isNextMonth?: boolean) => Rows<E>;
    setRange: (start: Date | null, end: Date | null) => void;
    rows: Rows<E>;
    nextMonthRows: Rows<E>;
    rangeComplete: Date | null;
    constructor(options: CalendarOptions<E, T>);
    goNextMonth: () => void;
    goPrevMonth: () => void;
    goToToday: () => void;
    cleanDate: (date: Date) => Date;
    calendar: (node: HTMLElement) => {
        destroy: () => void;
    };
}
export {};
