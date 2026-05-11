import type { RequestEvent } from '@sveltejs/kit';
import { createWidgetApi } from '$lib/server/api/widget-api';

/**
 * Generate GTM detection and dataLayer initialization code
 * SDK no longer injects GTM - it detects parent GTM and forwards events
 */
function generateGtmDetectionScript(restaurantId: string): string {
	return /*javascript*/ `
    // E-table GTM Detection (SDK does NOT inject GTM)
    (function() {
      // Detect if parent page already has GTM initialized
      var parentHasGTM = false;
      if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
        for (var i = 0; i < window.dataLayer.length; i++) {
          if (window.dataLayer[i] && window.dataLayer[i]['gtm.start']) {
            parentHasGTM = true;
            break;
          }
        }
      }

      // Store detection result for debugging
      window.__etableGtmConfig = {
        parentHasGTM: parentHasGTM,
        restaurantId: '${restaurantId}'
      };

      // Initialize dataLayer if not exists (for event capture)
      window.dataLayer = window.dataLayer || [];

      if (!parentHasGTM) {
        console.warn('[E-table Widget] No GTM detected on parent page. Widget events will be captured in dataLayer but not processed. Please install GTM on your website to track booking events.');
      } else {
        console.log('[E-table Widget] Parent GTM detected, using existing dataLayer');
      }

      // Push initial widget load event
      window.dataLayer.push({
        'event': 'etable_widget_loaded',
        'restaurant_id': '${restaurantId}',
        'gtm_detected': parentHasGTM,
        'timestamp': new Date().toISOString()
      });
    })();
  `;
}

export const GET = async (event: RequestEvent): Promise<Response> => {
	const { restaurantId } = event.params;

	// PRD §5: widget is now keyed by restaurant only (one-to-one). The
	// `[widgetId]` URL segment is gone; the embed script emits an iframe
	// pointing at `/{restaurantId}` directly. Backward compatibility for
	// already-deployed embed scripts is explicitly out of scope.
	const numericRestaurantId = Number(restaurantId);
	const widgetResult = Number.isFinite(numericRestaurantId)
		? await createWidgetApi(numericRestaurantId).getWidget()
		: ({ ok: false, error: { code: 'invalid_restaurant_id', message: '' } } as const);
	const gtmEnabled = widgetResult.ok ? widgetResult.data.gtmEnabled : false;

	// Only generate GTM detection script if tracking is enabled
	const gtmScript = gtmEnabled ? generateGtmDetectionScript(restaurantId!) : '';

	const iframeSrc = JSON.stringify(`${event.url.origin}/${restaurantId}?embedded=true`);

	const script = /*javascript*/ `
  (function() {
    ${gtmScript}

    const onLoaded = () => {
      const script = document.getElementById('cooking');
      let target = script.getAttribute('data-element');
      const targetElement = target === "[ID]" ? document.querySelector("main") : document.getElementById(target) || document.querySelector(target);
      if(!targetElement){
        console.warn('[E-table Widget] Target element not found:', target);
        return;
      }

      const iframe = document.createElement('iframe');

      // Message handler for iframe communication
      window.addEventListener('message', (event) => {
        if (!event.data || typeof event.data !== 'object') return;

        const { type, data } = event.data;

        // Handle iframe height changes
        if (type === 'resize') {
          iframe.style.height = data + 'px';
        }

        // Handle GTM event forwarding from widget iframe
        if (type === 'gtm_event' && window.dataLayer) {
          window.dataLayer.push(event.data.event);
        }
      });

      iframe.src = ${iframeSrc};
      iframe.frameBorder = "0";
      iframe.style.setProperty('width', '100%');
      iframe.style.setProperty('border', 'none');
      targetElement.appendChild(iframe);
    }

    if (document.readyState === 'loading') {
      window.document.addEventListener("DOMContentLoaded", onLoaded);
    } else {
      onLoaded();
    }
  })();
  `;

	return new Response(script, {
		headers: {
			'content-type': 'application/javascript',
			'cache-control': 'public, max-age=3600'
		}
	});
};

export const OPTIONS = async (): Promise<Response> => {
	return new Response(null, {
		headers: {
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': '*',
			'Access-Control-Max-Age': '86400',
			'Access-Control-Allow-Credentials': 'true'
		}
	});
};
