type ToggleVariants = 'outline' | 'ghost' | 'small' | 'large' | 'normal';
export type ToggleBaseTheme = {
    base: string;
    selected: string;
    disabled: string;
    checked: string;
};
export type ToggleButtonTheme = ToggleBaseTheme & {
    [V in ToggleVariants]: ToggleBaseTheme;
};
export type ToggleGroupTheme = {
    base: string;
    toggleButton: ToggleButtonTheme;
};
export declare const toggleGroup: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export declare const toggleButton: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export {};
