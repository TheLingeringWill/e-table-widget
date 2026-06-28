import type { Colors, Sizes } from '../../types/theme.js';
import type { Slot, WithSlot } from '../Slot/slot.js';
export type Meter<T extends Record<string, any> | undefined> = {
    label?: string;
    color?: Colors;
    position?: 'top' | 'bottom';
    value: number;
    data?: T;
};
type Step<T extends Record<string, any> | undefined> = {
    start: number;
    end?: number;
    position?: 'top' | 'bottom';
    class?: string;
    labelClass?: string;
    color: Colors;
    label: Slot<Omit<Step<T>, 'label'>>;
    data?: T;
};
export type MeterProps<T extends Record<string, any> | undefined, S extends Record<string, any> | undefined> = WithSlot<WithSlot<{
    class?: string;
    showIndicatorAs?: 'value' | 'percentage';
    value: Meter<T> | Meter<T>[];
    steps?: Step<S>[];
    stiffness?: number;
    soft?: number;
    damping?: number;
    precision?: number;
    min?: number;
    max?: number;
    size?: Sizes;
    stepClass?: string;
    stepLabelClass?: string;
    containerClass?: string;
    progressClass?: string;
    headerClass?: string;
    trackClass?: string;
}, 'label' | 'description' | 'helper' | 'header', never>, 'indicator', Meter<T> & {
    percentage: number;
}>;
export type MeterTheme = {
    base: string;
    label: string;
    helper: string;
    description: string;
    container: {
        base: string;
        first: string;
        last: string;
    };
    progress: string;
    header: string;
    track: string;
    indicator: {
        base: string;
        top: string;
        bottom: string;
    };
    step: {
        base: string;
        label: string;
        top: string;
        bottom: string;
    };
};
export declare const meter: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export {};
