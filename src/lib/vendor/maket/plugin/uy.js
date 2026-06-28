import tailwind, {} from 'tailwindcss';
import { twMerge } from 'tailwind-merge';
import postcss from 'postcss';
import postcssjs from 'postcss-js';
export const uy = (strings, ...variables) => {
    return twMerge(...variables, ...strings);
};
const ensureFlatCssDeclaration = (obj) => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (Array.isArray(value)) {
            Object.assign(acc, { [key]: value[value.length - 1] });
        }
        else {
            Object.assign(acc, { [key]: value });
        }
        return acc;
    }, {});
};
const extractCSSRuleObject = async (classes, config) => {
    const { css: output } = await postcss([
        tailwind({
            ...config,
            avoidComponent: true,
            content: [{ raw: classes, extension: 'components' }]
        })
        // @ts-expect-error it seems to work idk
    ]).process('@tailwind base;@tailwind components;@tailwind utilities;', { from: undefined });
    const normalizeKey = (key) => {
        key = key.replace(/\\/g, '').replace('.', '');
        const modifier = key.match(/(?<modifier>^.*):/)?.groups?.modifier;
        if (modifier) {
            if (modifier?.includes('data-')) {
                return `${key.replace(`[${modifier.replace('[', '').replace(']', '')}]`, '')}`;
            }
            return modifier;
        }
        return key;
    };
    const js = Object.entries(postcssjs.objectify(postcss.parse(output))).reduce((acc, [key, value]) => {
        Object.assign(acc, {
            [normalizeKey(key)]: ensureFlatCssDeclaration(value)
        });
        return acc;
    }, {});
    return classes.split(' ').reduce((acc, className) => {
        let modifier = className.match(/(?<modifier>^.*):/)?.groups?.modifier;
        if (modifier) {
            modifier = modifier.replace('[', '').replace(']', '');
            if (modifier.includes('data-')) {
                modifier = `&[${modifier}]`;
            }
            else {
                modifier = `&:${modifier}`;
            }
            acc.set(className, {
                [modifier]: js[className]
            });
        }
        else {
            acc.set(className, js[className]);
        }
        return acc;
    }, new Map());
};
export const resolveComponentDefinition = async (source, config) => {
    const obj = structuredClone(source);
    const classes = new Set();
    const collectClasses = (source) => {
        const obj = structuredClone(source);
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key].split(' ').forEach((className) => classes.add(className));
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
                collectClasses(obj[key]);
            }
        }
    };
    collectClasses(obj);
    const rules = await extractCSSRuleObject(Array.from(classes).join(' '), config);
    const applyRules = (source, path = []) => {
        const obj = structuredClone(source);
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                const classes = obj[key].split(' ');
                const extractedRules = classes.reduce((acc, className) => {
                    const rule = rules.get(className);
                    if (rule) {
                        Object.entries(rule).forEach(([key, value]) => {
                            const isModifier = key.startsWith('&:');
                            if (isModifier) {
                                Object.assign(acc, {
                                    [key]: { ...value, ...acc[key] }
                                });
                            }
                            else {
                                Object.assign(acc, {
                                    [key]: value
                                });
                            }
                        });
                    }
                    return acc;
                }, {});
                Object.assign(obj, {
                    [key]: extractedRules
                });
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
                Object.assign(obj, {
                    [key]: applyRules(obj[key], [...path, key])
                });
            }
        }
        return obj;
    };
    return applyRules(obj);
};
// const test = {
// 	slider: {
// 		base: uy` relative`,
// 		track: uy`relative`,
// 		test: {
// 			track: uy`absolute`
// 		}
// 	}
// };
// // import { button } from '../Components/Button/button.js';
// // const css = await resolveComponentDefinition(
// // 	{
// // 		base: 'text-red-500',
// // 		surface: {
// // 			base: 'text-blue-500'
// // 		}
// // 	},
// // 	{}
// // );
// // console.log(button(css, css));
