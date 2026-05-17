<script lang="ts">
	import { X } from 'phosphor-svelte';
	import { error } from '$lib/states/error.svelte';
	import { ApiReturnStatus } from '$lib/api-types';
	import * as m from '$lib/paraglide/messages';

	// Codes raised by Booking.svelte. Codes from other call sites (Widget.svelte,
	// Payment.svelte) fall through to `error.message` until they're migrated.
	const localizedByCode = (code: string | null): string | null => {
		switch (code) {
			case 'CIVILITY_REQUIRED':
				return m.booking_civilityRequired();
			case 'COUNTRY_CODE_REQUIRED':
				return m.booking_phoneCountryRequired();
			case ApiReturnStatus.CUSTOMER_ALREADY_BOOKED_SERVICE:
				return m.booking_alreadyBooked();
			default:
				return null;
		}
	};

	const message = $derived(localizedByCode(error.code) ?? error.message ?? m.error_generic());
</script>

<div class="flex flex-col gap-4 items-center justify-center">
	<X size={80} color="red" />
	<p style:white-space="pre-line">{message}</p>
	{#if error.code}
		<p class="text-sm opacity-50">{error.code}</p>
	{/if}
</div>
