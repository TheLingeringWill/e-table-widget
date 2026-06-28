import type { WithSlot } from '../../Slot/slot.js';
import type { ButtonProps } from '../../Button/button.js';
import type { FieldProps } from '../field.js';
import type { Snippet } from 'svelte';
import type { Cell, Event } from '../../Calendar/useCalendar.svelte.js';
export type CalendarPrimitiveProps<E extends Event, T extends 'calendar' | 'calendar-range'> = BaseCalendarProps<E> & (T extends 'calendar' ? {
    type: 'calendar';
    value?: Date | null;
    onChange?: (value: Date | null) => void;
} : {
    type: 'calendar-range';
    value?: [Date | null, Date | null] | null;
    onChange?: (value: [Date | null, Date | null] | null) => void;
});
export type BaseCalendarProps<E extends Event> = WithSlot<{
    events?: E[];
    weekStartsOnMonday?: boolean;
    minDate?: Date;
    maxDate?: Date;
    view?: 'single' | 'double';
    weekdayLength?: 'narrow' | 'short';
    disabledDates?: (Date | [Date, Date])[];
    containerClass?: string;
    dayClass?: string;
    weekdayClass?: string;
    gridClass?: string;
    cell?: Snippet<[Cell<Event>]>;
    buttons?: {
        prev: ButtonProps;
        next: ButtonProps;
    } | ButtonProps;
}, 'header', never>;
export type CalendarProps<E extends Event, T extends 'calendar' | 'calendar-range'> = CalendarPrimitiveProps<E, T> & Omit<FieldProps<T>, 'onChange' | 'children' | 'type' | 'suffixClass' | 'suffixProps' | 'prefixClass' | 'prefixProps' | 'prefix' | 'suffix'>;
export type CalendarTheme = {
    base: string;
    container: string;
    header: string;
    day: {
        base: string;
        selected: string;
        inMonth: string;
        inRange: string;
        today: string;
        disabled: string;
        endOfRange: string;
        startOfRange: string;
        isPast: string;
    };
    weekday: string;
    grid: string;
};
export declare const calendar: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
