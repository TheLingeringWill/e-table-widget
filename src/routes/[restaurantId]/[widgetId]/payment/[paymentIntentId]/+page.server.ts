export const load = async ({ locals, params, url }) => {
	return {
		builder: url.searchParams.get('builder') === 'true'
	};
};
