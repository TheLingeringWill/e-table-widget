import { buildComponent } from '../../plugin/componentBuilder.js';
import {} from '../../types/index.js';
export const thumb = buildComponent({
    name: 'thumb',
    attributes: {
        visible: true,
        active: 'thumb-mode',
        passive: 'thumb-mode',
        ghost: 'thumb-variant',
        solid: 'thumb-variant',
        outline: 'thumb-variant',
        underline: 'thumb-variant'
    }
});
// export const thumb = (defaultConfig: ThumbTheme, customConfig: Partial<ThumbTheme> = {}) => {
// 	return {
// 		'*:has(>.ui-thumb)': deepMerge(defaultConfig.parent, customConfig.parent),
// 		'.ui-thumb': deepMerge(defaultConfig.thumb, customConfig.thumb),
// 		'.ui-thumb[data-active="true"]': deepMerge(defaultConfig.thumbActive, customConfig.thumbActive)
// 	};
// };
