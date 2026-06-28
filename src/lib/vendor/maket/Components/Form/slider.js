import { buildComponent } from '../../plugin/componentBuilder.js';
export const slider = buildComponent({
    name: 'slider',
    attributes: {
        vertical: 'orientation'
    }
});
