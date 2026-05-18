declare global {
	namespace App {
		// interface Error {}

		interface PageData {
			countryCode?: string | null;
			locale?: 'en' | 'fr' | 'de';
		}
		// interface PageState {}

		interface Locals {
			restaurantId?: string;
			countryCode?: string | null;
			locale: 'en' | 'fr' | 'de';
		}
	}
}

export {};
