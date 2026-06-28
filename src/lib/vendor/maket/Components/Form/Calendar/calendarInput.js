import { buildComponent } from '../../../index.js';
export const calendar = buildComponent({
    name: 'calendar',
    attributes: {
        inRange: true,
        inMonth: true,
        disabled: true,
        isToday: true,
        selected: true,
        startOfRange: true,
        endOfRange: true,
        isPast: true
    }
});
