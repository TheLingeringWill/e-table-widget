import type { Colors } from '../../types/index.js';
import type { WithSlot } from '../Slot/slot.js';
export type SeparatorProps = WithSlot<{
    class?: string;
    decorative?: boolean;
    orientation?: 'horizontal' | 'vertical';
    color?: Colors | 'border';
    size?: number;
}, 'children'>;
export type SeparatorTheme = {
    base: string;
    horizontal: string;
    vertical: string;
    label: string;
};
export declare const separator: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
