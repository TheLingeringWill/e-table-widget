import {} from '../../types/index.js';
import { buildComponent } from '../../plugin/componentBuilder.js';
export const callout = buildComponent({
    name: 'callout',
    attributes: {
        small: 'size',
        large: 'size',
        solid: 'variant',
        outline: 'variant',
        soft: 'variant'
    }
});
