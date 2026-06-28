import { type DesignSystem } from '../types/index.js';
export type TailwindOptions = {
    baseDesignSystem?: DesignSystem;
    customDesignSystem?: DesignSystem;
    gradientHash?: number;
};
declare const maket: {
    (options: TailwindOptions): {
        handler: import("tailwindcss/types/config.js").PluginCreator;
        config?: Partial<import("tailwindcss/types/config.js").Config>;
    };
    __isOptionsFunction: true;
};
export { type TailwindOptions as MaketOption, maket };
