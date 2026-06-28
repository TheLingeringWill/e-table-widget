import { buildComponent } from '../../plugin/componentBuilder.js';
export const slideShow = buildComponent({
    name: 'slideshow',
    attributes: {
        active: true,
        topCenter: 'disposition',
        bottomCenter: 'disposition',
        left: 'disposition',
        right: 'disposition',
        topLeft: 'disposition',
        topRight: 'disposition',
        bottomLeft: 'disposition',
        bottomRight: 'disposition',
        middle: 'disposition',
        middleLeft: 'disposition',
        middleRight: 'disposition'
    }
});
