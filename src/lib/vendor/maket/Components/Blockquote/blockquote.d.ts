import type { Colors, Sizes } from '../../types/index.js';
import type { Snippet } from 'svelte';
export type BlockquoteProps = {
    color?: Colors;
    class?: string;
    children?: Snippet | string;
    description?: Snippet | string;
    size?: Sizes;
    contentClass?: string;
    descriptionClass?: string;
};
export type BlockquoteTheme = {
    base: string;
    content: string;
    description: string;
    large: Omit<BlockquoteTheme, 'large' | 'small'>;
    small: Omit<BlockquoteTheme, 'large' | 'small'>;
};
export declare const blockquote: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
