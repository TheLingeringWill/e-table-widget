import {} from '../../transitions/transition.js';
import { buildComponent } from '../../plugin/componentBuilder.js';
export const menu = buildComponent({
    name: 'menu',
    attributes: {
        disabled: true
    }
});
