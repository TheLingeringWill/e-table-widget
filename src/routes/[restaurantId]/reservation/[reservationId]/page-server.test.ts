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

class Redirect extends Error {
	status: number;
	location: string;
	constructor(status: number, location: string) {
		super(`Redirect: ${status} ${location}`);
		this.status = status;
		this.location = location;
	}
}

vi.mock('@sveltejs/kit', () => ({
	error: (status: number) => {
		throw new HttpError(status);
	},
	redirect: (status: number, location: string) => {
		throw new Redirect(status, location);
	}
}));

vi.mock('$lib/utils/cancelCutoff', () => ({
	computeCutoff: vi.fn()
}));

vi.mock('$lib/utils/tz', () => ({
	tz: (v: string) => v || 'UTC'
}));

import { load } from './+page.server';
import { createWidgetApi } from '$lib/server/api/widget-api';
import { computeCutoff } from '$lib/utils/cancelCutoff';
import { buildMockWidgetApi, buildBookingDetailDTO, buildAggregateDTO } from '$lib/test/fixtures';
import type { BookingStatus } from '$lib/api-types';

const mockedCreateWidgetApi = vi.mocked(createWidgetApi);
const mockedComputeCutoff = vi.mocked(computeCutoff);

function loadEvent(restaurantId: string, reservationId: string) {
	return {
		params: { restaurantId, reservationId },
		url: new URL(`http://localhost/r/${restaurantId}/reservation/${reservationId}`)
	} as unknown as Parameters<typeof load>[0];
}

describe('reservation edit page load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedComputeCutoff.mockReturnValue({ allowed: true, reason: null, cutoff: { date: '2026-06-01', time: '12:00' } });
	});

	const terminalStatuses: BookingStatus[] = ['arrived', 'seated', 'ended', 'no_show', 'canceled'];

	it.each(terminalStatuses)(
		'redirects to cancel page when booking status is %s',
		async (status) => {
			const mockApi = buildMockWidgetApi({
				getBooking: vi.fn().mockResolvedValue({
					ok: true,
					data: buildBookingDetailDTO({ status })
				}),
				getAggregate: vi.fn().mockResolvedValue({
					ok: true,
					data: buildAggregateDTO()
				})
			});
			mockedCreateWidgetApi.mockReturnValue(mockApi);

			await expect(load(loadEvent('42', '1'))).rejects.toThrow(Redirect);
			try {
				await load(loadEvent('42', '1'));
			} catch (e) {
				expect(e).toBeInstanceOf(Redirect);
				expect((e as Redirect).status).toBe(303);
				expect((e as Redirect).location).toBe('/42/reservation/1/cancel');
			}
		}
	);

	it('does not redirect when booking status is confirmed', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ status: 'confirmed' })
			}),
			getAggregate: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAggregateDTO()
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await load(loadEvent('42', '1'));
		expect(result).toHaveProperty('builder');
	});

	it('does not redirect when booking status is to_confirm', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ status: 'to_confirm' })
			}),
			getAggregate: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAggregateDTO()
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await load(loadEvent('42', '1'));
		expect(result).toHaveProperty('builder');
	});

	it('throws 404 for invalid params', async () => {
		await expect(load(loadEvent('abc', '1'))).rejects.toThrow('HttpError: 404');
	});

	it('throws 404 when booking not found', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: false,
				error: { code: 'not_found', message: 'Not found' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		await expect(load(loadEvent('42', '999'))).rejects.toThrow('HttpError: 404');
	});
});
