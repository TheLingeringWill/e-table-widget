import { buildComponent } from '../../plugin/componentBuilder.js';
export const avatar = buildComponent({
    name: 'avatar',
    attributes: {
        small: 'size',
        large: 'size'
    }
});
export const avatarGroup = buildComponent({
    name: 'avatar-group',
    attributes: {
        small: 'size',
        large: 'size'
    }
});
