import { buildComponent } from '../../plugin/componentBuilder.js';
export const tabs = buildComponent({
    name: 'tabs',
    attributes: {
        'tucked-start': 'mode',
        'tucked-end': 'mode',
        'tucked-center': 'mode',
        'full-width': 'mode'
    }
});
