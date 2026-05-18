declare global {
	namespace App {
		// interface Error {}

		interface PageData {
			countryCode?: string | null;
			locale?: 'en' | 'fr' | 'de' | 'es';
		}
		// interface PageState {}

		interface Locals {
			restaurantId?: string;
			countryCode?: string | null;
			locale: 'en' | 'fr' | 'de' | 'es';
		}
	}
}

export {};
