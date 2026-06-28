import { tick } from 'svelte';
export const useFocusTrap = (opts) => {
    let focusableEls = $state([]);
    const findFirstFocusableEl = () => {
        const input = focusableEls.find((el) => el.tagName === 'INPUT');
        return input || focusableEls[0] || null;
    };
    const firstFocusableEl = $derived.by(findFirstFocusableEl);
    const setFocusableEls = () => {
        focusableEls = Array.from(opts.isActive && opts.node
            ? opts.node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]')
            : []);
    };
    let mutationObserver;
    const moveFocus = (e) => {
        if (e.key === 'Tab' ||
            e.key === 'ArrowDown' ||
            e.key === 'ArrowUp' ||
            e.key === 'ArrowLeft' ||
            e.key === 'ArrowRight') {
            const direction = e.shiftKey || e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? 'backward' : 'forward';
            if (document.activeElement &&
                e.key !== 'Tab' &&
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                return;
            }
            e.preventDefault();
            const nextIndex = focusableEls.indexOf(document.activeElement) +
                (direction === 'forward' ? 1 : -1);
            const nextFocusableEl = direction === 'forward'
                ? nextIndex === focusableEls.length
                    ? firstFocusableEl
                    : focusableEls[nextIndex]
                : nextIndex === -1
                    ? focusableEls[focusableEls.length - 1]
                    : focusableEls[nextIndex];
            nextFocusableEl?.focus();
        }
    };
    $effect(() => {
        if (opts.isActive && opts.node) {
            window.addEventListener('keydown', moveFocus);
            setFocusableEls();
            if (!mutationObserver) {
                mutationObserver = new MutationObserver(setFocusableEls);
            }
            mutationObserver?.observe(opts.node, { childList: true, subtree: true });
            tick().then(() => firstFocusableEl?.focus());
        }
        else {
            window.removeEventListener('keydown', moveFocus);
            mutationObserver?.disconnect();
        }
    });
};
