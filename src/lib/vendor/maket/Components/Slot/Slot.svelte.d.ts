import { type Slot } from './slot.js';
import type { Snippet } from 'svelte';
declare class __sveltets_Render<Payload extends Record<string, any> | undefined = undefined> {
    props(): {
        class?: string;
        as?: string;
        attrs?: Record<string, any>;
        payload?: Payload | undefined;
        children?: Snippet;
        style?: string;
        render?: Slot<{
            payload: Payload;
        } & Record<string, any>> | undefined;
        props?: Record<string, any>;
    };
    events(): {};
    slots(): {};
    bindings(): "";
    exports(): {};
}
interface $$IsomorphicComponent {
    new <Payload extends Record<string, any> | undefined = undefined>(options: import('svelte').ComponentConstructorOptions<ReturnType<__sveltets_Render<Payload>['props']>>): import('svelte').SvelteComponent<ReturnType<__sveltets_Render<Payload>['props']>, ReturnType<__sveltets_Render<Payload>['events']>, ReturnType<__sveltets_Render<Payload>['slots']>> & {
        $$bindings?: ReturnType<__sveltets_Render<Payload>['bindings']>;
    } & ReturnType<__sveltets_Render<Payload>['exports']>;
    <Payload extends Record<string, any> | undefined = undefined>(internal: unknown, props: ReturnType<__sveltets_Render<Payload>['props']> & {}): ReturnType<__sveltets_Render<Payload>['exports']>;
    z_$$bindings?: ReturnType<__sveltets_Render<any>['bindings']>;
}
declare const Slot: $$IsomorphicComponent;
type Slot<Payload extends Record<string, any> | undefined = undefined> = InstanceType<typeof Slot<Payload>>;
export default Slot;
