import { type Snippet } from 'svelte';
export type SnippetSlot<Payload extends Record<string, any> | undefined = undefined> = Snippet<Payload extends undefined ? [{
    payload: Payload;
} & any] : [any]>;
export type Slot<Payload extends Record<string, any> | undefined = undefined> = string | SnippetSlot<Payload>;
export type WithSlot<Props, Name extends string, Payload extends Record<string, any> | undefined = undefined> = Props & Omit<{
    [P in Name | `${Name}Class` | `${Name}Props`]?: P extends `${Name}Class` ? string : P extends `${Name}Props` ? Record<string, any> : Slot<Payload>;
}, 'childrenClass'>;
export declare function isSnippet(component_fn: any): boolean;
