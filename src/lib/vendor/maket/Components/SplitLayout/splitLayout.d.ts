import type { Slot } from '../Slot/slot.js';
export type Length = `${number}px` | `${number}%` | `${number}em` | `${number}rem`;
export type Direction = 'horizontal' | 'vertical';
export type SplitPaneSlotProps = {
    size: number;
    position: number;
    id?: string;
    direction: Direction;
    index: number;
    pane: Pane;
};
export type Pane = {
    id?: string;
    direction?: Direction;
    render?: Slot<SplitPaneSlotProps>;
    class?: string;
    size: number;
    min?: number;
    collapsedSize?: number;
    collapsed?: boolean;
    max?: number;
    panes?: Pane[];
};
export type SplitLayoutProps = {
    direction?: Direction;
    disabled?: boolean;
    class?: string;
    paneClass?: string;
    panes: Pane[];
    pane?: Slot<SplitPaneSlotProps>;
};
export declare const splitLayout: (node: HTMLElement, { disabled, position, direction: dir, paneBefore, paneAfter }: {
    disabled: boolean;
    position: number;
    direction?: string;
    paneBefore: Pane;
    paneAfter: Pane;
}) => {
    update({ disabled, position, direction: dir, paneBefore, paneAfter }: {
        disabled: boolean;
        position: number;
        direction: string;
        paneBefore: Pane;
        paneAfter: Pane;
    }): void;
    destroy(): void;
};
export type SplitLayoutTheme = {
    base: string;
    pane: {
        base: string;
        collapsed: string;
        vertical: string;
        horizontal: string;
    };
    divider: {
        base: string;
        vertical: string;
        disabled: string;
        horizontal: string;
    };
};
export declare const splitLayoutComponent: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
