import { untrack } from 'svelte';
export const useBinderFallback = (prop) => {
    let value = $state(prop());
    $effect(() => {
        const newState = prop();
        untrack(() => {
            value = newState;
        });
    });
    return {
        get value() {
            return value;
        },
        set value(newValue) {
            value = newValue;
        }
    };
};
export const binder = (...args) => {
    $effect(() => {
        const [value, setValue] = args[0]();
        untrack(() => {
            const [ref] = args[1]();
            if (ref !== value) {
                setValue(value);
            }
        });
    });
    $effect(() => {
        const [value, setValue] = args[1]();
        untrack(() => {
            const [ref] = args[0]();
            if (ref !== value) {
                setValue(value);
            }
        });
    });
};
