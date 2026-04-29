// Server-only. Mock for the §9.2 payment-intent flow that the live API does not yet expose.
// Hard rule from PRD §9.2: the mock lives ONLY here. No mock paths in UI components, no
// per-component `if (mock)` branches. When the API ships the real endpoints, delete this
// file and re-point the adapter — call sites do not change.
//
// Toggle via WIDGET_PAYMENT_MOCK_MODE:
//   - unset / "off"        → mock is inert; calls go to the real REST API.
//   - "stripe-test"        → BFF synthesizes the booking-side bookkeeping but mints a real
//                            Stripe test-mode PaymentIntent so Stripe Elements has something
//                            live to talk to. (Default when the flag is set without a value.)
//   - "full"               → fully synthesized client_secret of the form pi_mock_*; Stripe
//                            Elements will reject it. Useful for headless CI where Stripe is
//                            not in scope.
//
// All env reads come from $env/static/private; this file may not be imported from client code.

import { env } from '$env/dynamic/private';
import type { PaymentIntentResponseDTO } from '../types';

export type PaymentMockMode = 'off' | 'stripe-test' | 'full';

export function getMockMode(): PaymentMockMode {
	const raw = env.WIDGET_PAYMENT_MOCK_MODE?.trim().toLowerCase();
	if (!raw || raw === 'off') return 'off';
	if (raw === 'full') return 'full';
	return 'stripe-test';
}

type MockRecord = {
	bookingId: number;
	clientSecret: string;
	amountCents: number;
	status: PaymentIntentResponseDTO['status'];
};

const store = new Map<string, MockRecord>();

function randomSuffix(): string {
	return Math.random().toString(36).slice(2, 10);
}

export function synthesizePaymentIntent(
	bookingId: number,
	amountCents: number
): { stripePaymentIntentId: string; clientSecret: string } {
	const stripePaymentIntentId = `pi_mock_${bookingId}`;
	const clientSecret = `pi_mock_${bookingId}_secret_${randomSuffix()}`;
	store.set(stripePaymentIntentId, {
		bookingId,
		clientSecret,
		amountCents,
		status: 'requires_payment_method'
	});
	return { stripePaymentIntentId, clientSecret };
}

export function readMockPaymentIntent(id: string): PaymentIntentResponseDTO | undefined {
	const record = store.get(id);
	if (!record) return undefined;
	return {
		clientSecret: record.clientSecret,
		amountCents: record.amountCents,
		bookingId: record.bookingId,
		status: record.status
	};
}

export function confirmMockPayment(
	stripePaymentIntentId: string
): PaymentIntentResponseDTO | undefined {
	const record = store.get(stripePaymentIntentId);
	if (!record) return undefined;
	record.status = 'succeeded';
	return readMockPaymentIntent(stripePaymentIntentId);
}
