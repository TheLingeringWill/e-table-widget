import type { CardProps } from '../Card/card.js';
import type { PopoverProps } from '../Popover/popover.js';
type HoverCardParts = {
    parent0: string;
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
export type HoverCardTheme = {
    small: HoverCardParts;
    large: HoverCardParts;
    row: HoverCardParts;
    rowReverse: HoverCardParts;
    column: HoverCardParts;
    columnReverse: HoverCardParts;
    overlay: HoverCardParts;
} & HoverCardParts;
export declare const hoverCard: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export type HoverCardProps = Omit<PopoverProps, 'children' | 'float' | 'on'> & CardProps;
export {};
