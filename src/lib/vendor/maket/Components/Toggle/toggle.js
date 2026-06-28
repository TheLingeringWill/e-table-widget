import { buildComponent } from '../../plugin/componentBuilder.js';
export const toggleGroup = buildComponent({
    name: 'toggle-group',
    attributes: {
        outline: 'variant',
        ghost: 'variant',
        normal: 'size',
        small: 'size',
        large: 'size',
        selected: true,
        disabled: true,
        checked: true
    }
});
export const toggleButton = buildComponent({
    name: 'toggle-button',
    attributes: {
        outline: 'variant',
        ghost: 'variant',
        normal: 'size',
        small: 'size',
        large: 'size',
        selected: true,
        disabled: true,
        checked: true
    }
});
