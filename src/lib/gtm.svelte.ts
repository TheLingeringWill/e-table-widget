import { browser } from '$app/environment';

/**
 * GTM Event Tracker for Widget
 *
 * - Embedded mode: Events sent via postMessage to parent
 * - Standalone mode: Events pushed to local dataLayer (GTM from SSR)
 */

export interface GtmEvent {
	event: string;
	timestamp: string;
	[key: string]: any;
}

let isEmbeddedMode: boolean | null = null;

/**
 * Detect if running in embedded mode (iframe)
 */
function detectEmbeddedMode(): boolean {
	if (!browser) return false;
	if (isEmbeddedMode !== null) return isEmbeddedMode;

	try {
		isEmbeddedMode = window.self !== window.top;
	} catch (e) {
		isEmbeddedMode = true; // Cross-origin = iframe
	}

	return isEmbeddedMode;
}

/**
 * Push event to local dataLayer (standalone mode)
 */
function pushToLocalDataLayer(gtmEvent: GtmEvent): void {
	if (!browser) return;
	const dataLayer = (window as any).dataLayer;
	if (dataLayer) {
		dataLayer.push(gtmEvent);
	} else if (import.meta.env.DEV) {
		console.warn('[GTM] dataLayer not found');
	}
}

/**
 * Push event via postMessage to parent (embedded mode)
 */
function pushToParent(gtmEvent: GtmEvent): void {
	if (!browser) return;
	window.parent.postMessage({ type: 'gtm_event', event: gtmEvent }, '*');
}

/**
 * Send GTM event - routes to dataLayer or postMessage
 */
export function pushGtmEvent(eventName: string, eventData: Record<string, any> = {}) {
	if (!browser) return;

	const gtmEvent: GtmEvent = {
		event: eventName,
		timestamp: new Date().toISOString(),
		...eventData
	};

	const isEmbedded = detectEmbeddedMode();

	if (isEmbedded) {
		pushToParent(gtmEvent);
	} else {
		pushToLocalDataLayer(gtmEvent);
	}

	if (import.meta.env.DEV) {
		const mode = isEmbedded ? 'postMessage→parent' : 'dataLayer→local';
		console.log(`[GTM Event] ${mode}:`, eventName, eventData);
	}
}

/**
 * Enhanced ecommerce tracking helper for GA4
 */
export function pushEcommerceEvent(eventName: string, ecommerce: Record<string, any>) {
	pushGtmEvent(eventName, {
		ecommerce,
		currency: 'EUR'
	});
}

/**
 * Track widget load
 */
export function trackWidgetLoad(widgetId: string, restaurantId: string) {
	pushGtmEvent('widget_loaded', {
		widget_id: widgetId,
		restaurant_id: restaurantId,
		mode: detectEmbeddedMode() ? 'embedded' : 'standalone'
	});
}

/**
 * Track step progression
 */
export function trackStep(stepNumber: number, stepName: string, data: Record<string, any> = {}) {
	pushGtmEvent(`widget_step_${stepName.toLowerCase()}`, {
		step: stepNumber,
		step_name: stepName,
		...data
	});
}

/**
 * Track user interaction
 */
export function trackInteraction(action: string, data: Record<string, any> = {}) {
	pushGtmEvent('widget_interaction', {
		action,
		...data
	});
}

/**
 * Track errors
 */
export function trackError(errorCode: string, errorMessage: string, context: Record<string, any> = {}) {
	pushGtmEvent('booking_error', {
		error_code: errorCode,
		error_message: errorMessage,
		...context
	});
}

/**
 * Track successful booking
 */
export function trackBookingConfirmed(data: {
	reservationId: string;
	serviceId: string;
	serviceName: string;
	pax: number;
	date: string;
	customerEmail: string;
	paymentRequired: boolean;
	amount?: number;
}) {
	pushGtmEvent('booking_confirmed', data);

	if (data.amount) {
		pushEcommerceEvent('purchase', {
			transaction_id: data.reservationId,
			value: data.amount,
			items: [
				{
					item_id: data.serviceId,
					item_name: data.serviceName,
					price: data.amount,
					quantity: data.pax
				}
			]
		});
	}
}
