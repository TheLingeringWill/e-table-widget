import type { Snippet } from 'svelte';
import type { ThumbProps } from '../Thumb/thumb.js';
import type { WithSlot, Slot } from '../Slot/slot.js';
import type { MenuProps } from '../Menus/menus.js';
export type ItemBase<T extends Record<string, any> | undefined> = WithSlot<{
    disabled?: boolean;
    active?: boolean;
    href?: string;
    label: Slot<T>;
    onClick?: () => void;
}, 'icon', T> & Partial<MenuProps>;
export type BreadcrumbsProps<T extends Record<string, any> | undefined> = WithSlot<{
    items: (ItemBase<T> & T)[];
    thumb?: ThumbProps | false;
    type?: 'default' | 'menu';
    children?: Snippet<[ItemBase<T> & T]>;
    showSeparator?: boolean;
}, 'item' | 'separator', T>;
export type BreadcrumbsTheme = {
    base: string;
    separator: string;
    item: {
        base: string;
        disabled: string;
    };
};
export declare const breadcrumbs: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
