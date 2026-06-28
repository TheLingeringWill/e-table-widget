import type { CalendarPrimitiveProps } from './calendarInput.js';
import { type Event, type CalendarType } from '../../Calendar/useCalendar.svelte.js';
declare class __sveltets_Render<T extends CalendarType, E extends Event> {
    props(): CalendarPrimitiveProps<E, T>;
    events(): {};
    slots(): {};
    bindings(): "value";
    exports(): {};
}
interface $$IsomorphicComponent {
    new <T extends CalendarType, E extends Event>(options: import('svelte').ComponentConstructorOptions<ReturnType<__sveltets_Render<T, E>['props']>>): import('svelte').SvelteComponent<ReturnType<__sveltets_Render<T, E>['props']>, ReturnType<__sveltets_Render<T, E>['events']>, ReturnType<__sveltets_Render<T, E>['slots']>> & {
        $$bindings?: ReturnType<__sveltets_Render<T, E>['bindings']>;
    } & ReturnType<__sveltets_Render<T, E>['exports']>;
    <T extends CalendarType, E extends Event>(internal: unknown, props: ReturnType<__sveltets_Render<T, E>['props']> & {}): ReturnType<__sveltets_Render<T, E>['exports']>;
    z_$$bindings?: ReturnType<__sveltets_Render<any, any>['bindings']>;
}
declare const CalendarPrimitive: $$IsomorphicComponent;
type CalendarPrimitive<T extends CalendarType, E extends Event> = InstanceType<typeof CalendarPrimitive<T, E>>;
export default CalendarPrimitive;
