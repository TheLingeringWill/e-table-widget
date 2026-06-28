import { buildComponent } from '../../plugin/componentBuilder.js';
export const card = buildComponent({
    name: 'card',
    attributes: {
        small: 'size',
        large: 'size',
        row: 'disposition',
        rowReverse: 'disposition',
        column: 'disposition',
        columnReverse: 'disposition',
        overlay: 'disposition'
    }
});
