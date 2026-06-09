// Server-only. Adapt a REST `ExperienceResponseDTO` into the legacy experience
// shape Selection.svelte consumes (string id, translation-array name/note).
// Mirrors adapters/service.ts and lives behind the BFF boundary.

import type { ExperienceResponseDTO, LegacyExperience } from '$lib/api-types';

// Turn the API's per-language translations into the widget's translation-array
// shape so `getTranslation()` resolves them exactly like service names.
function translationsToArray(
	translations: { language: string; name: string; note?: string | null }[],
	pick: 'name' | 'note'
) {
	return translations
		.map((tr) => ({
			id: tr.language,
			language: tr.language.toUpperCase(),
			value: pick === 'name' ? tr.name : (tr.note ?? ''),
			entity_id: tr.language
		}))
		.filter((entry) => entry.value.length > 0);
}

export function experienceToLegacyExperience(experience: ExperienceResponseDTO): LegacyExperience {
	return {
		id: String(experience.id),
		serviceId: String(experience.serviceId),
		imageUrl: experience.imageUrl ?? undefined,
		priceCents: experience.priceCents,
		paymentOption: experience.paymentOption,
		name: translationsToArray(experience.translations, 'name'),
		note: translationsToArray(experience.translations, 'note')
	};
}
