export type HeadingProps = {
    class?: string;
    children?: any;
    size?: `h${1 | 2 | 3 | 4 | 5 | 6}`;
    as?: `h${1 | 2 | 3 | 4 | 5 | 6}`;
    weight?: 'normal' | 'bold' | 'light';
    trim?: 'end' | 'both' | 'start' | 'none';
    align?: 'left' | 'center' | 'right';
    balanced?: boolean;
    underline?: boolean;
    muted?: boolean;
};
export type TextProps = {
    children: any;
    size?: 'small' | 'normal' | 'large';
    muted?: boolean;
    underline?: boolean;
    weight?: 'normal' | 'bold' | 'light';
    align?: 'left' | 'center' | 'right';
    italic?: boolean;
    uppercase?: boolean;
    lowercase?: boolean;
    capitalize?: boolean;
    lineClamp?: number;
    class?: string;
};
export type HeadingTheme = {
    base: string;
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
    muted: string;
    balanced: string;
    bold: string;
    light: string;
    center: string;
    right: string;
    left: string;
    underline: string;
};
export type TextTheme = {
    base: string;
    small: string;
    large: string;
    muted: string;
    underline: string;
    light: string;
    bold: string;
    italic: string;
    uppercase: string;
    lowercase: string;
    capitalize: string;
    lineClamp: string;
};
export declare const heading: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export declare const text: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
