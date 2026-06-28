import { buildComponent } from '../../plugin/componentBuilder.js';
export const toast = buildComponent({
    name: 'toast',
    attributes: {
        danger: 'color',
        info: 'color',
        success: 'color',
        warning: 'color',
        primary: 'color',
        richColors: true,
        small: 'size',
        normal: 'size',
        large: 'size'
    }
});
