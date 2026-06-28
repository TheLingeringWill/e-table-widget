import type { Colors } from '../types/index.ts/theme.js';
export type LoaderOptions = {
    loading?: boolean;
    class?: string;
    color?: Colors;
    size?: number;
};
export declare const loader: (node: HTMLElement, opts: LoaderOptions) => {
    update(opts: LoaderOptions): void;
    destroy(): void;
};
