export declare const traverseComponentDefinition: ({ name: n, root, attributes, definition }: {
    name: string;
    root: object;
    attributes?: Record<string, string | boolean>;
    definition?: object;
}) => {};
export declare const buildComponent: ({ name, attributes, inject }: {
    name: string;
    attributes?: Record<string, string | boolean>;
    inject?: Record<string, Record<string, string>>;
}) => (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
