import type { WithSlot } from '../../../Components/Slot/slot.js';
import type { FieldProps } from '../field.js';
import type { FileDropzone } from './fileDropzone.svelte.js';
export type FilePreviewPayload = {
    file: File;
    index: number;
    remove: () => void;
    size: string;
};
export type FileInputProps<InputType extends 'files' | 'file', Value = InputType extends 'files' ? File[] | null : File | null> = WithSlot<WithSlot<WithSlot<{
    types?: string[];
    value?: Value;
    maxFiles?: number;
    maxSize?: number;
    clickable?: boolean;
    mode?: InputType extends 'files' ? 'multiple' : 'single';
    onChange?: (value: Value) => void;
}, 'placeholder', {
    value: Value;
}>, 'fileList', FileDropzone>, 'file', FilePreviewPayload> & Omit<FieldProps<InputType>, 'children' | 'type' | 'suffix' | 'suffixProps' | 'suffixClass'>;
export type FileInputTheme = {
    base: string;
    placeholder: string;
    fileList: string;
    fileInfo: string;
    fileName: string;
    fileSize: string;
    file: string;
    valid: string;
    invalid: string;
    potential: string;
    clickable: string;
};
export declare const fileInput: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
