import {} from 'svelte';
export function isSnippet(component_fn) {
    return component_fn.length === 1;
}
