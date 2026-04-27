declare global {
	namespace App {
		// interface Error {}

		interface PageData {
			countryCode: string;
		}
		// interface PageState {}

		type _Locals = import('shared/locals').Locals;
		type _Platform = import('shared/locals').Platform;
		interface Platform extends _Platform {}

		interface Locals extends _Locals {
			api: import('svelte-rpc').API<import('./api/api').API>;
			countryCode: string;
		}
	}
}

export {};
