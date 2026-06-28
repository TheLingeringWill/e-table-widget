import { buildComponent } from '../../plugin/componentBuilder.js';
export const networkIndicator = buildComponent({
    name: 'network-indicator',
    attributes: {
        loading: true
    }
});
