import type { MaskProps } from '../../utils/mask.svelte.js';
import type { Snippet } from 'svelte';
import type { Easing } from '../../types/index.js';
export type SlideShowDisposition = 'topCenter' | 'bottomCenter' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'middle' | 'middleLeft' | 'middleRight';
export type SlideShowProps<Item> = {
    items: Item[];
    loop?: boolean;
    draggable?: boolean;
    mask?: MaskProps;
    imageKey: keyof Item;
    slide?: Snippet<{
        item: Item;
        isVisible: boolean;
    } & SlidShowState<Item>>;
    children?: Snippet<SlidShowState<Item>>;
    image?: Snippet<{
        item: Item;
        isVisible: boolean;
    } & SlidShowState<Item>>;
    pauseOnHover?: boolean;
    autoPlay?: number;
    stagger?: number;
    duration?: number;
    easing?: Easing;
    contentAnimation?: Keyframe[];
    imageAnimation?: Keyframe[];
    slideAnimation?: Keyframe[];
    class?: string;
    slideClass?: string;
    containerClass?: string;
    contentClass?: string;
    imageContainerClass?: string;
    imageClass?: string;
    dotsContainerClass?: string;
    progressContainerClass?: string;
    dotClass?: string;
    progressBarClass?: string;
    showDots?: boolean;
    showProgress?: boolean;
    disposition?: SlideShowDisposition;
    dot?: Snippet<{
        item: Item;
        index: number;
        isVisible: boolean;
    } & SlidShowState<Item>>;
    progress?: Snippet<{
        progress: number;
    } & SlidShowState<Item>>;
};
type SlidShowState<Item> = {
    next: () => void;
    prev: () => void;
    goTo: (index: number) => void;
    getState: () => [HTMLElement[], HTMLElement, number];
    autoPlayStart: () => void;
    autoPlayStop: () => void;
    currentItem: Item;
};
export type SlideShowTheme = {
    base: string;
    container: string;
    slide: {
        base: string;
    } & {
        [key in SlideShowDisposition]: string;
    };
    content: string;
    imageContainer: string;
    image: string;
    dotsContainer: string;
    dots: string;
    dot: {
        base: string;
        active: string;
    };
    progress: string;
    progressIndicator: string;
};
export declare const slideShow: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export {};
