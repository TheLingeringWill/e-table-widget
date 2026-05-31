// PRD §7 Phase 4: drop the createLocals plumbing — `restaurant` and
// `countryCode` no longer come from the in-process Reservator path. The
// widget gets its restaurant data from the per-restaurant +layout.server.ts
// via REST (PRD §6.3 aggregate call). For the phone field's initial country we
// pass through `locals.countryCode` (set by hooks.server.ts from the
// CloudFront/X-Country geo headers), falling back to 'FR' when absent — so a
// foreign visitor gets their own country pre-selected in the picker.
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		countryCode: locals.countryCode ?? 'FR',
		locale: locals.locale
	};
};
