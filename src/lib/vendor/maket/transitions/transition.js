import { use_theme } from '../theme.svelte.js';
import { easingFunctions } from './easingFunctions.js';
const split_css_unit = (value) => {
    const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
    return (split ? [parseFloat(split[1]), split[2] || 'px'] : [value, 'px']);
};
const resolveEasing = (easing) => {
    const theme = use_theme();
    const baseEasing = theme.transitions.easing || 'cubicInOut';
    return easingFunctions[easing || baseEasing];
};
const resolveDuration = (duration) => {
    const theme = use_theme();
    if (theme.preferReducesMotion) {
        return 0;
    }
    return duration ?? (theme.transitions.duration || 200);
};
const styleToString = (style) => {
    return Object.keys(style).reduce((str, key) => {
        if (style[key] === undefined)
            return str;
        return str + `${key}:${style[key]};`;
    }, '');
};
const scaleConversion = (valueA, scaleA, scaleB) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;
    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;
    return valueB;
};
const percentageToNumber = (node, params, measurement) => {
    if (typeof params === 'number')
        return params;
    const value = parseFloat(params);
    const direction = value < 0
        ? measurement === 'width'
            ? 'left'
            : 'top'
        : measurement === 'width'
            ? 'right'
            : 'bottom';
    const delta = parseFloat(getComputedStyle(node)[direction]) * (value < 0 ? -1 : 0);
    const parentSize = node.getBoundingClientRect()[measurement];
    return (value / 100) * parentSize + delta;
};
export const fso = (node, params) => {
    const style = getComputedStyle(node);
    const target_opacity = +style.opacity;
    const transform = style.transform === 'none' ? '' : style.transform;
    const od = target_opacity * (1 - (params.opacity ?? 1));
    return {
        delay: params.delay,
        duration: resolveDuration(params.duration),
        easing: resolveEasing(params.easing),
        css: (t, u) => {
            const y = scaleConversion(t, [0, 1], [percentageToNumber(node, params.y ?? 0, 'height') ?? 0, 0]);
            const x = scaleConversion(t, [0, 1], [percentageToNumber(node, params.x ?? 0, 'width') ?? 0, 0]);
            const scale = scaleConversion(t, [0, 1], [params.scale ?? 1, 1]);
            return styleToString({
                transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                opacity: `${target_opacity - od * u}`
            });
        }
    };
};
export function bgFade(node, options) {
    const rgba = getComputedStyle(node).backgroundColor;
    const [r, g, b, target_opacity] = rgba.match(/\d+(\.\d+)?/g).map(Number);
    const od = target_opacity * (1 - 0);
    return {
        delay: options.delay,
        duration: resolveDuration(options.duration),
        easing: resolveEasing(options.easing),
        css: (t, u) => {
            const value = `background-color: rgba(${r},${g},${b},${target_opacity - od * u})`;
            return value;
        }
    };
}
export const slide = (node, { delay = 0, duration, easing, axis = 'y', x = 0, scale = 1, y = 0, opacity = 0.2 } = {}) => {
    const style = getComputedStyle(node);
    const primary_property = axis === 'y' ? 'height' : 'width';
    const primary_property_value = parseFloat(style[primary_property]);
    const secondary_properties = axis === 'y' ? ['top', 'bottom'] : ['left', 'right'];
    const capitalized_secondary_properties = secondary_properties.map((e) => `${e[0].toUpperCase()}${e.slice(1)}`);
    const padding_start_value = parseFloat(style[`padding${capitalized_secondary_properties[0]}`]);
    const padding_end_value = parseFloat(style[`padding${capitalized_secondary_properties[1]}`]);
    const margin_start_value = parseFloat(style[`margin${capitalized_secondary_properties[0]}`]);
    const margin_end_value = parseFloat(style[`margin${capitalized_secondary_properties[1]}`]);
    const border_width_start_value = parseFloat(style[`border${capitalized_secondary_properties[0]}Width`]);
    const border_width_end_value = parseFloat(style[`border${capitalized_secondary_properties[1]}Width`]);
    const target_opacity = +style.opacity;
    const transform = style.transform === 'none' ? '' : style.transform;
    const sd = 1 - scale;
    const od = target_opacity * (1 - (opacity ?? 1));
    const [x_value, x_unit] = split_css_unit(x);
    const [y_value, y_unit] = split_css_unit(y);
    return {
        delay,
        duration: resolveDuration(duration),
        easing: resolveEasing(easing),
        css: (t, u) => {
            return (
            // 'z-index: -1;' +
            'overflow: hidden;' +
                `${primary_property}: ${t * primary_property_value}px;` +
                `padding-${secondary_properties[0]}: ${t * padding_start_value}px;` +
                `padding-${secondary_properties[1]}: ${t * padding_end_value}px;` +
                `margin-${secondary_properties[0]}: ${t * margin_start_value}px;` +
                `margin-${secondary_properties[1]}: ${t * margin_end_value}px;` +
                `border-${secondary_properties[0]}-width: ${t * border_width_start_value}px;` +
                `border-${secondary_properties[1]}-width: ${t * border_width_end_value}px;` +
                `transform: ${transform} scale(${1 - sd * u}) translate(${(1 - t) * x_value}${x_unit}, ${(1 - t) * y_value}${y_unit});` +
                `opacity: ${target_opacity - od * u};` +
                `border-${secondary_properties[1]}-width: ${t * border_width_end_value}px;`);
        }
    };
};
export const defaultBaseTransitionParams = {
    delay: 0,
    duration: 200,
    easing: 'cubicInOut'
};
export const defaultFsoParams = Object.assign({}, defaultBaseTransitionParams, {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1
});
export const defaultSlideTransitionParams = Object.assign(defaultFsoParams, {
    axis: 'y'
});
export const resolveTransitionParams = (transitions) => {
    const inParams = transitions && 'in' in transitions ? transitions.in || {} : (transitions || {});
    const outParams = transitions && 'out' in transitions ? transitions.out || {} : (transitions || {});
    return {
        inParams,
        outParams
    };
};
export const resolveTypedTransitionParams = (component, componentType, transitionType, override) => {
    const theme = use_theme();
    const globalTransitionForComponent = (component === 'dialog'
        ? theme.dialogTransitions
        : component === 'popover'
            ? theme.popoverTransitions
            : theme.toastTransitions);
    const base = override ||
        (globalTransitionForComponent
            ? globalTransitionForComponent[componentType] ||
                (transitionType === 'slide' ? defaultSlideTransitionParams : defaultFsoParams)
            : defaultFsoParams);
    const params = structuredClone({
        in: 'in' in base ? base.in : base,
        out: 'out' in base ? base.out : base
    });
    return params;
};
// I want
// - transition for each type of dialogs to be set on the theme level
// - transition to be reset on the dialog level when it's called in the template
// - the in and out transition to be set separately
// - the transition to be resolved nicely and dynamically based on the current type of the dialog
