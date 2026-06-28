import { buildComponent } from '../../plugin/componentBuilder.js';
export const accordion = buildComponent({
    name: 'accordion',
    attributes: {
        small: 'size',
        large: 'size',
        classic: 'variant',
        card: 'variant',
        outlined: 'variant'
    }
});
export const accordionGroup = buildComponent({
    name: 'accordion-group',
    attributes: {
        small: 'size',
        large: 'size',
        classic: 'variant',
        card: 'variant',
        outlined: 'variant',
        splitted: true
    }
});
