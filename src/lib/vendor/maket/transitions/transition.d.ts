import type { TransitionConfig } from 'svelte/transition';
import { type Easing } from './easingFunctions.js';
import type { DialogType } from '../Components/Dialog/dialog.types.js';
import type { ToastPosition } from '../Components/Toast/toast.js';
import type { Placement } from '@floating-ui/dom';
export type BaseTransitionParams = {
    delay?: number;
    duration?: number;
    easing?: Easing;
};
export type SlideTransitionParams = FSOParams & {
    axis?: 'x' | 'y';
};
export type FSOParams = BaseTransitionParams & {
    x?: number | `${number}%`;
    y?: number | `${number}%`;
    scale?: number;
    opacity?: number;
};
export type SlideTransitionProps = SlideTransitionParams | {
    in?: Partial<SlideTransitionParams>;
    out?: Partial<SlideTransitionParams>;
} | undefined;
export type FSOProps = FSOParams | {
    in?: FSOParams;
    out?: FSOParams;
} | undefined;
export declare const fso: (node: HTMLElement, params: FSOParams) => TransitionConfig;
type BgFadeOptions = {
    delay?: number;
    duration?: number;
    easing?: Easing;
};
export declare function bgFade(node: HTMLElement, options: BgFadeOptions): {
    delay: number | undefined;
    duration: number;
    easing: import("svelte/transition").EasingFunction | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number);
    css: (t: number, u: number) => string;
};
export declare const slide: (node: HTMLElement, { delay, duration, easing, axis, x, scale, y, opacity }?: SlideTransitionParams) => {
    delay: number;
    duration: number;
    easing: import("svelte/transition").EasingFunction | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number) | ((x: number) => number);
    css: (t: number, u: number) => string;
};
export declare const defaultBaseTransitionParams: {
    delay: number;
    duration: number;
    easing: "cubicInOut";
};
export declare const defaultFsoParams: {
    delay: number;
    duration: number;
    easing: "cubicInOut";
} & {
    x: number;
    y: number;
    scale: number;
    opacity: number;
};
export declare const defaultSlideTransitionParams: {
    delay: number;
    duration: number;
    easing: "cubicInOut";
} & {
    x: number;
    y: number;
    scale: number;
    opacity: number;
} & {
    axis: "y";
};
export declare const resolveTransitionParams: <T extends FSOProps | SlideTransitionProps>(transitions?: T) => {
    inParams: T extends FSOProps ? FSOParams : SlideTransitionParams;
    outParams: T extends FSOProps ? FSOParams : SlideTransitionParams;
};
export type TypedTransitionProps<Ty extends string, Tr extends 'slide' | 'fso'> = {
    [K in Ty]?: Tr extends 'slide' ? SlideTransitionProps : FSOProps;
};
export declare const resolveTypedTransitionParams: <C extends "dialog" | "toast" | "popover", Tr extends "slide" | "fso", Ct extends C extends "dialog" ? DialogType : C extends "popover" ? Placement : ToastPosition>(component: C, componentType: Ct, transitionType: Tr, override?: Tr extends "slide" ? SlideTransitionProps : FSOProps) => {
    in: Tr extends "slide" ? SlideTransitionParams : FSOParams;
    out: Tr extends "slide" ? SlideTransitionParams : FSOParams;
};
export {};
