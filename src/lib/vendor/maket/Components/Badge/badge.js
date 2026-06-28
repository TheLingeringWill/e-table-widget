import { buildComponent } from '../../plugin/componentBuilder.js';
export const badge = buildComponent({
    name: 'badge',
    attributes: {
        large: 'size',
        small: 'size',
        outlined: 'variant',
        solid: 'variant',
        ghost: 'variant',
        topLeft: 'position',
        topRight: 'position',
        bottomLeft: 'position',
        bottomRight: 'position'
    }
});
