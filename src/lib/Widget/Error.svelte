<script lang="ts">
	import { X } from 'phosphor-svelte';
	import { error } from '$lib/states/error.svelte';
	import { ApiReturnStatus } from '$lib/api-types';
	import * as m from '$lib/paraglide/messages';

	const localizedByCode = (code: string | null): string | null => {
		switch (code) {
			case 'CIVILITY_REQUIRED':
				return m.booking_civilityRequired();
			case 'COUNTRY_CODE_REQUIRED':
				return m.booking_phoneCountryRequired();
			case ApiReturnStatus.CUSTOMER_ALREADY_BOOKED_SERVICE:
				return m.booking_alreadyBooked();
			case 'LOAD_RESERVATION_ERROR':
				return m.error_loadReservation();
			case 'RESERVATION_NOT_FOUND':
				return m.error_reservationNotFound();
			case 'LOAD_PAYMENT_INTENT_ERROR':
				return m.error_loadPaymentIntent();
			case 'BOOKING_ID_MISSING':
				return m.payment_reservationNotFound();
			case 'BOOKING_RECONFIRM_FAILED':
				return m.payment_bookingReconfirmFailed();
			case 'RESERVATION_PAYLOAD_MISSING':
				return m.payment_reservationPayloadMissing();
			case 'BOOKING_CREATE_AFTER_PAYMENT_FAILED':
				return m.payment_createBookingFailed();
			case ApiReturnStatus.MODIFICATION_NOT_ALLOWED:
				return m.error_modificationNotAllowed();
			default:
				return null;
		}
	};

	const message = $derived(localizedByCode(error.code) ?? error.message ?? m.error_generic());
</script>

<div class="flex flex-col gap-4 items-center justify-center">
	<X size={80} color="red" />
	<p class="text-base font-medium" style:white-space="pre-line">{message}</p>
	{#if error.code}
		<p class="text-sm opacity-50">{error.code}</p>
	{/if}
</div>
