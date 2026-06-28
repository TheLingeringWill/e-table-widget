import type { FieldProps } from '../field.js';
export type TextInputProps = {
    type?: 'text' | 'email';
    value?: string | null;
    placeholder?: string;
} & Omit<FieldProps<'text'>, 'children' | 'type'>;
export type TextInputTheme = {
    base: string;
    container: string;
};
export declare const textInput: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
