import { type FieldProps, type InputType, type InputTypeToTsType } from './field.js';
export declare class FieldState<T extends InputType> {
    #private;
    options: FieldStateOptions<T>;
    element: HTMLInputElement | HTMLTextAreaElement | null;
    get value(): InputTypeToTsType<T> | null;
    set value(newValue: InputTypeToTsType<T> | null);
    initialValue: InputTypeToTsType<T> | null;
    errors: string[];
    id: string;
    name: string;
    type: T;
    required: boolean;
    validationFunction: FieldStateOptions<T>['validate'];
    constructor(options: FieldStateOptions<T>);
    validate: () => boolean;
    reset: () => void;
}
type FieldStateOptions<T extends InputType> = {
    type: T;
    value: InputTypeToTsType<T> | null;
    id?: string;
    required?: boolean;
    name?: string;
    onChange?: (value: InputTypeToTsType<T> | null, state: FieldState<T>) => void;
    validate?: FieldProps<T>['validate'];
};
export declare const useField: <T extends InputType>(opts: FieldStateOptions<T>) => FieldState<T>;
export {};
