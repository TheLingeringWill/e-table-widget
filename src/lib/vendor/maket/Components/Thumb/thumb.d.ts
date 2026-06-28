import { type Colors, type Easing } from '../../types/index.js';
type ThumbVariants = 'ghost' | 'solid' | 'outline' | 'underline';
export type ThumbProps = {
    activeAttribute?: string;
    active?: boolean;
    class?: string;
    mode?: 'passive' | 'active' | 'both';
    activeClass?: string;
    duration?: number;
    easing?: Easing;
    passiveClass?: string;
    activeTargetClass?: string;
    passiveTargetClass?: string;
    inactiveTargetClass?: string;
    as?: string;
    accessibleTextOnSolid?: boolean;
    targetSelector?: string;
    color?: Colors | 'border' | 'background' | 'muted' | {
        passive?: Colors | 'border' | 'muted';
        active?: Colors | 'border' | 'muted';
    };
    variant?: ThumbVariants | {
        passive?: ThumbVariants;
        active?: ThumbVariants;
    };
    onChange?: (mode: 'passive' | 'active', currentTarget: HTMLElement) => void;
};
type ThumbIndicatorTheme = {
    base: string;
    visible: string;
    active: string;
    passive: string;
};
type ThumbVariantTheme = {
    ghost: ThumbIndicatorTheme;
    solid: ThumbIndicatorTheme;
    outline: ThumbIndicatorTheme;
    underline: ThumbIndicatorTheme;
};
type FullThumbIndicatorTheme = ThumbIndicatorTheme & ThumbVariantTheme;
export type ThumbTheme = {
    base: string;
    indicator: FullThumbIndicatorTheme;
    target: {
        active: {
            base: string;
        } & ThumbVariantTheme;
        passive: {
            base: string;
        } & ThumbVariantTheme;
    };
};
export declare const thumb: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export {};
