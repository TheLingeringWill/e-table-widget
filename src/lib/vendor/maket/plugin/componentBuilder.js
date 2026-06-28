import { deepMerge } from './deepMerge.js';
export const traverseComponentDefinition = ({ name: n, root, attributes = {}, definition }) => {
    const name = camelCaseToKebabCase(n);
    definition = structuredClone(definition || {});
    const acc = {};
    for (const key in definition) {
        const value = definition[key];
        const kebabKey = camelCaseToKebabCase(key);
        const isAttribute = key in attributes;
        const isBefore = isAttribute && attributes[key] === 'before';
        const isAfter = isAttribute && attributes[key] === 'after';
        const K = isAttribute
            ? isBefore
                ? `&:before`
                : isAfter
                    ? `&:after`
                    : typeof attributes[key] === 'string'
                        ? `&:where([data-${attributes[key]}='${key}'])`
                        : `&:where([data-${kebabKey}='true'])`
            : `:where(.ui-${name}-${kebabKey})`;
        if (typeof value === 'object' && !key.startsWith('&')) {
            if (key === 'base') {
                Object.assign(acc, traverseComponentDefinition({ name, root, definition: value, attributes }));
            }
            else if (key === 'parent') {
                Object.assign(root, {
                    [`:where(*:has(>.ui-${name}):not(.ui-${name}))`]: traverseComponentDefinition({
                        name,
                        root,
                        definition: value,
                        attributes
                    })
                });
            }
            else {
                Object.assign(acc, {
                    [K]: traverseComponentDefinition({
                        name: name, // `${name}-${kebabKey}`,
                        root,
                        definition: value,
                        attributes
                    })
                });
            }
        }
        else {
            Object.assign(acc, { [key]: value });
        }
    }
    return acc;
};
const camelCaseToKebabCase = (str) => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
};
export const buildComponent = ({ name, attributes, inject }) => (base, target) => {
    const kebabName = camelCaseToKebabCase(name);
    const root = {};
    const component = traverseComponentDefinition({
        name: kebabName,
        root,
        definition: deepMerge(base, target),
        attributes: attributes || {}
    });
    return Object.assign({
        [`.ui-${kebabName}`]: component
    }, root, inject || {});
};
