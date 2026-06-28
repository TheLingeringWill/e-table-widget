import type { Colors, Sizes } from '../../types/theme.js';
import type { WithSlot } from '../Slot/slot.js';
export type ChipProps = WithSlot<{
    class?: string;
    color?: Colors;
    size?: Sizes;
    variant?: 'solid' | 'outline' | 'soft';
    href?: string;
    target?: string;
    rel?: string;
    onclick?: (event: MouseEvent) => void;
    iconPosition?: 'right' | 'left';
}, 'children' | 'suffix' | 'prefix', any>;
export type ChipTheme = {
    base: string;
    prefix: string;
    suffix: string;
    small: {
        base: string;
        prefix: string;
        suffix: string;
    };
    large: {
        base: string;
        prefix: string;
        suffix: string;
    };
    outline: string;
    soft: string;
};
export declare const chip: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
