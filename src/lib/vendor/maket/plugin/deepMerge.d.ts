type PartialDeep<T> = {
    [P in keyof T]?: Partial<PartialDeep<T[P]>>;
};
export declare const deepMerge: <T>(a?: PartialDeep<T>, b?: PartialDeep<T>) => T;
export {};
