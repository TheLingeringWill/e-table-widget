import { buildComponent } from '../../../plugin/componentBuilder.js';
export const fileInput = buildComponent({
    name: 'file-input',
    attributes: {
        invalid: 'state',
        valid: 'state',
        potential: 'state',
        clickable: true
    }
});
