export const load = async ({ locals }) => {
	return {
		restaurant: locals.restaurant,
		countryCode: locals.countryCode
	};
};
