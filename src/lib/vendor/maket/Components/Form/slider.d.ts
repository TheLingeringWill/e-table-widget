type SliderClassProps = {
    class?: string;
    thumbClass?: string;
    trackClass?: string;
    rangeClass?: string;
};
export type SliderProps = SliderClassProps & {
    min?: number;
    max?: number;
    step?: number;
    orientation?: 'horizontal' | 'vertical';
    direction?: 'left-to-right' | 'right-to-left';
    disabled?: boolean;
    value?: number | number[] | null;
    onChange?: (value: number | number[]) => void;
    width?: string;
};
export type SliderTheme = {
    base: string;
    track: string;
    range: string;
    thumb: string;
    vertical: {
        base: string;
        track: string;
        range: string;
    };
};
export declare const slider: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export {};
