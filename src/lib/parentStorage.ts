import { browser } from '$app/environment';
import { detectEmbeddedMode } from './gtm.svelte';

/**
 * "Remember me" storage that survives iOS Safari.
 *
 * A cross-site third-party iframe gets partitioned, non-persistent (in-memory)
 * localStorage on iOS Safari: writes succeed while the tab stays alive, but the
 * store is wiped when Safari discards the backgrounded tab. So when embedded, we
 * broker persistence to the FIRST-PARTY parent page (the embed script holds the
 * `storage_get`/`storage_set`/`storage_remove` handlers) over postMessage. The
 * iframe's own localStorage is still written as a same-session cache and is the
 * sole store in standalone (non-embedded) mode.
 */

const TARGET_ORIGIN = '*';
const REPLY_TIMEOUT_MS = 600;

function localGet(key: string): string | null {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

/**
 * Read a value. When embedded, asks the parent (first-party, persistent) and
 * falls back to the iframe-local cache on timeout or a missing parent value.
 */
export function getItem(key: string): Promise<string | null> {
	if (!browser) return Promise.resolve(null);

	const local = localGet(key);
	if (!detectEmbeddedMode()) return Promise.resolve(local);

	return new Promise((resolve) => {
		let settled = false;
		const finish = (value: string | null) => {
			if (settled) return;
			settled = true;
			window.removeEventListener('message', onMessage);
			resolve(value);
		};

		const onMessage = (event: MessageEvent) => {
			const d = event.data;
			if (!d || d.type !== 'storage_value' || !d.data || d.data.key !== key) return;
			// Prefer the parent's first-party value; fall back to the local cache
			// if the parent has nothing stored.
			finish(typeof d.data.value === 'string' ? d.data.value : local);
		};

		window.addEventListener('message', onMessage);
		try {
			window.parent.postMessage({ type: 'storage_get', data: { key } }, TARGET_ORIGIN);
		} catch {
			finish(local);
			return;
		}
		setTimeout(() => finish(local), REPLY_TIMEOUT_MS);
	});
}

/** Persist a value to the iframe-local cache and, when embedded, the parent. */
export function setItem(key: string, value: string): void {
	if (!browser) return;
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// private mode / disabled storage — ignore
	}
	if (detectEmbeddedMode()) {
		try {
			window.parent.postMessage({ type: 'storage_set', data: { key, value } }, TARGET_ORIGIN);
		} catch {
			// ignore
		}
	}
}

/** Remove a value from the iframe-local cache and, when embedded, the parent. */
export function removeItem(key: string): void {
	if (!browser) return;
	try {
		window.localStorage.removeItem(key);
	} catch {
		// ignore
	}
	if (detectEmbeddedMode()) {
		try {
			window.parent.postMessage({ type: 'storage_remove', data: { key } }, TARGET_ORIGIN);
		} catch {
			// ignore
		}
	}
}
