import {} from '../../types/index.js';
import { buildComponent } from '../../index.js';
export const dialog = buildComponent({
    name: 'dialog',
    attributes: {
        modal: 'type',
        'drawer-right': 'type',
        'drawer-left': 'type',
        'drawer-top': 'type',
        'drawer-bottom': 'type',
        'full-screen': 'type',
        alert: 'type'
    }
});
