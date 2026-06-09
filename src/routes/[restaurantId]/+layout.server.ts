import { defaultTheme } from '$lib/Widget.svelte';
import { error } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';
import { getContrastColor, brandTextOnLight } from '$lib/utils/contrastColor';

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

	// PRD §6.4 (rev 9): widget.color is the brand SURFACE (the widget identity).
	// The foreground (text + separators/borders) auto-picks black or white from
	// the brand color's luminance — Zenchef-style — so a LIGHT brand stays legible
	// instead of rendering white-on-light. The CTA button is a FILLED contrast
	// button: its background is the contrast color (black on a light brand, white
	// on a dark one) with the opposite color as text — so on a light brand the
	// button reads solid black, matching the rest of the foreground.
	const contrast = getContrastColor(widgetDto.color);
	const onContrast = contrast === '#000000' ? '#ffffff' : brandTextOnLight(widgetDto.color);
	const theme = {
		...defaultTheme,
		backgroundColor: widgetDto.color,
		fontColor: contrast,
		buttonColor: contrast,
		buttonTextColor: onContrast,
		// The .revert / .color-revert surfaces sit on a fixed near-white (#f0f0f0)
		// background, so their text must read on white regardless of brand.
		revertTextColor: brandTextOnLight(widgetDto.color),
		borderColor: contrast
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
		description: (widgetDto.translations ?? []).map((t) => ({
			id: String(t.id),
			language: t.language.toUpperCase(),
			value: t.description,
			entity_id: 'rest'
		})),
		name: 'DEFAULT',
		theme,
		whitelist: [],
		restaurant: {
			timezone: restaurant.timezone || 'Europe/Paris',
			phone: restaurant.phone,
			email: restaurant.email
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
			timezone: restaurant.timezone || 'Europe/Paris',
			phone: restaurant.phone,
			email: restaurant.email
		}
	};
};
