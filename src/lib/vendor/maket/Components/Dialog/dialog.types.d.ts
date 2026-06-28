import { type ResponsiveProps } from '../../types/index.js';
import type { Snippet } from 'svelte';
import type { WithSlot } from '../Slot/slot.js';
import type { FSOProps } from '../../transitions/transition.js';
import type { DialogState } from './dialogState.svelte.js';
export type { DialogState };
export type DialogContext = Record<string, [DialogState]>;
export type DialogType = 'modal' | 'drawer-right' | 'drawer-left' | 'drawer-top' | 'drawer-bottom' | 'alert' | 'full-screen';
export type DialogProps = WithSlot<{
    id?: string;
    isOpen?: boolean;
    onClose?: (dialog: DialogState) => void;
    onOpen?: (dialog: DialogState) => void;
    children?: Snippet<[{
        payload: DialogState;
    }]>;
    closeOnClickOutside?: boolean;
    closeOnEscape?: boolean;
    closable?: boolean;
    type?: ResponsiveProps<DialogType>;
    size?: 's' | 'default' | 'l';
    overlayClass?: string;
    containerClass?: string;
    contentClass?: string;
    transition?: FSOProps;
}, 'footer' | 'title' | 'description' | 'header' | 'trigger' | 'closeButton', DialogState>;
type BaseDialogTheme = {
    base: string;
    container: string;
    content: string;
    footer: string;
    title: string;
    description: string;
    header: string;
    trigger: string;
    closeButton: string;
};
export type DialogTheme = BaseDialogTheme & Record<DialogType, BaseDialogTheme>;
export declare const dialog: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
