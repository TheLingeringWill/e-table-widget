import { buildComponent } from '../../plugin/componentBuilder.js';
export const getKBDKey = (key) => {
    switch (key) {
        case 'command':
            return '⌘';
        case 'shift':
            return '⇧';
        case 'ctrl':
            return '⌃';
        case 'option':
            return '⌥';
        case 'enter':
            return '↵';
        case 'delete':
            return '⌫';
        case 'escape':
            return '⎋';
        case 'tab':
            return '⇥';
        case 'capslock':
            return '⇪';
        case 'up':
            return '↑';
        case 'right':
            return '→';
        case 'down':
            return '↓';
        case 'left':
            return '←';
        case 'pageup':
            return '⇞';
        case 'pagedown':
            return '⇟';
        case 'home':
            return '↖';
        case 'end':
            return '↘';
        case 'help':
            return '?';
        case 'space':
            return '␣';
        default:
            return key;
    }
};
export const getKBDKeyLabel = (key) => {
    switch (key) {
        case 'command':
            return 'Command';
        case 'shift':
            return 'Shift';
        case 'ctrl':
            return 'Control';
        case 'option':
            return 'Option';
        case 'enter':
            return 'Enter';
        case 'delete':
            return 'Delete';
        case 'escape':
            return 'Escape';
        case 'tab':
            return 'Tab';
        case 'capslock':
            return 'Caps Lock';
        case 'up':
            return 'Up';
        case 'right':
            return 'Right';
        case 'down':
            return 'Down';
        case 'left':
            return 'Left';
        case 'pageup':
            return 'Page Up';
        case 'pagedown':
            return 'Page Down';
        case 'home':
            return 'Home';
        case 'end':
            return 'End';
        case 'help':
            return 'Help';
        case 'space':
            return 'Space';
        default:
            return key;
    }
};
export const kbd = buildComponent({
    name: 'kbd',
    attributes: {
        solid: 'variant',
        outline: 'variant',
        ghost: 'variant',
        soft: 'variant',
        normal: 'size',
        large: 'size',
        small: 'size'
    }
});
