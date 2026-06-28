import { type TransitionParams } from '../../transitions/transition.js';
import type { WithSlot } from '../Slot/slot.js';
import type { SeparatorProps } from '../Separator/separator.js';
import type { NestedPopoverProps, PopoverProps } from '../Popover/popover.js';
export type MenuBarProps = {
    animation?: TransitionParams;
    offset?: number;
    loop?: boolean;
    items: (Omit<MenuProps, 'depth' | 'closeOnClick'> & {
        label: string;
    })[];
    closeOnClick?: boolean;
    closeOnEsc?: boolean;
    lockScroll?: boolean;
    menuClass?: string;
    menuItemClass?: string;
};
export type DropdownMenuProps = MenuProps & NestedPopoverProps & Pick<PopoverProps, 'trigger' | 'triggerProps'>;
export type MenuProps = {
    popover?: NestedPopoverProps;
    items: MenuItem[];
};
export type MenuItemBase = WithSlot<{
    disabled?: boolean;
    closeOnClick?: boolean;
    class?: string;
}, 'suffix' | 'prefix' | 'label', undefined>;
export type MenuItem = ButtonItem | ToggleItem | SeparatorItem | SubMenuItem | GroupItem;
export type ButtonItem = {
    type: 'button';
    onClick?: () => void;
} & MenuItemBase;
export type ToggleItem = {
    type: 'checkbox' | 'switch';
    value?: boolean;
    onChange?: (value: boolean) => void;
} & MenuItemBase;
export type SeparatorItem = {
    type: 'separator';
} & SeparatorProps;
export type SubMenuItem = {
    type: 'menu';
} & MenuProps & MenuItemBase;
export type GroupItem = WithSlot<{
    type: 'group';
    disabled?: boolean;
    class?: string;
    items: MenuItem[];
}, 'label'> & Omit<SeparatorProps, 'children' | 'childrenProps' | 'class'>;
export type MenuTheme = {
    base: string;
    item: string;
    disabled: string;
    separator: string;
    group: string;
    groupLabel: string;
};
export declare const menu: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
