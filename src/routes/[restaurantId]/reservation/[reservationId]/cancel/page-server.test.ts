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
	},
	fail: (status: number, data: Record<string, unknown>) => ({ status, data })
}));

vi.mock('$lib/utils/cancelCutoff', () => ({
	computeCutoff: vi.fn()
}));

vi.mock('$lib/utils/tz', () => ({
	tz: (v: string) => v || 'UTC'
}));

vi.mock('$lib/paraglide/messages', () => ({
	cancel_notAllowedReason: () => 'This reservation cannot be canceled.',
	cancel_reasonRequired: () => 'Please share a brief reason for cancelling.'
}));

import { load, actions } from './+page.server';
import { createWidgetApi } from '$lib/server/api/widget-api';
import { computeCutoff } from '$lib/utils/cancelCutoff';
import { buildMockWidgetApi, buildBookingDetailDTO, buildAggregateDTO } from '$lib/test/fixtures';
import type { BookingStatus } from '$lib/api-types';

const mockedCreateWidgetApi = vi.mocked(createWidgetApi);
const mockedComputeCutoff = vi.mocked(computeCutoff);

function loadEvent(restaurantId: string, reservationId: string) {
	return {
		params: { restaurantId, reservationId },
		url: new URL(`http://localhost/r/${restaurantId}/reservation/${reservationId}/cancel`)
	} as unknown as Parameters<typeof load>[0];
}

function actionEvent(restaurantId: string, reservationId: string, formData?: Record<string, string>) {
	const fd = new FormData();
	if (formData) {
		for (const [k, v] of Object.entries(formData)) {
			fd.append(k, v);
		}
	}
	return {
		params: { restaurantId, reservationId },
		request: { formData: () => Promise.resolve(fd) }
	} as unknown as Parameters<typeof actions.default>[0];
}

describe('cancel page load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedComputeCutoff.mockReturnValue({
			allowed: true,
			reason: null,
			cutoff: { date: '2026-06-01', time: '12:00' }
		});
	});

	const terminalStatuses: BookingStatus[] = ['arrived', 'seated', 'ended', 'no_show', 'canceled'];
	const nonTerminalStatuses: BookingStatus[] = ['to_confirm', 'waiting_list', 'confirmed', 'reconfirmed'];

	it.each(terminalStatuses)(
		'returns isTerminal true when booking status is %s',
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

			const result = await load(loadEvent('42', '1'));
			expect(result.isTerminal).toBe(true);
		}
	);

	it.each(nonTerminalStatuses)(
		'returns isTerminal false when booking status is %s',
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

			const result = await load(loadEvent('42', '1'));
			expect(result.isTerminal).toBe(false);
		}
	);

	it('returns reservation data alongside isTerminal', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 10, status: 'arrived', pax: 4 })
			}),
			getAggregate: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAggregateDTO()
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await load(loadEvent('42', '10'));
		expect(result.isTerminal).toBe(true);
		expect(result.reservation.id).toBe('10');
		expect(result.reservation.pax).toBe(4);
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

describe('cancel page action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedComputeCutoff.mockReturnValue({
			allowed: true,
			reason: null,
			cutoff: { date: '2026-06-01', time: '12:00' }
		});
	});

	const terminalStatuses: BookingStatus[] = ['arrived', 'seated', 'ended', 'no_show', 'canceled'];

	it.each(terminalStatuses)(
		'returns fail(403) when booking status is %s',
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

			const result = await actions.default(actionEvent('42', '1', { reason: 'test' }));
			expect(result).toEqual({
				status: 403,
				data: { error: 'This reservation cannot be canceled.' }
			});
			expect(mockApi.setBookingStatus).not.toHaveBeenCalled();
		}
	);

	it('does not block cancellation when booking status is confirmed', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ status: 'confirmed' })
			}),
			getAggregate: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAggregateDTO()
			}),
			setBookingStatus: vi.fn().mockResolvedValue({ ok: true, data: {} })
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		await actions.default(actionEvent('42', '1', { reason: 'Changed plans' }));
		expect(mockApi.setBookingStatus).toHaveBeenCalledWith(1, 'canceled', {
			comment: 'Changed plans',
			cancelLate: false
		});
	});

	it('returns validation error when reason is empty', async () => {
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

		const result = await actions.default(actionEvent('42', '1', { reason: '' }));
		expect(result).toEqual({
			status: 400,
			data: expect.objectContaining({ reasonError: expect.any(String) })
		});
		expect(mockApi.setBookingStatus).not.toHaveBeenCalled();
	});
});
