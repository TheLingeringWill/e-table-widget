import { defaultTheme } from '$lib/Widget.svelte';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params, url, setHeaders }) => {
	const { widgetId } = params;

	// Disable caching for widget HTML to ensure theme changes appear immediately
	setHeaders({
		'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
		'pragma': 'no-cache',
		'expires': '0'
	});

	const builder = url.searchParams.get('builder') === 'true';
	const isEmbedded = url.searchParams.get('embedded') === 'true';
	let widget = await locals.prisma.widget.findUnique({
		where: {
			id: widgetId
		},
		include: {
			title: true,
			description: true,
			restaurant: {
				select: {
					timezone: true
				}
			}
		}
	});

	if (!widget) {
		widget = {
			id: 'DEFAULT',
			restaurantId: params.restaurantId,
			title: [
				{
					id: 'DEFAULT',
					language: 'FR',
					value: locals.restaurant?.name || 'Mon widget',
					entity_id: 'DEFAULT'
				}
			],
			description: [],
			name: 'DEFAULT',
			theme: defaultTheme,
			whitelist: [],
			restaurant: {
				timezone: locals.restaurant?.timezone || 'Europe__Paris'
			},
			// GTM defaults (disabled for fallback widget)
			gtmEnabled: false,
			gtmId: null
		};
	}

	if (!builder) {
		locals.tinybird?.ingest('load_widget', {
			restaurantId: widget.restaurantId,
			widgetId: params.widgetId
		});
	}

	return {
		builder,
		isEmbedded,
		widget: {
			...widget,
			theme: tryparse(widget.theme)
		}
	};
};

const tryparse = (maybeObject: any): object => {
	try {
		return JSON.parse(maybeObject);
	} catch (e) {
		return maybeObject;
	}
};
