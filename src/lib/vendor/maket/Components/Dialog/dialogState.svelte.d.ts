import type { DialogProps, DialogType } from './dialog.types.js';
import { type FSOParams } from '../../transitions/transition.js';
export type ModalTriggerEvent = CustomEvent<{
    id: string;
    open: boolean;
}>;
export interface ModalTriggerEventMap {
    ui_open_modal: ModalTriggerEvent;
}
export declare const registerModal: (id: string, toggle: (open: boolean) => void) => void;
type DialogStateProps = Pick<DialogProps, 'type' | 'size' | 'transition'>;
export declare class DialogState {
    props: DialogStateProps | undefined;
    isOpen: boolean;
    theme: {
        transitions: import("../../transitions/transition.js").BaseTransitionParams;
        dialogTransitions?: import("../../transitions/transition.js").TypedTransitionProps<DialogType, "fso">;
        toastTransitions?: import("../../transitions/transition.js").TypedTransitionProps<import("../Toast/toast.js").ToastPosition, "fso">;
        popoverTransitions?: import("../../transitions/transition.js").TypedTransitionProps<import("@floating-ui/dom").Placement, "fso">;
        preferReducesMotion: boolean;
        popovers: import("../Popover/popover.state.svelte.js").Popover[];
        dialogs: DialogState[];
        breakpoint: ("xs" | "md" | "lg" | "xl" | "sm") | null;
        bodyPadding: number;
        randomID: (type: string) => string;
        snippets: {
            defaultWarningIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultInfoIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultSuccessIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultDangerIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultCloseIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultPlusIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultMinusIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultChevronDownIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultChevronUpIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultDotsIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultMenuIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultDocIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultEyeOpenIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultEyeCloseIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultChevronRightIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultCalendarIcon?: import("svelte").Snippet<[{
                size: number;
            }]>;
            defaultFileIcon?: import("svelte").Snippet<[{
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
        }>, breakpoint: ("xs" | "md" | "lg" | "xl" | "sm") | null) => T;
        getBreakpoint: () => "xs" | "md" | "lg" | "xl" | "sm";
        getColor: (color: import("../../index.js").ColorsWithShades) => string | undefined;
    };
    parent: DialogState | null;
    stack: DialogState[];
    hasTransitioned: boolean;
    element: HTMLDialogElement | null;
    id: string;
    type: DialogType;
    transition: {
        in: FSOParams;
        out: FSOParams;
    };
    isLast: boolean;
    isLastOfStack: boolean;
    toggle: (value: boolean) => void;
    open: () => void;
    close: () => void;
    constructor(customId: string | undefined, props: () => DialogStateProps);
}
export {};
