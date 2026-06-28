import type { Snippet } from 'svelte';
import type { Slot, WithSlot } from '../Slot/slot.js';
import type { Actions } from '../../utils/actions.js';
export type CardProps<Payload extends Record<string, any> | undefined = undefined> = WithSlot<{
    ref?: HTMLDivElement;
    payload?: Payload;
    use?: Actions;
    title?: string | Snippet<Payload | undefined>;
    size?: 'small' | 'normal' | 'large';
    img?: Snippet<Payload | undefined> | {
        src?: string;
        alt?: string;
        loading?: 'lazy' | 'eager';
        width?: string;
        height?: string;
        class?: string;
        asBackground?: boolean;
    };
    class?: string;
    bodyClass?: string;
    mediaContainerClass?: string;
    disposition?: 'row' | 'column' | 'description' | 'rowReverse' | 'columnReverse' | 'overlay';
    children: Slot<Payload>;
    contentClass?: string;
    contentProps?: Record<string, any>;
}, 'actions' | 'title' | 'description' | 'header', Payload>;
export type CardPrimitiveProps = {
    classes: {
        card: string;
        body: string;
        mediaContainer: string;
        media: string;
        header: string;
        title: string;
        description: string;
        content: string;
        actions: string;
    };
};
type CardParts = {
    base: string;
    header: string;
    mediaContainer: string;
    media: string;
    title: string;
    body: string;
    content: string;
    description: string;
    actions: string;
};
export type CardTheme = {
    small: CardParts;
    large: CardParts;
    row: CardParts;
    rowReverse: CardParts;
    column: CardParts;
    columnReverse: CardParts;
    overlay: CardParts;
} & CardParts;
export declare const card: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export {};
