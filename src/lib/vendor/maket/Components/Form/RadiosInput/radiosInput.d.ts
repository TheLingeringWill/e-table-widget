import type { Slot } from '../../Slot/slot.js';
import type { BaseOption, FieldProps } from '../field.js';
export type RadiosOption = BaseOption & {
    icon?: Slot;
    iconProps?: Record<string, any>;
};
export type RadiosInputProps<T extends RadiosOption = RadiosOption> = {
    value?: string | null;
    mode?: 'card' | 'normal';
    options: T[];
} & Omit<FieldProps<'radios'>, 'children' | 'type'>;
export type RadiosInputItemTheme = {
    base: string;
    label: string;
    description: string;
    thumb: string;
    track: string;
    checked: Omit<RadiosInputItemTheme, 'checked'>;
};
export type RadiosInputTheme = {
    base: string;
    item: RadiosInputItemTheme;
    card: Omit<RadiosInputTheme, 'card'>;
};
export declare const radiosInput: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
