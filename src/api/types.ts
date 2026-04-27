import type { InferApiTypes } from 'svelte-rpc';
import type { API } from './api';

export type Service = InferApiTypes<API>['getServices']['output'][number];
export type Slot = InferApiTypes<API>['getServiceSlots']['output'][number];

export type DateRange = {
	start: Date;
	end: Date;
};

export const ApiReturnStatus = {
	OK: 'OK',
	RESERVATION_DATE_MISMATCH_SERVICE_TIME: 'RESERVATION_DATE_MISMATCH_SERVICE_TIME',
	CUSTOMER_ALREADY_BOOKED_SERVICE: 'CUSTOMER_ALREADY_BOOKED_SERVICE',
	REQUIRES_PAYMENT_INTENT: 'REQUIRES_PAYMENT_INTENT'
} as const;
