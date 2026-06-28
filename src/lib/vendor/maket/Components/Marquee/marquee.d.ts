import type { Snippet } from 'svelte';
import type { MaskProps } from '../../utils/mask.svelte.js';
export type MarqueeProps<Item> = {
    items: Item[];
    mask?: MaskProps;
    reverse?: boolean;
    speed?: 'fast' | 'normal' | 'slow' | number;
    pauseOnHover?: boolean;
    class?: string;
    listClass?: string;
    itemClass?: string;
    children: Snippet<Item>;
};
export type MarqueeTheme = {
    base: string;
    list: string;
    item: string;
    animation: {
        to: string;
    };
};
export declare const marquee: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
