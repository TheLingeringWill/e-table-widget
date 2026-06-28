import { untrack } from 'svelte';
export const useClickOutside = (opts) => {
    const actionRefs = $state([]);
    const handleClick = (e) => {
        let inRef = false;
        if (opts.isActive) {
            const path = e.composedPath();
            path.forEach((node) => {
                (opts.refs || []).concat(actionRefs).forEach((ref) => {
                    if (ref instanceof Node && node instanceof Node && ref?.isSameNode(node)) {
                        inRef = true;
                    }
                });
            });
            if (!inRef) {
                opts.callback();
            }
        }
    };
    $effect(() => {
        if (opts.isActive) {
            document.addEventListener('click', untrack(() => handleClick));
        }
        else {
            document.removeEventListener('click', untrack(() => handleClick));
        }
        return () => {
            document.removeEventListener('click', untrack(() => handleClick));
        };
    });
    return {
        ref: (node) => {
            if (node) {
                actionRefs.push(node);
            }
        }
    };
};
