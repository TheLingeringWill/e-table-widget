import { use_theme } from '../../theme.svelte.js';
import { getContext, hasContext, setContext, tick, untrack } from 'svelte';
import {} from './field.js';
export class FieldState {
    options;
    element = $state(null);
    #value = $state(null);
    get value() {
        return this.#value;
    }
    set value(newValue) {
        this.#value = newValue;
        this.options.value = newValue;
        this.options.onChange?.(newValue, this);
    }
    initialValue = null;
    errors = $state([]);
    id;
    name;
    type;
    required = $state(false);
    validationFunction;
    constructor(options) {
        const theme = use_theme();
        this.validationFunction = options.validate;
        this.options = options;
        this.name = options.name || theme.randomID(options.type);
        this.type = options.type;
        this.value = options.value ?? null;
        this.initialValue = options.value ?? null;
        this.id = options.id || theme.randomID(`input-${options.type}`);
        this.required = options.required || false;
        const hasFormContext = hasContext('form');
        $effect(() => {
            const _newValue = this.value;
            untrack(() => {
                if (this.errors.length > 0) {
                    this.validate();
                }
            });
        });
        $effect(() => {
            const newValue = options.value;
            untrack(() => {
                if (newValue !== this.value) {
                    this.value = newValue;
                }
            });
        });
        if (hasFormContext) {
            const form = getContext('form');
            form?.fields?.push?.(this);
        }
    }
    validate = () => {
        const errors = [];
        if (this.required) {
            if (this.value === null || this.value === '') {
                errors.push('*');
            }
            if (this.type === 'datetime' || this.type === 'date') {
                if (isNaN(this.value?.getTime?.())) {
                    if (errors.length === 0) {
                        errors.push('*');
                    }
                }
            }
        }
        errors.push(...(this.validationFunction?.(this.value) || []));
        this.errors = errors;
        return this.errors.length > 0;
    };
    reset = () => {
        this.value = this.initialValue;
        this.errors = [];
    };
}
export const useField = (opts) => {
    const state = new FieldState(opts);
    setContext('field', state);
    return state;
};
