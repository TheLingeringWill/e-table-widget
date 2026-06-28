import { buildComponent } from '../../plugin/componentBuilder.js';
export const hoverCard = buildComponent({
    name: 'hover-card',
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
