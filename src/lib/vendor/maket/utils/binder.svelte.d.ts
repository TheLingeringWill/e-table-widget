export declare const useBinderFallback: <T>(prop: () => T) => {
    value: T;
};
type Binder<T> = () => [T, (newValue: T) => void];
export declare const binder: <T>(args_0: Binder<T>, args_1: Binder<T>) => void;
export {};
