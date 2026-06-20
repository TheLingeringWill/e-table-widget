import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('$lib/server/api/widget-api', () => ({
	createWidgetApi: vi.fn()
}));

import { router } from './rpc-router';
import { createWidgetApi } from '$lib/server/api/widget-api';
import { ApiReturnStatus } from '$lib/api-types';
import {
	buildMockWidgetApi,
	buildMockRequestEvent,
	buildBookInput,
	buildBookingDetailDTO,
	buildLiveDay,
	buildLiveShift,
	buildLiveSlot,
	buildAvailabilitiesResponse
} from '$lib/test/fixtures';

const mockedCreateWidgetApi = vi.mocked(createWidgetApi);

function availWithShiftAndSlot(
	shiftOverrides: Record<string, unknown>,
	slotOverrides: Record<string, unknown>
) {
	return {
		ok: true as const,
		data: buildAvailabilitiesResponse([
			buildLiveDay({
				date: '2026-06-01',
				shifts: [
					buildLiveShift({
						id: 100,
						...shiftOverrides,
						slots: [buildLiveSlot({ time: '19:00', ...slotOverrides })]
					})
				]
			})
		])
	};
}

describe('router.book', () => {
	const event = buildMockRequestEvent();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	// --- Scenario 1: Standard slot, no deposit, auto-confirm ---
	it('creates booking with confirmed status when auto-confirm enabled', async () => {
		const mockApi = buildMockWidgetApi({
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(
					availWithShiftAndSlot({ autoConfirm: true, autoConfirmMaxPax: null }, {})
				),
			createBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 10, status: 'confirmed' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput();
		const result = await router.book.call(event, input);

		expect(result).toEqual({
			status: ApiReturnStatus.OK,
			paymentIntent: null,
			bookingStatus: 'confirmed',
			bookingId: '10'
		});
		expect(mockApi.createBooking).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'confirmed' }),
			{ force: false }
		);
	});

	// --- Scenario 2: Standard slot, no deposit, no auto-confirm ---
	it('creates booking with to_confirm status when no auto-confirm', async () => {
		const mockApi = buildMockWidgetApi({
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(availWithShiftAndSlot({ autoConfirm: false }, {})),
			createBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 11, status: 'to_confirm' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput();
		const result = await router.book.call(event, input);

		expect(result).toEqual({
			status: ApiReturnStatus.OK,
			paymentIntent: null,
			bookingStatus: 'to_confirm',
			bookingId: '11'
		});
		expect(mockApi.createBooking).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'to_confirm' }),
			{ force: true }
		);
	});

	// --- Scenario 3: Deposit-required slot (book phase with PI) ---
	it('creates booking with confirmed status when paymentIntentId + capture', async () => {
		const mockApi = buildMockWidgetApi({
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(
					availWithShiftAndSlot({ captureEnabled: true }, { captureEnabled: true })
				),
			createBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 12, status: 'confirmed' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput({ paymentIntentId: 'pi_123' });
		const result = await router.book.call(event, input);

		expect(result).toEqual({
			status: ApiReturnStatus.OK,
			paymentIntent: null,
			bookingStatus: 'confirmed',
			bookingId: '12'
		});
		expect(mockApi.createBooking).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'confirmed', paymentIntentId: 'pi_123' }),
			{ force: false }
		);
	});

	// --- Scenario 4: Full slot, waitlist enabled ---
	it('creates booking with waiting_list status and force=true when full + waitlist', async () => {
		const mockApi = buildMockWidgetApi({
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(
					availWithShiftAndSlot(
						{ waitlistEnabled: true },
						{ slotPax: 20, slotMaxPax: 20, waitlistEnabled: true }
					)
				),
			createBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 13, status: 'waiting_list' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput({ joiningWaitlist: true });
		const result = await router.book.call(event, input);

		expect(result).toEqual({
			status: ApiReturnStatus.OK,
			paymentIntent: null,
			bookingStatus: 'waiting_list',
			bookingId: '13'
		});
		expect(mockApi.createBooking).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'waiting_list' }),
			{ force: true }
		);
	});

	// --- Scenario 5: Full slot, no waitlist (falls through to default) ---
	it('creates booking with to_confirm when slot full but no waitlist', async () => {
		const mockApi = buildMockWidgetApi({
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(
					availWithShiftAndSlot(
						{ waitlistEnabled: false, autoConfirm: false },
						{ slotPax: 20, slotMaxPax: 20 }
					)
				),
			createBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 14, status: 'to_confirm' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput();
		const result = await router.book.call(event, input);

		expect(result.bookingStatus).toBe('to_confirm');
		expect(mockApi.createBooking).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'to_confirm' }),
			{ force: true }
		);
	});

	// --- Scenario 6: Modify existing, same slot, no deposit ---
	it('calls updateBooking (not createBooking) when reservation.id is set', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 99, paymentStatus: null })
			}),
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(availWithShiftAndSlot({ autoConfirm: true }, {})),
			updateBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 99, status: 'confirmed' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput({ reservation: { id: '99', seatingTime: 90 } });
		const result = await router.book.call(event, input);

		expect(result).toEqual({
			status: ApiReturnStatus.OK,
			paymentIntent: null,
			bookingStatus: 'confirmed',
			bookingId: '99'
		});
		expect(mockApi.updateBooking).toHaveBeenCalledWith(
			99,
			expect.objectContaining({ status: 'confirmed' })
		);
		expect(mockApi.createBooking).not.toHaveBeenCalled();
		expect(mockApi.getBooking).toHaveBeenCalledWith(99);
	});

	// --- Scenario 7: Modify to deposit-required slot (no existing PI) ---
	it('updates booking with confirmed + new paymentIntentId when moving to deposit slot', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 99, paymentStatus: null })
			}),
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(
					availWithShiftAndSlot({ captureEnabled: true }, { captureEnabled: true })
				),
			updateBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 99, status: 'confirmed' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput({
			reservation: { id: '99', seatingTime: 90 },
			paymentIntentId: 'pi_new'
		});
		const result = await router.book.call(event, input);

		expect(result.bookingStatus).toBe('confirmed');
		expect(mockApi.updateBooking).toHaveBeenCalledWith(
			99,
			expect.objectContaining({
				status: 'confirmed',
				paymentIntentId: 'pi_new'
			})
		);
	});

	// --- Scenario 8: Modify, existing authorized PI ---
	it('resolves confirmed via existingHasAuthorizedPI when existing booking has requires_capture', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 99, paymentStatus: 'requires_capture' })
			}),
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(
					availWithShiftAndSlot(
						{ captureEnabled: true, autoConfirm: false },
						{ captureEnabled: true }
					)
				),
			updateBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 99, status: 'confirmed' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput({ reservation: { id: '99', seatingTime: 90 } });
		const result = await router.book.call(event, input);

		expect(result.bookingStatus).toBe('confirmed');
		expect(mockApi.updateBooking).toHaveBeenCalledWith(
			99,
			expect.objectContaining({ status: 'confirmed' })
		);
	});

	// --- Scenario 9: Modify to non-deposit slot, existing authorized PI ---
	it('uses slot rules (not PI path) when moving to non-deposit slot despite existing PI', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 99, paymentStatus: 'requires_capture' })
			}),
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(
					availWithShiftAndSlot(
						{ captureEnabled: false, foreignCaptureEnabled: false, autoConfirm: true },
						{ captureEnabled: false, foreignCaptureEnabled: false }
					)
				),
			updateBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 99, status: 'confirmed' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput({ reservation: { id: '99', seatingTime: 90 } });
		const result = await router.book.call(event, input);

		// Confirmed via autoConfirm, NOT via PI+capture path (since capture is disabled on target)
		expect(result.bookingStatus).toBe('confirmed');
		expect(mockApi.updateBooking).toHaveBeenCalledWith(
			99,
			expect.objectContaining({ status: 'confirmed', paymentIntentId: null })
		);
	});

	// --- Scenario 10: Modification blocked when resolved status is waiting_list ---
	it('returns MODIFICATION_NOT_ALLOWED when modifying to waitlist slot', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 99, paymentStatus: null })
			}),
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(
					availWithShiftAndSlot(
						{ waitlistEnabled: true, autoConfirm: false },
						{ slotPax: 20, slotMaxPax: 20, waitlistEnabled: true }
					)
				)
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput({
			reservation: { id: '99', seatingTime: 90 },
			joiningWaitlist: true
		});
		const result = await router.book.call(event, input);

		expect(result).toEqual({ status: ApiReturnStatus.MODIFICATION_NOT_ALLOWED, message: null });
		expect(mockApi.updateBooking).not.toHaveBeenCalled();
	});

	// --- Scenario 11: Modification blocked when resolved status is to_confirm (no capture) ---
	it('returns MODIFICATION_NOT_ALLOWED when modifying to non-auto-confirm slot without capture', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 99, paymentStatus: null })
			}),
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(
					availWithShiftAndSlot(
						{ autoConfirm: false, waitlistEnabled: false, captureEnabled: false },
						{ captureEnabled: false }
					)
				)
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput({ reservation: { id: '99', seatingTime: 90 } });
		const result = await router.book.call(event, input);

		expect(result).toEqual({ status: ApiReturnStatus.MODIFICATION_NOT_ALLOWED, message: null });
		expect(mockApi.updateBooking).not.toHaveBeenCalled();
	});

	// --- Scenario 12: Modification allowed when resolved status is confirmed ---
	it('allows modification when slot resolves to confirmed (auto-confirm)', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 99, paymentStatus: null })
			}),
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(availWithShiftAndSlot({ autoConfirm: true }, {})),
			updateBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 99, status: 'confirmed' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput({ reservation: { id: '99', seatingTime: 90 } });
		const result = await router.book.call(event, input);

		expect(result.status).toBe(ApiReturnStatus.OK);
		expect(result.bookingStatus).toBe('confirmed');
		expect(mockApi.updateBooking).toHaveBeenCalled();
	});

	// --- Scenario 13: New booking to waitlist still works (guard is modification-only) ---
	it('allows new booking to waitlist (guard only applies to modifications)', async () => {
		const mockApi = buildMockWidgetApi({
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(
					availWithShiftAndSlot(
						{ waitlistEnabled: true },
						{ slotPax: 20, slotMaxPax: 20, waitlistEnabled: true }
					)
				),
			createBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 20, status: 'waiting_list' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput({ joiningWaitlist: true });
		const result = await router.book.call(event, input);

		expect(result.status).toBe(ApiReturnStatus.OK);
		expect(result.bookingStatus).toBe('waiting_list');
		expect(mockApi.createBooking).toHaveBeenCalled();
	});

	// --- Scenario 14: Modification with existing PI to auto-confirm slot works ---
	it('allows modification with existing PI when slot auto-confirms', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 99, paymentStatus: 'requires_capture' })
			}),
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(
					availWithShiftAndSlot(
						{ autoConfirm: true, captureEnabled: false },
						{ captureEnabled: false }
					)
				),
			updateBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 99, status: 'confirmed' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput({ reservation: { id: '99', seatingTime: 90 } });
		const result = await router.book.call(event, input);

		expect(result.status).toBe(ApiReturnStatus.OK);
		expect(result.bookingStatus).toBe('confirmed');
		expect(mockApi.updateBooking).toHaveBeenCalled();
	});

	// --- Scenario 15: Modification allowed to capture-enabled, non-auto-confirm slot ---
	it('allows modification to to_confirm slot when capture is enabled', async () => {
		const mockApi = buildMockWidgetApi({
			getBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: buildBookingDetailDTO({ id: 99, paymentStatus: null })
			}),
			getAvailabilities: vi
				.fn()
				.mockResolvedValue(
					availWithShiftAndSlot(
						{ autoConfirm: false, waitlistEnabled: false, captureEnabled: true },
						{ captureEnabled: true }
					)
				),
			updateBooking: vi.fn().mockResolvedValue({
				ok: true,
				data: { id: 99, status: 'to_confirm' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput({ reservation: { id: '99', seatingTime: 90 } });
		const result = await router.book.call(event, input);

		expect(result.status).toBe(ApiReturnStatus.OK);
		expect(result.bookingStatus).toBe('to_confirm');
		expect(mockApi.updateBooking).toHaveBeenCalled();
	});

	// --- Error handling ---
	it('returns CUSTOMER_ALREADY_BOOKED_SERVICE on duplicate booking', async () => {
		const mockApi = buildMockWidgetApi({
			getAvailabilities: vi.fn().mockResolvedValue(availWithShiftAndSlot({}, {})),
			createBooking: vi.fn().mockResolvedValue({
				ok: false,
				error: { code: 'customer_already_booked_service', message: 'Already booked' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = buildBookInput();
		const result = await router.book.call(event, input);

		expect(result).toEqual({ status: ApiReturnStatus.CUSTOMER_ALREADY_BOOKED_SERVICE });
	});
});

describe('router.getDaySlots', () => {
	const event = buildMockRequestEvent();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	const input = (overrides?: Record<string, unknown>) => ({
		restaurantId: '42',
		pax: 2,
		date: '2026-06-01',
		...overrides
	});

	// --- Multi-shift grouping: one group per bookable shift, slots mapped ---
	it('returns one group per bookable shift with its slots', async () => {
		const mockApi = buildMockWidgetApi({
			getAvailabilities: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAvailabilitiesResponse([
					buildLiveDay({
						shifts: [
							buildLiveShift({
								id: 100,
								name: 'Lunch',
								slots: [buildLiveSlot({ time: '12:00' }), buildLiveSlot({ time: '12:30' })]
							}),
							buildLiveShift({
								id: 101,
								name: 'Dinner',
								slots: [buildLiveSlot({ time: '19:00' })]
							})
						]
					})
				])
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await router.getDaySlots.call(event, input());

		expect(result).toHaveLength(2);
		expect(result[0].service.id).toBe('100');
		expect(result[0].service.name[0].value).toBe('Lunch');
		expect(result[0].slots.map((s) => s.time)).toEqual(['12:00', '12:30']);
		expect(result[1].service.id).toBe('101');
		expect(result[1].slots.map((s) => s.time)).toEqual(['19:00']);
		// Each slot carries the requested pax + derived state + date.
		expect(result[0].slots[0]).toMatchObject({ date: '2026-06-01', pax: 2, state: 'AVAILABLE' });
	});

	// --- Pax filtering: pax-FULL slot kept (as FULL), closed slot dropped ---
	it('keeps a pax-unavailable slot as FULL and drops closed slots', async () => {
		const mockApi = buildMockWidgetApi({
			getAvailabilities: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAvailabilitiesResponse([
					buildLiveDay({
						shifts: [
							buildLiveShift({
								id: 100,
								slots: [
									buildLiveSlot({ time: '19:00', possibleGuests: [1] }), // pax 2 not allowed → FULL
									buildLiveSlot({ time: '19:30', closed: true }) // dropped
								]
							})
						]
					})
				])
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await router.getDaySlots.call(event, input({ pax: 2 }));

		expect(result).toHaveLength(1);
		expect(result[0].slots.map((s) => s.time)).toEqual(['19:00']);
		expect(result[0].slots[0].state).toBe('FULL');
	});

	// --- isModifying: confirmation-requiring slots filtered per shift ---
	it('drops confirmation-requiring slots when isModifying, per shift', async () => {
		const mockApi = buildMockWidgetApi({
			getAvailabilities: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAvailabilitiesResponse([
					buildLiveDay({
						shifts: [
							// to_confirm shift (no auto-confirm, no capture) → its slots require
							// confirmation → filtered out when modifying → group omitted.
							buildLiveShift({
								id: 100,
								name: 'ToConfirm',
								autoConfirm: false,
								captureEnabled: false,
								slots: [buildLiveSlot({ time: '12:00', captureEnabled: null })]
							}),
							// capture-enabled shift → its slot is guaranteed → survives.
							buildLiveShift({
								id: 101,
								name: 'Capture',
								autoConfirm: false,
								captureEnabled: true,
								slots: [buildLiveSlot({ time: '19:00', captureEnabled: true })]
							})
						]
					})
				])
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await router.getDaySlots.call(event, input({ isModifying: true }));

		expect(result).toHaveLength(1);
		expect(result[0].service.id).toBe('101');
		expect(result[0].slots.map((s) => s.time)).toEqual(['19:00']);
	});

	// --- Empty group omitted: a bookable shift with no surviving slots ---
	it('omits a bookable shift whose every slot is closed', async () => {
		const mockApi = buildMockWidgetApi({
			getAvailabilities: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAvailabilitiesResponse([
					buildLiveDay({
						shifts: [
							buildLiveShift({
								id: 100,
								name: 'AllClosed',
								slots: [buildLiveSlot({ time: '12:00', closed: true })]
							}),
							buildLiveShift({
								id: 101,
								name: 'Open',
								slots: [buildLiveSlot({ time: '19:00' })]
							})
						]
					})
				])
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await router.getDaySlots.call(event, input());

		expect(result).toHaveLength(1);
		expect(result[0].service.id).toBe('101');
	});

	// --- bookable:false shift excluded entirely ---
	it('excludes non-bookable shifts', async () => {
		const mockApi = buildMockWidgetApi({
			getAvailabilities: vi.fn().mockResolvedValue({
				ok: true,
				data: buildAvailabilitiesResponse([
					buildLiveDay({
						shifts: [
							buildLiveShift({
								id: 100,
								bookable: false,
								slots: [buildLiveSlot({ time: '12:00' })]
							}),
							buildLiveShift({
								id: 101,
								bookable: true,
								slots: [buildLiveSlot({ time: '19:00' })]
							})
						]
					})
				])
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const result = await router.getDaySlots.call(event, input());

		expect(result).toHaveLength(1);
		expect(result[0].service.id).toBe('101');
	});

	it('throws on invalid restaurant id', async () => {
		mockedCreateWidgetApi.mockReturnValue(buildMockWidgetApi({}));
		await expect(router.getDaySlots.call(event, input({ restaurantId: 'nope' }))).rejects.toThrow(
			'invalid restaurant id'
		);
	});
});

describe('router.createPaymentIntent', () => {
	const event = buildMockRequestEvent();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	// --- Scenario 3: PI creation succeeds ---
	it('returns PI details on success', async () => {
		const mockApi = buildMockWidgetApi({
			createPaymentIntent: vi.fn().mockResolvedValue({
				ok: true,
				data: {
					paymentIntentId: 'pi_abc',
					clientSecret: 'cs_abc',
					amountCents: 5000,
					stripeConnectAccountId: 'acct_123'
				}
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = {
			restaurantId: '42',
			date: { date: '2026-06-01', time: '19:00' },
			pax: 2,
			countryCode: 'FR'
		};
		const result = await router.createPaymentIntent.call(event, input);

		expect(result).toEqual({
			ok: true,
			paymentIntentId: 'pi_abc',
			clientSecret: 'cs_abc',
			amount: 5000,
			stripeAccountId: 'acct_123'
		});
	});

	// --- Scenarios 1 & 2: No deposit required (409) ---
	it('returns ok:false without throwing when no deposit required', async () => {
		const mockApi = buildMockWidgetApi({
			createPaymentIntent: vi.fn().mockResolvedValue({
				ok: false,
				error: { code: 'no_deposit_required', message: 'Not required' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = {
			restaurantId: '42',
			date: { date: '2026-06-01', time: '19:00' },
			pax: 2,
			countryCode: 'FR'
		};
		const result = await router.createPaymentIntent.call(event, input);

		expect(result).toEqual({
			ok: false,
			error: { code: 'no_deposit_required', message: 'Not required' }
		});
	});

	it('returns ok:false without throwing for http_409', async () => {
		const mockApi = buildMockWidgetApi({
			createPaymentIntent: vi.fn().mockResolvedValue({
				ok: false,
				error: { code: 'http_409', message: 'Conflict' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = {
			restaurantId: '42',
			date: { date: '2026-06-01', time: '19:00' },
			pax: 2,
			countryCode: 'FR'
		};
		const result = await router.createPaymentIntent.call(event, input);

		expect(result).toEqual({
			ok: false,
			error: { code: 'http_409', message: 'Conflict' }
		});
	});

	it('throws on non-409 errors', async () => {
		const mockApi = buildMockWidgetApi({
			createPaymentIntent: vi.fn().mockResolvedValue({
				ok: false,
				error: { code: 'stripe_error', message: 'Stripe down' }
			})
		});
		mockedCreateWidgetApi.mockReturnValue(mockApi);

		const input = {
			restaurantId: '42',
			date: { date: '2026-06-01', time: '19:00' },
			pax: 2,
			countryCode: 'FR'
		};

		await expect(router.createPaymentIntent.call(event, input)).rejects.toThrow('stripe_error');
	});
});
