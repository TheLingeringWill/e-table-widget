import { buildComponent } from '../../plugin/componentBuilder.js';
export const button = buildComponent({
    name: 'button',
    attributes: {
        solid: 'variant',
        outline: 'variant',
        soft: 'variant',
        ghost: 'variant',
        link: 'variant',
        normal: 'size',
        small: 'size',
        large: 'size',
        fullWidth: true,
        squared: true,
        disabled: true,
        loading: true,
        primary: 'color',
        secondary: 'color',
        danger: 'color',
        warning: 'color',
        success: 'color',
        info: 'color',
        surface: 'color',
        contrast: 'color'
    }
});
