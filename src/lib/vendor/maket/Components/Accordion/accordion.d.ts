import type { Sizes } from '../../types/index.js';
import type { Slot, WithSlot } from '../Slot/slot.js';
import type { SlideTransitionProps } from '../../transitions/transition.js';
type AccordionVariant = 'classic' | 'card' | 'outlined';
export type AccordionProps<Item extends Record<string, any> | undefined = undefined> = WithSlot<{
    payload?: Item;
    icon?: 'chevron' | 'math' | Slot;
    class?: string;
    buttonClass?: string;
    isOpen?: boolean | null;
    onToggle?: (isOpen: boolean) => void;
    buttonContentClass?: string;
    size?: Sizes;
    variant?: AccordionVariant;
    transitions?: SlideTransitionProps;
}, 'actions' | 'icon' | 'title' | 'description' | 'content', Item>;
export type ConditionalKeys<Base, Condition> = NonNullable<{
    [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
}[keyof Base]>;
export type AccordionItem = Record<string, any> & {
    isOpen?: boolean | null;
};
export type AccordionGroupProps<Item extends AccordionItem | undefined = undefined> = Omit<AccordionProps<Item>, 'isOpen'> & {
    items: Item[];
    onToggle?: (otps: {
        item: AccordionItem;
        index: number;
        isOpen: boolean;
    }) => void;
    oneAtATime?: boolean;
    accordionClass?: string;
    titleKey?: ConditionalKeys<Item, Slot>;
    contentKey?: ConditionalKeys<Item, Slot>;
    descriptionKey?: ConditionalKeys<Item, Slot>;
    splitted?: boolean;
};
export type AccordionTheme = {
    base: string;
    actions: string;
    button: string;
    buttonContent: string;
    icon: string;
    title: string;
    description: string;
    content: string;
    small: Omit<AccordionTheme, 'small' | 'large'>;
    large: Omit<AccordionTheme, 'small' | 'large'>;
};
export type AccordionGroupTheme = {
    base: string;
    accordion: AccordionTheme;
    small: Omit<AccordionGroupTheme, 'small' | 'large'>;
    large: Omit<AccordionGroupTheme, 'small' | 'large'>;
    classic: Omit<AccordionGroupTheme, AccordionVariant>;
    card: Omit<AccordionGroupTheme, AccordionVariant>;
    outlined: Omit<AccordionGroupTheme, AccordionVariant>;
    splitted: Omit<AccordionGroupTheme, 'splitted'>;
};
export declare const accordion: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export declare const accordionGroup: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export {};
