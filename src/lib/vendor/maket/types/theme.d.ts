import type { Colors, PaletteInput } from '../plugin/palette.js';
import type { ComponentsSystem } from '../plugin/components.js';
import type { CSSRuleObject } from 'tailwindcss/types/config.js';
import type { Spinner } from '../plugin/spinnner.js';
export type { Colors };
export type FontSize = `fontSize.${'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'DEFAULT'}`;
export type ColorKeys = `${'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'contrast' | 'surface'}.${'light' | 'lighter' | 'DEFAULT' | 'fg' | 'dark'}`;
export type ColorPath = `colors.${ColorKeys}`;
export type ThemePaths = ColorPath | FontSize | (string & {});
export type ThemeFunction = (paths: ThemePaths) => string;
export type Styles = Partial<CSSStyleDeclaration & {
    textWrap: string;
}>;
export type CSS<P extends string | undefined = undefined> = P extends string ? Partial<Styles & {
    '&:hover': CSSRuleObject;
    '&:hocus': CSSRuleObject;
    '&:active': CSSRuleObject;
    '&:disabled': CSSRuleObject;
    '&[data-loading="true"]': CSSRuleObject;
}> : Partial<CSSRuleObject & {
    '&:hover': CSSRuleObject;
    '&:hocus': CSSRuleObject;
    '&:active': CSSRuleObject;
    '&:disabled': CSSRuleObject;
    '&[data-loading="true"]': CSSRuleObject;
}> & CSSRuleObject;
export declare const deepMerge: <T>(a?: Partial<T>, b?: Partial<T>) => T;
export type Theme = {
    radius: number;
    shadows?: any;
} & PaletteInput;
export type Themes = Record<string, Theme>;
export type DesignSystem = {
    themes: Themes;
    components: ComponentsSystem;
    spinner?: Spinner;
};
export type Sizes = 'small' | 'normal' | 'large';
export type ResponsiveProps<T> = T | Partial<{
    [breakpoint in 'xs' | 'sm' | 'md' | 'lg' | 'xl']: T;
}>;
export type Easing = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
