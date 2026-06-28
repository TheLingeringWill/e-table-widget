import { buildComponent } from '../../plugin/componentBuilder.js';
export const heading = buildComponent({
    name: 'heading',
    attributes: {
        h1: 'level',
        h2: 'level',
        h3: 'level',
        h4: 'level',
        h5: 'level',
        h6: 'level',
        muted: true,
        balanced: true,
        bold: 'weight',
        light: 'weight',
        center: 'align',
        right: 'align',
        left: 'align',
        underline: true
    }
});
export const text = buildComponent({
    name: 'text',
    attributes: {
        small: 'size',
        normal: 'size',
        large: 'size',
        muted: true,
        underline: true,
        light: 'weight',
        bold: 'weight',
        italic: true,
        uppercase: true,
        lowercase: true,
        capitalize: true
    }
});
