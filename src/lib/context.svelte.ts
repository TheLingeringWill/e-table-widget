import { getContext, hasContext, setContext } from 'svelte';
import type { ZonedDateUtils } from '$lib/utils/zonedDateUtils';

// Widget context shape — mirrors what +layout.server.ts assembles from the
// REST aggregate (PRD §6.4): plain string `title`/`description` (or empty
// arrays in the legacy translation shape the components still consume).
export type Translation = {
	id: string;
	language: string;
	value: string;
	entity_id: string;
};

export type WidgetContextData = {
	id: string;
	restaurantId: string;
	title: Translation[];
	description: Translation[];
	summaryText?: Translation[];
	name: string;
	theme: Record<string, unknown>;
	whitelist: unknown[];
	restaurant: { timezone: string; phone?: string; email?: string };
	gtmEnabled: boolean;
	gtmId: string | null;
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

export const getTranslation = (translations?: Translation[], language?: string) => {
	// Match on the base language (uppercased, region stripped) so a 'FR'
	// request still resolves a 'FR-CA' entry and vice versa. Falls back to the
	// first entry when the requested language has no translation.
	const base = (lang: string) => lang.toUpperCase().split('-')[0];
	const target = base(language || 'FR');
	return (
		translations?.find?.((t) => base(t.language) === target)?.value ||
		translations?.[0]?.value ||
		''
	);
};
