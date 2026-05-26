import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('$lib/server/api/widget-api', () => ({
	createWidgetApi: vi.fn()
}));

class HttpError extends Error {
	status: number;
	constructor(status: number) {
		super(`HttpError: ${status}`);
		this.status = status;
	}
}

vi.mock('@sveltejs/kit', () => ({
	error: (status: number) => {
		throw new HttpError(status);
	}
}));

import { load } from './+page.server';
import { createWidgetApi } from '$lib/server/api/widget-api';
import {
	buildMockWidgetApi,
	buildBookingDetailDTO,
	buildAggregateDTO
} from '$lib/test/fixtures';

const mockedCreateWidgetApi = vi.mocked(createWidgetApi);

function loadEvent(restaurantId: string, reservationId: string) {
	return { params: { restaurantId, reservationId } } as unknown as Parameters<typeof load>[0];
}

describe('reconfirm page load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// --- Scenario 10: Booking confirmed → shows "confirmed" not "reconfirmed" ---
	it('returns displayState confirmed when booking status is confirmed', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({
					id: 50,
					status: 'confirmed',
					availableTransitions: ['reconfirmed', 'canceled']
				})
			}),
			getAggregate: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAggregateDTO()
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await load(loadEvent('42', '50'));

		expect(result.displayState).toBe('confirmed');
		expect(mockApi.setBookingStatus).not.toHaveBeenCalled();
		expect(result.reservation.status).toBe('confirmed');
	});

	it('returns displayState reconfirmed when booking is already reconfirmed', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 51, status: 'reconfirmed' })
			}),
			getAggregate: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAggregateDTO()
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await load(loadEvent('42', '51'));

		expect(result.displayState).toBe('reconfirmed');
		expect(mockApi.setBookingStatus).not.toHaveBeenCalled();
	});

	it('returns displayState canceled when booking is canceled', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 52, status: 'canceled' })
			}),
			getAggregate: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAggregateDTO()
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await load(loadEvent('42', '52'));

		expect(result.displayState).toBe('canceled');
		expect(mockApi.setBookingStatus).not.toHaveBeenCalled();
	});

	it('transitions to reconfirmed when availableTransitions includes reconfirmed', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({
					id: 53,
					status: 'to_confirm',
					availableTransitions: ['reconfirmed', 'canceled']
				})
			}),
			getAggregate: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAggregateDTO()
			}),
			setBookingStatus: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 53, status: 'reconfirmed' })
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await load(loadEvent('42', '53'));

		expect(result.displayState).toBe('reconfirmed');
		expect(mockApi.setBookingStatus).toHaveBeenCalledWith(53, 'reconfirmed');
	});

	it('returns displayState error when transition fails', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({
					id: 54,
					status: 'to_confirm',
					availableTransitions: ['reconfirmed']
				})
			}),
			getAggregate: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAggregateDTO()
			}),
			setBookingStatus: vi.fn().mockResolvedValue({
				ok: false,
				error: { code: 'transition_not_allowed', message: 'Already processed' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await load(loadEvent('42', '54'));

		expect(result.displayState).toBe('error');
		expect(result.errorCode).toBe('transition_not_allowed');
	});

	it('returns displayState terminal when reconfirmed not in transitions', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({
					id: 55,
					status: 'waiting_list',
					availableTransitions: ['confirmed', 'canceled']
				})
			}),
			getAggregate: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAggregateDTO()
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await load(loadEvent('42', '55'));

		expect(result.displayState).toBe('terminal');
		expect(mockApi.setBookingStatus).not.toHaveBeenCalled();
	});

	it('throws 404 when booking not found', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: false,
				error: { code: 'not_found', message: 'Not found' }
			}),
			getAggregate: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAggregateDTO()
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		await expect(load(loadEvent('42', '999'))).rejects.toThrow('HttpError: 404');
	});

	it('throws 404 for invalid params', async () => {
		const mockApi = buildMockWidgetApi();
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		await expect(load(loadEvent('abc', '50'))).rejects.toThrow('HttpError: 404');
	});
});
