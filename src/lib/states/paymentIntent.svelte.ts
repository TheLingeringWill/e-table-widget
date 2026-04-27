export const paymentIntent: {
	id: string | null;
	clientSecret: string | null;
	amount: number | null;
	stripeAccountId: string | null;
} = $state({
	id: null,
	clientSecret: null,
	amount: null,
	stripeAccountId: null
});
