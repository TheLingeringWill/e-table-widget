import { type Config } from 'tailwindcss';
import type { CSSRuleObject } from 'tailwindcss/types/config.js';
import type { ComponentsSystem } from './components.js';
export declare const uy: (strings: TemplateStringsArray, ...variables: string[]) => string;
type ComponentDefinition = {
    [key: string]: ComponentDefinition | CSSRuleObject;
};
export declare const resolveComponentDefinition: (source: ComponentsSystem, config: Config) => Promise<ComponentDefinition>;
export {};
