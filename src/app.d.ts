declare global {
	namespace App {
		// interface Error {}

		interface PageData {
			countryCode?: string;
		}
		// interface PageState {}

		interface Platform {
			env?: Record<string, string | undefined>;
		}

		interface Locals {
			restaurantId?: string;
			countryCode?: string;
		}
	}
}

export {};
