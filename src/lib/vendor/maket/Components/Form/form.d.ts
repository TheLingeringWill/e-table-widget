import type { MaybePromise } from '@sveltejs/kit';
import type { SwitchInputProps } from './Switch/swtich.js';
import type { TextInputProps } from './TextInput/textInput.js';
import type { InputTypeToTsType, BaseOption } from './field.js';
import type { TextAreaProps } from './TextArea/textarea.js';
import type { SelectProps } from './Select/select.js';
import type { Get } from 'type-fest';
import type { NumberInputProps } from './NumberInput/numberInput.js';
import type { ColorInputProps } from './ColorInput/colorInput.js';
import type { TagInputProps } from './TagInput/tagInput.js';
import type { DateInputProps } from './DateInput/dateInput.js';
import type { CalendarProps } from './Calendar/calendarInput.js';
import type { RadiosInputProps } from './RadiosInput/radiosInput.js';
import type { CalendarType } from '../Calendar/useCalendar.svelte.js';
import type { FileInputProps } from './File/fileInput.js';
import type { CheckBoxesInputProps } from './CheckBoxesInput/checkBoxesInput.js';
export type FormInputs = Record<string, FormInput>;
export type FormInput = ({
    type: 'text' | 'email';
} & TextInputProps) | ({
    type: 'switch';
} & SwitchInputProps) | ({
    type: 'textarea';
} & TextAreaProps) | ({
    type: 'select';
} & SelectProps<BaseOption>) | ({
    type: 'color';
} & ColorInputProps) | ({
    type: 'tag';
} & TagInputProps) | ({
    type: 'date' | 'datetime';
} & DateInputProps) | ({
    type: CalendarType;
} & CalendarProps<any, CalendarType>) | ({
    type: 'number';
} & NumberInputProps) | ({
    type: 'file';
} & FileInputProps<'file'>) | ({
    type: 'files';
} & FileInputProps<'files'>) | ({
    type: 'radios';
} & RadiosInputProps) | ({
    type: 'checkboxes';
} & CheckBoxesInputProps);
type ExtractOptionType<O extends BaseOption[]> = O[number]['value'];
type InputType<T extends FormInput> = Get<T, 'options'> extends BaseOption[] ? ExtractOptionType<Get<T, 'options'>> : InputTypeToTsType<T['type']>;
export type InferFormValue<T extends FormInputs> = {
    [K in keyof T]: T[K]['required'] extends true ? NonNullable<InputType<T[K]>> : InputType<T[K]> | null;
};
export type FormSubmitHandler<T extends FormInputs> = (value: InferFormValue<T>) => MaybePromise<any | void>;
export type FormOptions<I extends FormInputs, S extends FormSubmitHandler<I> = FormSubmitHandler<I>> = {
    inputs: I;
    onSubmit: S;
    value?: InferFormValue<I>;
};
export type FormTheme = {
    base: string;
};
export type FormFieldTheme = {
    base: string;
    header: string;
    footer: string;
    label: string;
    helper: string;
    actions: string;
    description: string;
    error: string;
    loading: string;
    disabled: string;
    inputContainer: string;
    textInput: {
        base: string;
    };
};
export declare const form: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export declare const field: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export {};
