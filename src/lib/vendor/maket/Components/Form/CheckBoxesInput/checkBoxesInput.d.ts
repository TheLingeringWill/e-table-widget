import type { Slot } from '../../Slot/slot.js';
import type { BaseOption, FieldProps } from '../field.js';
export type RadiosOption = BaseOption & {
    icon?: Slot;
    iconProps?: Record<string, any>;
};
export type CheckBoxesInputProps<T extends RadiosOption = RadiosOption> = {
    value?: string[] | null;
    mode?: 'card' | 'normal';
    options: T[];
} & Omit<FieldProps<'checkboxes'>, 'children' | 'type'>;
export type CheckBoxesInputItemTheme = {
    base: string;
    label: string;
    description: string;
    check: string;
    checked: Omit<CheckBoxesInputItemTheme, 'checked'>;
};
export type CheckBoxesInputTheme = {
    base: string;
    item: CheckBoxesInputItemTheme;
    card: Omit<CheckBoxesInputTheme, 'card'>;
};
export declare const checkBoxesInput: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
