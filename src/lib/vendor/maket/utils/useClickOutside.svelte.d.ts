type Options = {
    isActive: boolean;
    refs?: (HTMLElement | null)[];
    callback: () => void;
};
export declare const useClickOutside: (opts: Options) => {
    ref: (node: HTMLElement) => void;
};
export {};
