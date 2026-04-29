import { defaultTheme } from '$lib/Widget.svelte';
import { error } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';

export const load = async ({ params, url, setHeaders }) => {
	// Disable caching for widget HTML to ensure theme changes appear immediately
	setHeaders({
		'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
		pragma: 'no-cache',
		expires: '0'
	});

	const builder = url.searchParams.get('builder') === 'true';
	const isEmbedded = url.searchParams.get('embedded') === 'true';

	const rid = Number(params.restaurantId);
	if (!Number.isFinite(rid)) {
		error(404, 'Restaurant not found');
	}

	// PRD §8 risk row 5: one aggregate call carries restaurant + widget +
	// payment + review + messaging. Saves three round-trips on layout load.
	const api = createWidgetApi(rid);
	const result = await api.getAggregate();
	if (!result.ok) {
		error(404, result.error.message || 'Widget not found');
	}
	const { restaurant, widget: widgetDto } = result.data;

	// PRD §6.4: simplified widget-config theming. Hardcode white surfaces;
	// `widget.color` drives both font and button-text colors.
	const theme = {
		...defaultTheme,
		fontColor: widgetDto.color,
		buttonTextColor: widgetDto.color,
		backgroundColor: '#ffffff',
		buttonColor: '#ffffff',
		borderColor: '#ffffff'
	};

	// Reshape into the legacy widget structure Header.svelte / Widget.svelte
	// still consume: translation arrays for title/description, restaurant
	// nested under widget, theme as a plain JSON object.
	const widget = {
		id: String(widgetDto.id),
		restaurantId: String(widgetDto.restaurantId),
		title: widgetDto.title
			? [
					{
						id: 'rest',
						language: 'FR',
						value: widgetDto.title,
						entity_id: 'rest'
					}
				]
			: [],
		description: widgetDto.description
			? [
					{
						id: 'rest',
						language: 'FR',
						value: widgetDto.description,
						entity_id: 'rest'
					}
				]
			: [],
		name: 'DEFAULT',
		theme,
		whitelist: [],
		restaurant: {
			timezone: restaurant.timezone || 'Europe/Paris'
		},
		gtmEnabled: widgetDto.gtmEnabled,
		gtmId: widgetDto.gtmId ?? null
	};

	return {
		builder,
		isEmbedded,
		widget
	};
};
