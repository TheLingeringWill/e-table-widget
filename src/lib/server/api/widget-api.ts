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
	CreateSetupIntentForExperienceRequestDTO,
	CreateSetupIntentRequestDTO,
	CreateSetupIntentResponseDTO,
	ExperienceResponseDTO,
	PaymentIntentResponseDTO,
	RestaurantAggregateResponseDTO,
	ReviewSettingsResponseDTO,
	RewardReviewRequestDTO,
	SetupIntentResponseDTO,
	TrackReviewArgVisitRequestDTO,
	UpdateBookingRequestDTO,
	UpsertReviewRequestDTO,
	WidgetAlternativeRestaurantResponseDTO,
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
		getWidgetAlternatives(): Promise<
			RestResult<{ restaurants: WidgetAlternativeRestaurantResponseDTO[] }>
		> {
			// Owner-curated sibling restaurants shown on the no-slot path. The API
			// returns `[]` when the toggle is off or the restaurant is ungrouped.
			return restCall(`/restaurants/${restaurantId}/widget/alternatives`, { restaurantId });
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
		createBooking(
			body: CreateBookingRequestDTO,
			opts?: { force?: boolean }
		): Promise<RestResult<CreateBookingResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/bookings`, {
				restaurantId,
				method: 'POST',
				body,
				query: opts?.force ? { force: 'true' } : undefined
			});
		},
		updateBooking(
			id: number,
			body: UpdateBookingRequestDTO
		): Promise<RestResult<BookingDetailResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/bookings/${id}`, {
				restaurantId,
				method: 'PUT',
				query: { 'with-confirmation': 'true' },
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
		rewardReview(body: RewardReviewRequestDTO): Promise<RestResult<void>> {
			return restCall(`/restaurants/${restaurantId}/reviews/reward`, {
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
		},
		getSetupIntent(id: string): Promise<RestResult<SetupIntentResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/setup-intents/${id}`, { restaurantId });
		},
		createSetupIntent(
			body: CreateSetupIntentRequestDTO
		): Promise<RestResult<CreateSetupIntentResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/setup-intents`, {
				restaurantId,
				method: 'POST',
				body
			});
		},
		createExperienceSetupIntent(
			body: CreateSetupIntentForExperienceRequestDTO
		): Promise<RestResult<CreateSetupIntentResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/setup-intents/experience`, {
				restaurantId,
				method: 'POST',
				body
			});
		},
		getExperiences(): Promise<RestResult<ExperienceResponseDTO[]>> {
			// All experiences for the restaurant; the BFF filters to the chosen
			// service before the UI sees them.
			return restCall(`/restaurants/${restaurantId}/experiences`, { restaurantId });
		},
		confirmSavedCard(
			id: number,
			setupIntentId: string
		): Promise<RestResult<BookingDetailResponseDTO>> {
			return restCall(`/restaurants/${restaurantId}/bookings/${id}/confirm-saved-card`, {
				restaurantId,
				method: 'PATCH',
				body: { setupIntentId }
			});
		}
	};
}
