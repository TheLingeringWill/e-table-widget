import { use_theme } from '../../theme.svelte.js';
import { getContext, onMount, setContext } from 'svelte';
import { defaultFsoParams } from '../../transitions/transition.js';
export const registerModal = (id, toggle) => {
    onMount(() => {
        const onMessage = (e) => {
            if (e.detail.id === id) {
                toggle(e.detail.open);
            }
        };
        document.addEventListener('ui_open_modal', onMessage);
        return () => {
            document.removeEventListener('ui_open_modal', onMessage);
        };
    });
};
export class DialogState {
    props = $state();
    isOpen = $state(false);
    theme = use_theme();
    parent = getContext('dialog');
    stack = $state([]);
    hasTransitioned = $state(false);
    element = $state(null);
    id = $state(this.theme.randomID('dialog'));
    type = $derived.by(() => {
        return typeof this.props?.type === 'string'
            ? this.props.type
            : this.theme.getResponsiveProps(this.props?.type || {
                xs: 'modal'
            }, this.theme.breakpoint);
    });
    transition = $derived.by(() => {
        const globalTransitions = this.theme.dialogTransitions;
        const base = globalTransitions?.[this.type] || defaultFsoParams;
        return {
            in: 'in' in base ? base.in : base,
            out: 'out' in base ? base.out : base
        };
    });
    isLast = $derived.by(() => {
        const openedDialogs = this.theme.dialogs.filter((d) => d.isOpen);
        const childOpen = this.stack.filter((d) => d.isOpen);
        return (openedDialogs.length === 1 && openedDialogs.at(0)?.id === this.id && childOpen.length === 0);
    });
    isLastOfStack = $derived.by(() => {
        if (!this.parent) {
            return false;
        }
        else {
            return (this.parent.stack.filter((d) => d.isOpen).length === 1 &&
                this.parent.stack.at(-1)?.id === this.id);
        }
    });
    toggle = (value) => {
        this.isOpen = value;
    };
    open = () => {
        this.isOpen = true;
    };
    close = () => {
        this.isOpen = false;
    };
    constructor(customId, props) {
        this.props = props();
        if (customId) {
            this.id = customId;
            registerModal(customId, this.toggle);
        }
        $effect(() => {
            this.props = props();
        });
        setContext('dialog', this);
        onMount(() => {
            if (this.parent) {
                this.parent.stack.push(this);
                return () => {
                    if (this.parent) {
                        this.parent.stack = this.parent.stack.filter((d) => d.id !== this.id);
                    }
                };
            }
            else {
                this.theme.dialog.add(this);
                return () => {
                    this.theme.dialog.remove(this);
                };
            }
        });
    }
}
