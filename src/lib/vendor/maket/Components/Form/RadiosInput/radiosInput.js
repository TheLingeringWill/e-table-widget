import { buildComponent } from '../../../plugin/componentBuilder.js';
export const radiosInput = buildComponent({
    name: 'radios-input',
    attributes: {
        card: 'mode',
        thumb: 'after',
        track: 'before',
        checked: true
    }
});
