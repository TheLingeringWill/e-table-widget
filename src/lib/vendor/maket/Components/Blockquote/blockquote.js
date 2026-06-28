import { buildComponent } from '../../plugin/componentBuilder.js';
export const blockquote = buildComponent({
    name: 'blockquote',
    attributes: {
        large: 'size',
        small: 'size'
    }
});
