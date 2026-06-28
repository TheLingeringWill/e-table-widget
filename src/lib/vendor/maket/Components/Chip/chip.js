import { buildComponent } from '../../plugin/componentBuilder.js';
export const chip = buildComponent({
    name: 'chip',
    attributes: {
        small: 'size',
        large: 'size',
        variant: 'solid',
        outline: 'variant',
        soft: 'variant'
    }
});
