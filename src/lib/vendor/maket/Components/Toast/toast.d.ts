import type { Snippet } from 'svelte';
import type { Colors, ResponsiveProps, Sizes } from '../../types/index.js';
import type { Toast } from './toast.state.svelte.js';
import type { TransitionParams } from '../../transitions/transition.js';
import type { Slot } from '../Slot/slot.js';
import type { Timer } from '../../utils/timer.svelte.js';
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
type CommonOptions = {
    size?: Sizes;
    closeOnClick?: boolean;
    showCloseIcon?: boolean;
    duration?: number | false;
    dismissible?: boolean;
    richColors?: boolean;
    prefix?: Slot | false;
    suffix?: Slot;
    closeIcon?: Slot;
    animation?: TransitionParams & Partial<Record<ToastPosition, TransitionParams>>;
};
export type ToastProps = {
    collapseHorizontalAxis?: ResponsiveProps<boolean>;
    expand?: boolean;
    visibleToasts?: number;
    gap?: number;
    offset?: number;
    direction?: 'ltr' | 'rtl';
    position?: ResponsiveProps<ToastPosition>;
    perspectiveAmount?: number;
} & ToastClasses & CommonOptions;
export type ToastOptions = {
    loading?: boolean;
    title?: Snippet | string;
    description?: Snippet | string;
    color: Colors;
    id: string;
    size?: 'small' | 'normal' | 'large';
    important?: boolean;
    icon?: string;
    onClose?: (toast: Toast) => void;
    onOpen?: (toast: Toast) => void;
    onAutoClose?: (toast: Toast) => void;
    position: ToastPosition;
} & ToastClasses & CommonOptions;
export type ToastState = ToastOptions & {
    close: () => void;
    height: number;
    update: (callback: (state: ToastState) => void) => void;
    timer?: Timer;
    element?: HTMLElement;
    index: number;
};
type ToastClasses = {
    class?: string;
    closeClass?: string;
    prefixClass?: string;
    contentClass?: string;
    titleClass?: string;
    descriptionClass?: string;
    suffixClass?: string;
};
type ToastStructure = {
    base: string;
    title: string;
    description: string;
    content: string;
    suffix: string;
    prefix: string;
    close: string;
};
export type ToastTheme = {
    danger: ToastStructure;
    info: ToastStructure;
    success: ToastStructure;
    warning: ToastStructure;
    primary: ToastStructure;
    richColors: ToastStructure;
} & ToastStructure;
export declare const toast: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export {};
