declare global {
	namespace App {
		// interface Error {}

		interface PageData {
			countryCode?: string | null;
			locale?: 'en' | 'fr' | 'de' | 'es' | 'pt';
		}
		// interface PageState {}

		interface Locals {
			restaurantId?: string;
			countryCode?: string | null;
			locale: 'en' | 'fr' | 'de' | 'es' | 'pt';
		}
	}
}

export {};
