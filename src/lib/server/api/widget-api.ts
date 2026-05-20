// Server-only. Typed methods over the REST API — the only entry point widget
// server code (load functions, form actions, hooks) should use to talk to the API.
// All authentication, error mapping, and DTO ↔ widget-state normalization happens here.

import { restCall, type RestResult } from './rest-client';
import type {
	BookingDetailResponseDTO,
	BookingStatus,
	CreateBookingRequestDTO,
	CreateBookingResponseDTO,
	CreatePaymentIntentRequestDTO,
	CreatePaymentIntentResponseDTO,
	PaymentIntentResponseDTO,
	RestaurantAggregateResponseDTO,
	ReviewSettingsResponseDTO,
	TrackReviewArgVisitRequestDTO,
	UpdateBookingRequestDTO,
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
		getAvailabilities(params: {
			startDate: string;
			endDate: string;
		}): Promise<RestResult<{ data: Array<{ date: string; shifts: unknown[] }> }>> {
			// Live response is `{ data: [{ date, shifts: [{ slots: [] }] }] }`.
			return restCall(`/restaurants/${restaurantId}/availabilities`, {
				restaurantId,
				query: { startDate: params.startDate, endDate: params.endDate }
			});
		},
		getBooking(id: number): Promise<RestResult<BookingDetailResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/bookings/${id}`, { restaurantId });
		},
		createBooking(body: CreateBookingRequestDTO): Promise<RestResult<CreateBookingResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/bookings`, {
				restaurantId,
				method: 'POST',
				body
			});
		},
		updateBooking(
			id: number,
			body: UpdateBookingRequestDTO
		): Promise<RestResult<BookingDetailResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/bookings/${id}`, {
				restaurantId,
				method: 'PUT',
				body
			});
		},
		setBookingStatus(
			id: number,
			status: BookingStatus,
			options?: { comment?: string | null; cancelLate?: boolean }
		): Promise<RestResult<BookingDetailResponseDTO>> {
			const body: Record<string, unknown> = { status };
			if (options?.comment !== undefined) body.comment = options.comment;
			if (options?.cancelLate !== undefined) body.cancelLate = options.cancelLate;
			return restCall(`/restaurants/${restaurantId}/bookings/${id}/status`, {
				restaurantId,
				method: 'PATCH',
				body
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
		trackReviewArgVisit(body: TrackReviewArgVisitRequestDTO): Promise<RestResult<void>> {
			return restCall(`/restaurants/${restaurantId}/review-args/track`, {
				restaurantId,
				method: 'POST',
				body
			});
		},
		getPaymentIntent(id: string): Promise<RestResult<PaymentIntentResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/payment-intents/${id}`, { restaurantId });
		},
		createPaymentIntent(
			body: CreatePaymentIntentRequestDTO
		): Promise<RestResult<CreatePaymentIntentResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/payment-intents`, {
				restaurantId,
				method: 'POST',
				body
			});
		}
	};
}
