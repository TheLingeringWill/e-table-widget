declare global {
    interface Document {
        addEventListener<K extends keyof ModalTriggerEventMap>(type: K, listener: (this: Document, ev: ModalTriggerEventMap[K]) => void): void;
        dispatchEvent<K extends keyof ModalTriggerEventMap>(ev: ModalTriggerEventMap[K]): void;
        removeEventListener<K extends keyof ModalTriggerEventMap>(type: K, listener: (this: Document, ev: ModalTriggerEventMap[K]) => void): void;
    }
}
export declare const toggleModal: (id: string, open: boolean) => void;
import type { DialogProps } from './dialog.types.js';
import { type ModalTriggerEventMap } from './dialogState.svelte.js';
declare const Dialog: import("svelte").Component<DialogProps, {}, "isOpen">;
type Dialog = ReturnType<typeof Dialog>;
export default Dialog;
