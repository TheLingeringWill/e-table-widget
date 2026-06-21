import { defaultTheme } from '$lib/Widget.svelte';
import { error } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';
import { loadAvailableDates } from '$lib/server/api/availableDates';
import { getContrastColor, brandTextOnLight, brandTextOnDark } from '$lib/utils/contrastColor';

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

	// PRD §6.4 (rev 10): widget.color is the brand SURFACE (the widget identity).
	// The foreground (text + separators/borders) auto-picks black or white from
	// the brand color's luminance — Zenchef-style — so a LIGHT brand stays legible
	// instead of rendering white-on-light. The CTA button is a FILLED contrast
	// button: its background is the contrast color (black on a light brand, white
	// on a dark one) and its text carries the brand color directly on BOTH sides
	// of the cutoff — brand-on-black for a light brand, brand-on-white for a dark
	// one — falling back to white/black when the brand can't read on the button.
	const contrast = getContrastColor(widgetDto.color);
	const onContrast =
		contrast === '#000000' ? brandTextOnDark(widgetDto.color) : brandTextOnLight(widgetDto.color);
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

	// Preload the calendar's bookable dates. Returned as a NON-awaited promise so
	// it streams: the page (and the rest of the widget) paints immediately off the
	// aggregate above, and the calendar fills the moment this resolves — instead
	// of the old path where the client fired this fetch only after hydration
	// (~370ms in), leaving an empty/all-disabled calendar until ~670ms. Selection
	// awaits it and falls back to the client RPC if it resolves null (upstream
	// failure) or on later client-side navigation.
	const tz = restaurant.timezone || 'Europe/Paris';
	const availableDates = loadAvailableDates(rid, tz);

	return {
		builder,
		isEmbedded,
		widget,
		availableDates,
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
