import type { CalendarProps } from './calendarInput.js';
import type { CalendarType } from '../../Calendar/useCalendar.svelte.js';
declare class __sveltets_Render<T extends CalendarType> {
    props(): CalendarProps<never, T>;
    events(): {};
    slots(): {};
    bindings(): "value";
    exports(): {};
}
interface $$IsomorphicComponent {
    new <T extends CalendarType>(options: import('svelte').ComponentConstructorOptions<ReturnType<__sveltets_Render<T>['props']>>): import('svelte').SvelteComponent<ReturnType<__sveltets_Render<T>['props']>, ReturnType<__sveltets_Render<T>['events']>, ReturnType<__sveltets_Render<T>['slots']>> & {
        $$bindings?: ReturnType<__sveltets_Render<T>['bindings']>;
    } & ReturnType<__sveltets_Render<T>['exports']>;
    <T extends CalendarType>(internal: unknown, props: ReturnType<__sveltets_Render<T>['props']> & {}): ReturnType<__sveltets_Render<T>['exports']>;
    z_$$bindings?: ReturnType<__sveltets_Render<any>['bindings']>;
}
declare const CalendarInput: $$IsomorphicComponent;
type CalendarInput<T extends CalendarType> = InstanceType<typeof CalendarInput<T>>;
export default CalendarInput;
