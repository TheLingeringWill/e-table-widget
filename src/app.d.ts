declare global {
	namespace App {
		// interface Error {}

		interface PageData {
			countryCode?: string | null;
		}
		// interface PageState {}

		interface Locals {
			restaurantId?: string;
			countryCode?: string | null;
		}
	}
}

export {};
