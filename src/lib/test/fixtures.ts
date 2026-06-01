import { vi } from 'vitest';
import type {
	BookingDetailResponseDTO,
	SlotAvailabilityResponseDTO,
	RestaurantAggregateResponseDTO,
	CreateBookingResponseDTO
} from '$lib/api-types';
import type { LiveShift, LiveSlot, LiveDay } from '$lib/server/api/adapters/service';
import type { WidgetApi } from '$lib/server/api/widget-api';

export function buildSlotAvailabilityDTO(
	overrides?: Partial<SlotAvailabilityResponseDTO>
): SlotAvailabilityResponseDTO {
	return {
		date: '2026-06-01',
		time: '19:00',
		closed: false,
		markedAsFull: false,
		possibleGuests: [1, 2, 3, 4, 5, 6],
		slotPax: 2,
		slotMaxPax: 20,
		servicePax: 5,
		serviceMaxPax: 100,
		captureEnabled: null,
		captureAmountPerPax: null,
		captureThreshold: null,
		foreignCaptureEnabled: null,
		foreignCaptureAmountPerPax: null,
		...overrides
	};
}

export function buildBookingDetailDTO(
	overrides?: Partial<BookingDetailResponseDTO>
): BookingDetailResponseDTO {
	return {
		id: 1,
		restaurantId: 42,
		pax: 2,
		date: '2026-06-01',
		time: '19:00',
		seatingTime: 90,
		status: 'confirmed',
		source: 'web',
		availableTransitions: [],
		cancelLate: false,
		civility: 'mr',
		countryCode: 'FR',
		firstName: 'Jean',
		lastName: 'Dupont',
		email: 'jean@example.com',
		phone: '+33612345678',
		shiftSlot: {
			slotId: 200,
			shift: {
				id: 100,
				name: 'Dinner',
				startTime: '19:00',
				endTime: '23:00',
				cancellable: true,
				cancellableBefore: 24,
				cancellableBeforeReference: 'service',
				updatable: true,
				updatableBefore: 24,
				updatableWithPayment: false
			}
		},
		paymentStatus: null,
		...overrides
	};
}

export function buildLiveSlot(overrides?: Partial<LiveSlot>): LiveSlot {
	return {
		id: 200,
		time: '19:00',
		closed: false,
		markedAsFull: false,
		waitlistEnabled: false,
		slotPax: 2,
		slotMaxPax: 20,
		servicePax: 5,
		serviceMaxPax: 100,
		possibleGuests: [1, 2, 3, 4, 5, 6],
		captureEnabled: null,
		captureAmountPerPax: null,
		captureThreshold: null,
		foreignCaptureEnabled: null,
		foreignCaptureAmountPerPax: null,
		...overrides
	};
}

export function buildLiveShift(overrides?: Partial<LiveShift>): LiveShift {
	return {
		id: 100,
		name: 'Dinner',
		startTime: '19:00',
		endTime: '23:00',
		minPaxPerBooking: 1,
		maxPaxPerBooking: 10,
		bookable: true,
		waitlistEnabled: false,
		markedAsFull: false,
		autoConfirm: false,
		autoConfirmMaxPax: null,
		captureEnabled: false,
		captureAmountPerPax: 0,
		captureThreshold: 0,
		foreignCaptureEnabled: false,
		foreignCaptureAmountPerPax: 0,
		slots: [],
		...overrides
	};
}

export function buildLiveDay(overrides?: Partial<LiveDay>): LiveDay {
	return {
		date: '2026-06-01',
		shifts: [],
		...overrides
	};
}

export function buildAvailabilitiesResponse(days: LiveDay[]) {
	return { data: days };
}

export function buildBookInput(overrides?: {
	reservation?: Record<string, unknown>;
	paymentIntentId?: string;
	joiningWaitlist?: boolean;
}) {
	return {
		reservation: {
			restaurantId: '42',
			serviceId: '100',
			pax: 2,
			date: { date: '2026-06-01', time: '19:00' },
			notes: '',
			contact: {
				civility: 'mr' as const,
				countryCode: 'FR',
				firstName: 'Jean',
				lastName: 'Dupont',
				phone: '+33612345678',
				email: 'jean@example.com'
			},
			...overrides?.reservation
		},
		paymentIntentId: overrides?.paymentIntentId,
		joiningWaitlist: overrides?.joiningWaitlist
	};
}

export function buildAggregateDTO(
	overrides?: Partial<RestaurantAggregateResponseDTO>
): RestaurantAggregateResponseDTO {
	return {
		restaurant: {
			id: 42,
			name: 'Le Bistrot',
			timezone: 'Europe/Paris',
			address: '1 Rue de Rivoli',
			city: 'Paris',
			zipCode: '75001',
			countryCode: 'FR',
			phone: '+33140000000',
			email: 'contact@bistrot.fr'
		},
		payment: { status: 'connected' },
		messaging: {},
		review: { reviewRedirectThreshold: 4 },
		widget: {
			id: 1,
			restaurantId: 42,
			title: 'Le Bistrot',
			color: '#1a1a1a',
			gtmEnabled: false,
			translations: [
				{
					id: 1,
					language: 'fr',
					description: 'Bienvenue au Bistrot',
					createdAt: '2026-01-01T00:00:00Z',
					updatedAt: '2026-01-01T00:00:00Z'
				}
			],
			createdAt: '2026-01-01T00:00:00Z',
			updatedAt: '2026-01-01T00:00:00Z'
		},
		...overrides
	};
}

export function buildMockWidgetApi(
	overrides?: Partial<Record<keyof WidgetApi, unknown>>
): WidgetApi {
	return {
		getAggregate: vi.fn().mockResolvedValue({ ok: true, data: buildAggregateDTO() }),
		getWidget: vi.fn().mockResolvedValue({ ok: true, data: {} }),
		getAvailabilities: vi.fn().mockResolvedValue({ ok: true, data: { data: [] } }),
		getBooking: vi.fn().mockResolvedValue({ ok: true, data: buildBookingDetailDTO() }),
		createBooking: vi
			.fn()
			.mockResolvedValue({ ok: true, data: { id: 1, status: 'confirmed' } }),
		updateBooking: vi
			.fn()
			.mockResolvedValue({ ok: true, data: { id: 99, status: 'confirmed' } }),
		setBookingStatus: vi
			.fn()
			.mockResolvedValue({ ok: true, data: { status: 'reconfirmed' } }),
		upsertReview: vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
		getReviewSettings: vi.fn().mockResolvedValue({ ok: true, data: {} }),
		trackReviewArgVisit: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
		getPaymentIntent: vi.fn().mockResolvedValue({ ok: true, data: {} }),
		createPaymentIntent: vi.fn().mockResolvedValue({ ok: true, data: {} }),
		...overrides
	} as unknown as WidgetApi;
}

export function buildMockRequestEvent(overrides?: {
	restaurantId?: string;
	locale?: string;
	params?: Record<string, string>;
}) {
	const rid = overrides?.restaurantId ?? '42';
	return {
		request: {
			headers: new Headers({ 'x-resto': rid })
		},
		params: overrides?.params ?? {},
		locals: {
			locale: overrides?.locale ?? 'fr'
		}
	} as unknown as import('@sveltejs/kit').RequestEvent;
}
