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

	// PRD §6.4 (rev 7): widget.color drives the dark surface (matches the
	// live design at restaurant-japonais-ao.com/reservation/ — the brand
	// color is the widget identity). Fonts + buttons + borders are
	// hardcoded white for legibility on the brand surface; buttonTextColor
	// is widget.color so the dark text reads on the white button.
	const theme = {
		...defaultTheme,
		backgroundColor: widgetDto.color,
		fontColor: '#ffffff',
		buttonColor: '#ffffff',
		buttonTextColor: widgetDto.color,
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
		widget,
		// +layout.svelte sets the zonedDateUtils context off `data.restaurant.timezone`
		// — expose it at the top level so the layout doesn't have to reach into widget.
		restaurant: {
			name: restaurant.name,
			timezone: restaurant.timezone || 'Europe/Paris'
		}
	};
};
