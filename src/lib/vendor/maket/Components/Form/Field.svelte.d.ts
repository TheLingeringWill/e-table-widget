import type { InputType, FieldProps } from './field.js';
declare class __sveltets_Render<Type extends InputType> {
    props(): FieldProps<Type>;
    events(): {};
    slots(): {};
    bindings(): "node";
    exports(): {};
}
interface $$IsomorphicComponent {
    new <Type extends InputType>(options: import('svelte').ComponentConstructorOptions<ReturnType<__sveltets_Render<Type>['props']>>): import('svelte').SvelteComponent<ReturnType<__sveltets_Render<Type>['props']>, ReturnType<__sveltets_Render<Type>['events']>, ReturnType<__sveltets_Render<Type>['slots']>> & {
        $$bindings?: ReturnType<__sveltets_Render<Type>['bindings']>;
    } & ReturnType<__sveltets_Render<Type>['exports']>;
    <Type extends InputType>(internal: unknown, props: ReturnType<__sveltets_Render<Type>['props']> & {}): ReturnType<__sveltets_Render<Type>['exports']>;
    z_$$bindings?: ReturnType<__sveltets_Render<any>['bindings']>;
}
declare const Field: $$IsomorphicComponent;
type Field<Type extends InputType> = InstanceType<typeof Field<Type>>;
export default Field;
