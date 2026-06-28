export type BadgeTheme = {
    parent: string;
    base: string;
    large: {
        base: string;
    } & Pick<BadgeTheme, 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'>;
    small: {
        base: string;
    } & Pick<BadgeTheme, 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'>;
    outlined: string;
    solid: string;
    ghost: string;
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
};
export declare const badge: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
