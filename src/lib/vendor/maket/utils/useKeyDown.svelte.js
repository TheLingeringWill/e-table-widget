export const useKeyDown = (opts) => {
    const eventCallback = (event) => {
        if (opts.keys.includes(event.key)) {
            event.preventDefault();
            opts.callback();
        }
    };
    $effect(() => {
        if (opts.isActive) {
            window.addEventListener('keydown', eventCallback);
        }
        else {
            window.removeEventListener('keydown', eventCallback);
        }
    });
};
