import { buildComponent } from '../../index.js';
export const meter = buildComponent({
    name: 'meter',
    attributes: {
        normal: 'size',
        small: 'size',
        large: 'size',
        danger: 'color',
        success: 'color',
        warning: 'color',
        info: 'color',
        contrast: 'color',
        surface: 'color',
        top: 'position',
        bottom: 'position',
        first: true,
        last: true
    },
    inject: {
        '::-webkit-meter-bar': {
            background: 'none',
            appearance: 'none',
            backgroundColor: 'none'
        },
        '::-webkit-meter-optimum-value': {
            background: 'none',
            appearance: 'none',
            backgroundColor: 'none'
        }
    }
});
