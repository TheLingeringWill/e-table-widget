import type { Sizes } from '../../types/index.js';
import type { Snippet } from 'svelte';
import type { WithSlot } from '../Slot/slot.js';
import type { ThumbProps } from '../Thumb/thumb.js';
export type TabsProps<Item> = WithSlot<{
    items: Item[];
    class?: string;
    listClass?: string;
    activeTab?: number;
    triggerClass?: string;
    contentClass?: string;
    headerClass?: string;
    triggerLabelKey?: keyof Item;
    trigger?: Snippet<[{
        item: Item;
    }]>;
    tab: Snippet<[{
        item: Item;
    }]>;
    size?: Sizes;
    mode?: Mode;
    onTabChange?: (item: Item) => void;
    thumb?: ThumbProps | false;
}, 'prefix' | 'suffix', {
    item: Item;
}>;
type Mode = 'tucked-start' | 'tucked-end' | 'tucked-center' | 'full-width';
export type TabsTheme = {
    base: string;
    header: string;
    prefix: string;
    suffix: string;
    list: string;
    trigger: string;
    tab: string;
} & {
    [K in Mode]: Omit<TabsTheme, Mode>;
};
export declare const tabs: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export {};
