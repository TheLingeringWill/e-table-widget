import type { ButtonPrimitiveProps } from './button.js';
declare class __sveltets_Render<Payload extends Record<string, any> | undefined> {
    props(): ButtonPrimitiveProps<Payload>;
    events(): {};
    slots(): {};
    bindings(): "ref";
    exports(): {};
}
interface $$IsomorphicComponent {
    new <Payload extends Record<string, any> | undefined>(options: import('svelte').ComponentConstructorOptions<ReturnType<__sveltets_Render<Payload>['props']>>): import('svelte').SvelteComponent<ReturnType<__sveltets_Render<Payload>['props']>, ReturnType<__sveltets_Render<Payload>['events']>, ReturnType<__sveltets_Render<Payload>['slots']>> & {
        $$bindings?: ReturnType<__sveltets_Render<Payload>['bindings']>;
    } & ReturnType<__sveltets_Render<Payload>['exports']>;
    <Payload extends Record<string, any> | undefined>(internal: unknown, props: ReturnType<__sveltets_Render<Payload>['props']> & {}): ReturnType<__sveltets_Render<Payload>['exports']>;
    z_$$bindings?: ReturnType<__sveltets_Render<any>['bindings']>;
}
declare const ButtonPrimitive: $$IsomorphicComponent;
type ButtonPrimitive<Payload extends Record<string, any> | undefined> = InstanceType<typeof ButtonPrimitive<Payload>>;
export default ButtonPrimitive;
