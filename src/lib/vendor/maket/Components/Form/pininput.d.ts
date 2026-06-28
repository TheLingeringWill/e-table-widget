type PinInputClassProps = {
    class?: string;
    inputClass?: string;
};
export type PinInputProps = PinInputClassProps & {
    placeholder?: string;
    length?: number;
    value?: string;
    disabled?: boolean;
    hideCharacters?: boolean;
    type: 'text' | 'digits';
    onChange?: (value: string) => void;
    onFilled?: (value: string) => void;
};
export type PinInputTheme = {
    base: string;
    input: string;
};
export declare const pininput: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export {};
