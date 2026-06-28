import { type Colors, type Sizes } from '../../types/index.js';
import type { Snippet } from 'svelte';
import type { WithSlot } from '../Slot/slot.js';
export type CalloutProps = WithSlot<{
    color?: Colors;
    variant?: 'solid' | 'outline' | 'soft';
    icon?: Snippet | false;
    class?: string;
    size?: Sizes;
    contentClass?: string;
    titleClass?: string;
    iconClass?: string;
    descriptionClass?: string;
    actionsClass?: string;
}, 'title' | 'description' | 'suffix', never>;
export type CalloutTheme = {
    base: string;
    solid: string;
    outline: string;
    soft: string;
    title: string;
    description: string;
    actions: string;
    icon: string;
    content: string;
    large: {
        base: string;
        icon: string;
        title: string;
        description: string;
        actions: string;
        content: string;
    };
    small: {
        base: string;
        icon: string;
        title: string;
        description: string;
        actions: string;
        content: string;
    };
};
export declare const callout: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
