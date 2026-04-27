import { getContext, hasContext, setContext } from 'svelte';
import type { LANGUAGE_CODE, Translation, Widget } from 'prisma/node';
import type { ZonedDateUtils } from 'shared/utils/zonedDateUtils';

type WidgetContextData = Widget & {
	title: Translation[];
	description: Translation[];
	summaryText: Translation[];
};

export const useWidget = (widget?: WidgetContextData): WidgetContextData => {
	const hasWidgetContext = hasContext('widget');
	if (hasWidgetContext) {
		return getContext('widget') as WidgetContextData;
	}
	if (!widget) {
		throw new Error('useWidget must be used within a Widget');
	}
	const stateWidget = $state(widget);
	setContext('widget', stateWidget);
	return widget;
};

export const useZonedDateUtils = (zonedDateUtils?: ZonedDateUtils): ZonedDateUtils => {
	const hasZonedDateUtilsContext = hasContext('zonedDateUtils');
	if (hasZonedDateUtilsContext) {
		return getContext('zonedDateUtils');
	}
	if (!zonedDateUtils) {
		throw new Error('useZonedDateUtils must be used within a Widget');
	}
	const stateZonedDateUtils = $state(zonedDateUtils);
	setContext('zonedDateUtils', stateZonedDateUtils);
	return stateZonedDateUtils;
};

export const getTranslation = (translations?: Translation[], language?: LANGUAGE_CODE) => {
	return (
		translations?.find?.((t) => t.language === (language || 'FR'))?.value ||
		translations?.[0]?.value ||
		''
	);
};
