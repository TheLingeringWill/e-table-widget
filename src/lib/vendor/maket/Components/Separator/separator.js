import { buildComponent } from '../../plugin/componentBuilder.js';
export const separator = buildComponent({
    name: 'separator',
    attributes: {
        horizontal: 'orientation',
        vertical: 'orientation'
    }
});
