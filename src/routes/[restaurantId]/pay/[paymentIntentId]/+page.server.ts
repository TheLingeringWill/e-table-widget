export const load = async ({ locals, params }) => {
	const { paymentIntentId } = params;

	try {
		// Load payment intent from Stripe
		const stripePaymentIntent = await locals.reservator.loadStripePaymentIntent(
			paymentIntentId,
			locals.restaurant?.stripeAccountId ?? undefined
		);

		// Parse metadata to get reservation details
		const metadata = locals.reservator.parsePaymentIntentMetadata(stripePaymentIntent);

		// Load reservation if it exists
		let reservation = metadata.reservationId
			? await locals.reservator.loadReservationToUpdate(metadata.reservationId)
			: undefined;

		// If no reservation found, create one from metadata
		if (!reservation) {
			reservation = {
				serviceId: metadata.serviceId,
				startDate: metadata.date,
				pax: metadata.pax,
				notes: metadata.notes,
				contact: {
					firstName: metadata.contactFirstName,
					lastName: metadata.contactLastName,
					phone: metadata.contactPhone,
					email: metadata.contactEmail
				}
			};
		}

		return {
			paymentIntent: {
				id: stripePaymentIntent.id,
				client_secret: stripePaymentIntent.client_secret,
				amount: stripePaymentIntent.amount,
				status: stripePaymentIntent.status
			},
			reservation,
			stripeAccountId: locals.restaurant?.stripeAccountId ?? null,
			restaurant: {
				name: locals.restaurant?.name ?? ''
			}
		};
	} catch (error) {
		console.error('Failed to load payment intent:', error);
		return {
			error: 'Le paiement ne peut pas être chargé.'
		};
	}
};
