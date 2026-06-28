import type { Colors } from '../../types/index.js';
import type { Easing } from '../../transitions/easingFunctions.js';
export type NetworkIndicatorProps = {
    class?: string;
    delay?: number;
    height?: number;
    color?: Colors;
    easing?: Easing;
};
export type NetworkIndicatorTheme = {
    base: string;
    loading: string;
};
export declare const networkIndicator: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
