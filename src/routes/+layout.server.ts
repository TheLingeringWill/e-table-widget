// PRD §7 Phase 4: drop the createLocals plumbing — `restaurant` and
// `countryCode` no longer come from the in-process Reservator path. The
// widget gets its restaurant data from the per-restaurant +layout.server.ts
// via REST (PRD §6.3 aggregate call). The +layout.svelte still reads
// `data.countryCode` defensively; expose an empty default so the prop
// type stays satisfied without re-introducing the legacy plumbing.
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		countryCode: 'FR',
		locale: locals.locale
	};
};
