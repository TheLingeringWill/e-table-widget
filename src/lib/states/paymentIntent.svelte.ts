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

// Saved-card (SetupIntent) state — the migration's replacement for the manual
// PaymentIntent hold above. Mirrors the paymentIntent store shape but carries no
// customer id. The legacy `paymentIntent` store is kept intact for backward
// compatibility; the widget now defaults to this saved-card path.
export const setupIntent: {
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
