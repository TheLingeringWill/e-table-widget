import { type Snippet } from 'svelte';
import type { DialogState, DialogType } from './Components/Dialog/dialog.types.js';
import type { ToastPosition } from './Components/Toast/toast.js';
import type { Popover } from './Components/Popover/popover.state.svelte.js';
import type { BaseTransitionParams, TypedTransitionProps } from './transitions/transition.js';
import type { Placement } from '@floating-ui/dom';
import type { ColorsWithShades } from './plugin/palette.js';
type Theme_Options = {
    transitions?: BaseTransitionParams;
    defaultTheme: {
        colorScheme: string;
        name: string;
    };
    dialogTransitions?: TypedTransitionProps<DialogType, 'fso'>;
    toastTransitions?: TypedTransitionProps<ToastPosition, 'fso'>;
    popoverTransitions?: TypedTransitionProps<Placement, 'fso'>;
    dialog: {
        defaultDialogPrefix?: Snippet<[DialogState]>;
        defaultDialogSuffix?: Snippet<[DialogState]>;
    };
    snippets: {
        defaultWarningIcon?: Snippet<[{
            size: number;
        }]>;
        defaultInfoIcon?: Snippet<[{
            size: number;
        }]>;
        defaultSuccessIcon?: Snippet<[{
            size: number;
        }]>;
        defaultDangerIcon?: Snippet<[{
            size: number;
        }]>;
        defaultCloseIcon?: Snippet<[{
            size: number;
        }]>;
        defaultPlusIcon?: Snippet<[{
            size: number;
        }]>;
        defaultMinusIcon?: Snippet<[{
            size: number;
        }]>;
        defaultChevronDownIcon?: Snippet<[{
            size: number;
        }]>;
        defaultChevronUpIcon?: Snippet<[{
            size: number;
        }]>;
        defaultDotsIcon?: Snippet<[{
            size: number;
        }]>;
        defaultMenuIcon?: Snippet<[{
            size: number;
        }]>;
        defaultDocIcon?: Snippet<[{
            size: number;
        }]>;
        defaultEyeOpenIcon?: Snippet<[{
            size: number;
        }]>;
        defaultEyeCloseIcon?: Snippet<[{
            size: number;
        }]>;
        defaultChevronRightIcon?: Snippet<[{
            size: number;
        }]>;
        defaultCalendarIcon?: Snippet<[{
            size: number;
        }]>;
        defaultFileIcon?: Snippet<[{
            size: number;
        }]>;
    };
};
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export declare const create_theme_context: (opts?: Theme_Options) => {
    transitions: BaseTransitionParams;
    dialogTransitions?: TypedTransitionProps<DialogType, "fso">;
    toastTransitions?: TypedTransitionProps<ToastPosition, "fso">;
    popoverTransitions?: TypedTransitionProps<Placement, "fso">;
    preferReducesMotion: boolean;
    popovers: Popover[];
    dialogs: DialogState[];
    breakpoint: Breakpoint | null;
    bodyPadding: number;
    randomID: (type: string) => string;
    snippets: {
        defaultWarningIcon?: Snippet<[{
            size: number;
        }]>;
        defaultInfoIcon?: Snippet<[{
            size: number;
        }]>;
        defaultSuccessIcon?: Snippet<[{
            size: number;
        }]>;
        defaultDangerIcon?: Snippet<[{
            size: number;
        }]>;
        defaultCloseIcon?: Snippet<[{
            size: number;
        }]>;
        defaultPlusIcon?: Snippet<[{
            size: number;
        }]>;
        defaultMinusIcon?: Snippet<[{
            size: number;
        }]>;
        defaultChevronDownIcon?: Snippet<[{
            size: number;
        }]>;
        defaultChevronUpIcon?: Snippet<[{
            size: number;
        }]>;
        defaultDotsIcon?: Snippet<[{
            size: number;
        }]>;
        defaultMenuIcon?: Snippet<[{
            size: number;
        }]>;
        defaultDocIcon?: Snippet<[{
            size: number;
        }]>;
        defaultEyeOpenIcon?: Snippet<[{
            size: number;
        }]>;
        defaultEyeCloseIcon?: Snippet<[{
            size: number;
        }]>;
        defaultChevronRightIcon?: Snippet<[{
            size: number;
        }]>;
        defaultCalendarIcon?: Snippet<[{
            size: number;
        }]>;
        defaultFileIcon?: Snippet<[{
            size: number;
        }]>;
    };
    currentTheme: string | null;
    currentColorScheme: string | null;
    window: {
        width: number;
        height: number;
    };
    dialog: {
        add: (dialog: DialogState) => void;
        remove: (dialog: DialogState) => void;
    };
    toggleScroll: (lock: boolean) => void;
    setTheme: (theme: string, colorScheme: string) => void;
    getResponsiveProps: <T>(props: Partial<{
        xs: T;
        md: T;
        lg: T;
        xl: T;
        sm: T;
    }>, breakpoint: Breakpoint | null) => T;
    getBreakpoint: () => Breakpoint;
    getColor: (color: ColorsWithShades) => string | undefined;
};
export declare const use_theme: () => {
    transitions: BaseTransitionParams;
    dialogTransitions?: TypedTransitionProps<DialogType, "fso">;
    toastTransitions?: TypedTransitionProps<ToastPosition, "fso">;
    popoverTransitions?: TypedTransitionProps<Placement, "fso">;
    preferReducesMotion: boolean;
    popovers: Popover[];
    dialogs: DialogState[];
    breakpoint: Breakpoint | null;
    bodyPadding: number;
    randomID: (type: string) => string;
    snippets: {
        defaultWarningIcon?: Snippet<[{
            size: number;
        }]>;
        defaultInfoIcon?: Snippet<[{
            size: number;
        }]>;
        defaultSuccessIcon?: Snippet<[{
            size: number;
        }]>;
        defaultDangerIcon?: Snippet<[{
            size: number;
        }]>;
        defaultCloseIcon?: Snippet<[{
            size: number;
        }]>;
        defaultPlusIcon?: Snippet<[{
            size: number;
        }]>;
        defaultMinusIcon?: Snippet<[{
            size: number;
        }]>;
        defaultChevronDownIcon?: Snippet<[{
            size: number;
        }]>;
        defaultChevronUpIcon?: Snippet<[{
            size: number;
        }]>;
        defaultDotsIcon?: Snippet<[{
            size: number;
        }]>;
        defaultMenuIcon?: Snippet<[{
            size: number;
        }]>;
        defaultDocIcon?: Snippet<[{
            size: number;
        }]>;
        defaultEyeOpenIcon?: Snippet<[{
            size: number;
        }]>;
        defaultEyeCloseIcon?: Snippet<[{
            size: number;
        }]>;
        defaultChevronRightIcon?: Snippet<[{
            size: number;
        }]>;
        defaultCalendarIcon?: Snippet<[{
            size: number;
        }]>;
        defaultFileIcon?: Snippet<[{
            size: number;
        }]>;
    };
    currentTheme: string | null;
    currentColorScheme: string | null;
    window: {
        width: number;
        height: number;
    };
    dialog: {
        add: (dialog: DialogState) => void;
        remove: (dialog: DialogState) => void;
    };
    toggleScroll: (lock: boolean) => void;
    setTheme: (theme: string, colorScheme: string) => void;
    getResponsiveProps: <T>(props: Partial<{
        xs: T;
        md: T;
        lg: T;
        xl: T;
        sm: T;
    }>, breakpoint: Breakpoint | null) => T;
    getBreakpoint: () => Breakpoint;
    getColor: (color: ColorsWithShades) => string | undefined;
};
export {};
