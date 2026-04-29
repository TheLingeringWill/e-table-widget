// Server-only. Typed methods over the REST API — the only entry point widget
// server code (load functions, form actions, hooks) should use to talk to the API.
// All authentication, error mapping, and DTO ↔ widget-state normalization happens here.

import { restCall, type RestResult } from './rest-client';
import type {
	BookingDetailResponseDTO,
	BookingStatus,
	CreateBookingRequestDTO,
	CreateBookingResponseDTO,
	PaymentIntentResponseDTO,
	RestaurantAggregateResponseDTO,
	ReviewSettingsResponseDTO,
	ServiceResponseDTO,
	SlotAvailabilityResponseDTO,
	UpsertReviewRequestDTO,
	WidgetResponseDTO
} from './types';

export type WidgetApi = ReturnType<typeof createWidgetApi>;

export function createWidgetApi(restaurantId: number) {
	return {
		getAggregate(): Promise<RestResult<RestaurantAggregateResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/aggregate`, { restaurantId });
		},
		getWidget(): Promise<RestResult<WidgetResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/widget`, { restaurantId });
		},
		getServices(params: {
			startDate: string;
			endDate: string;
		}): Promise<RestResult<ServiceResponseDTO[]>> {
			return restCall(`/restaurants/${restaurantId}/services/`, {
				restaurantId,
				query: { start_date: params.startDate, end_date: params.endDate }
			});
		},
		getAvailabilities(params: {
			startDate: string;
			endDate: string;
		}): Promise<RestResult<SlotAvailabilityResponseDTO[]>> {
			return restCall(`/restaurants/${restaurantId}/availabilities/`, {
				restaurantId,
				query: { startDate: params.startDate, endDate: params.endDate }
			});
		},
		getBooking(id: number): Promise<RestResult<BookingDetailResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/bookings/${id}`, { restaurantId });
		},
		createBooking(
			body: CreateBookingRequestDTO
		): Promise<RestResult<CreateBookingResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/bookings/`, {
				restaurantId,
				method: 'POST',
				body
			});
		},
		updateBooking(
			id: number,
			body: CreateBookingRequestDTO
		): Promise<RestResult<BookingDetailResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/bookings/${id}`, {
				restaurantId,
				method: 'PUT',
				body
			});
		},
		setBookingStatus(
			id: number,
			status: BookingStatus
		): Promise<RestResult<BookingDetailResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/bookings/${id}/status`, {
				restaurantId,
				method: 'PATCH',
				body: { status }
			});
		},
		upsertReview(body: UpsertReviewRequestDTO): Promise<RestResult<{ id: number }>> {
			return restCall(`/restaurants/${restaurantId}/reviews/upsert`, {
				restaurantId,
				method: 'POST',
				body
			});
		},
		getReviewSettings(): Promise<RestResult<ReviewSettingsResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/review-settings`, { restaurantId });
		},
		// PRD §9.2: not yet implemented in the live API. The mock under
		// src/lib/server/api/mocks/payment-intent.ts intercepts this when
		// WIDGET_PAYMENT_MOCK_MODE is set.
		getPaymentIntent(id: string): Promise<RestResult<PaymentIntentResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/payment-intents/${id}`, { restaurantId });
		}
	};
}
