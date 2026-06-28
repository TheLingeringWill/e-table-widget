import type { Snippet } from 'svelte';
import type { DialogState, DialogType } from './Dialog/dialog.types.js';
import type { ToastPosition } from './Toast/toast.js';
import type { BaseTransitionParams, TypedTransitionProps } from '../transitions/transition.js';
import type { Placement } from '@floating-ui/dom';
type $$ComponentProps = {
    defaultTheme?: {
        colorScheme: string;
        name: string;
    };
    data?: any;
    children: Snippet;
    transitions?: BaseTransitionParams;
    defaultDialogSuffix?: Snippet<[DialogState]>;
    defaultDialogPrefix?: Snippet<[DialogState]>;
    dialogTransitions?: TypedTransitionProps<DialogType, 'fso'>;
    toastTransitions?: TypedTransitionProps<ToastPosition, 'fso'>;
    popoverTransitions?: TypedTransitionProps<Placement, 'fso'>;
};
declare const Theme: import("svelte").Component<$$ComponentProps, {}, "">;
type Theme = ReturnType<typeof Theme>;
export default Theme;
