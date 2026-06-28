import { buildComponent } from '../../plugin/componentBuilder.js';
export const form = buildComponent({
    name: 'form',
    attributes: {
        loading: true,
        disabled: true
    }
});
export const field = buildComponent({
    name: 'field',
    attributes: {
        loading: true,
        disabled: true
    }
});
