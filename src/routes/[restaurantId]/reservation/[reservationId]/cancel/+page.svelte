<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { Calendar, Clock, ForkKnife } from 'phosphor-svelte';
	import { formatSlotDate, formatSlotDateTime } from '$lib/utils/slotFormat';
	import * as m from '$lib/paraglide/messages';

	const { data } = $props();

	const { reservation, restaurant, widget, cancelStatus, updateStatus } = data;

	let loading = $state(false);
	let success = $state(false);
	let error = $state(false);

	const canceled = $derived(
		success || ['USER_CANCELED', 'RESTAURANT_CANCELED'].includes(reservation.status)
	);

	function fmtCutoff(cutoff: { date: string; time: string }) {
		return {
			time: formatSlotDateTime(cutoff.date, cutoff.time, 'HH:mm'),
			date: formatSlotDateTime(cutoff.date, cutoff.time, 'D MMM YYYY')
		};
	}
</script>

<div class="min-h-screen bg-gray-50 flex justify-center px-4 py-8">
	<div
		class="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6 h-fit"
	>
		<h1 class="text-xl font-semibold text-gray-900 text-center">
			{m.cancel_managementHeading()}
		</h1>

		<p class="text-sm text-gray-600 leading-relaxed">
			{m.cancel_managementIntro({ restaurant: restaurant.name })}
		</p>

		<div class="grid grid-cols-3 gap-3 text-gray-900">
			<div class="flex items-center gap-2">
				<Calendar size={22} weight="regular" />
				<span class="text-sm font-medium leading-tight">
					{formatSlotDate(reservation.startDate.date, 'ddd D MMM YYYY')}
				</span>
			</div>
			<div class="flex items-center gap-2">
				<Clock size={22} weight="regular" />
				<span class="text-sm font-medium leading-tight">
					{reservation.startDate.time}
				</span>
			</div>
			<div class="flex items-center gap-2">
				<ForkKnife size={22} weight="regular" />
				<span class="text-sm font-medium leading-tight">
					{m.common_paxCount({ pax: reservation.pax })}
				</span>
			</div>
		</div>

		<div class="rounded-xl border border-gray-200 divide-y divide-gray-200 overflow-hidden">
			<div class="flex justify-between items-center px-4 py-3 text-sm">
				<span class="text-gray-700">{m.details_firstName()}</span>
				<span class="text-gray-900 font-medium text-right">
					{reservation.firstName || '—'}
				</span>
			</div>
			<div class="flex justify-between items-center px-4 py-3 text-sm">
				<span class="text-gray-700">{m.details_lastName()}</span>
				<span class="text-gray-900 font-medium text-right">
					{reservation.lastName || '—'}
				</span>
			</div>
			<div class="flex justify-between items-center px-4 py-3 text-sm">
				<span class="text-gray-700">{m.details_email()}</span>
				<span class="text-gray-900 font-medium text-right break-all ml-3">
					{reservation.email || '—'}
				</span>
			</div>
			<div class="flex justify-between items-center px-4 py-3 text-sm">
				<span class="text-gray-700">{m.details_phone()}</span>
				<span class="text-gray-900 font-medium text-right">
					{reservation.phone || '—'}
				</span>
			</div>
		</div>

		{#if canceled}
			<div
				class="rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium px-4 py-3 text-center"
			>
				{m.cancel_canceled()}
			</div>
			{#if widget}
				<button
					type="button"
					onclick={() => goto(`/${widget.id}`)}
					class="w-full py-3 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50 transition-colors text-sm"
				>
					{m.cancel_makeAnother()}
				</button>
			{/if}
		{:else}
			<div class="space-y-2">
				<p class="text-sm text-gray-700">{m.cancel_modifyIntro()}</p>

				{#if updateStatus.allowed}
					<p class="text-xs text-gray-500">
						{m.manage_modifyAllowedUntil(fmtCutoff(updateStatus.cutoff))}
					</p>
				{:else if updateStatus.reason === 'past_cutoff'}
					<p class="text-xs text-amber-700">
						{m.manage_modifyNoLongerPossible(fmtCutoff(updateStatus.cutoff))}
					</p>
				{:else if updateStatus.reason === 'in_past'}
					<p class="text-xs text-gray-500">{m.manage_pastBooking()}</p>
				{:else}
					<p class="text-xs text-gray-500">{m.manage_modifyNotAllowed()}</p>
				{/if}

				<button
					type="button"
					disabled={!updateStatus.allowed}
					onclick={() => goto(`/${restaurant.id}/reservation/${reservation.id}`)}
					class="w-full py-3 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
				>
					{m.cancel_modifyButton()}
				</button>
			</div>

			<div class="space-y-2">
				<p class="text-sm text-gray-700">{m.cancel_cancelIntro()}</p>

				{#if cancelStatus.allowed}
					<p class="text-xs text-gray-500">
						{m.cancel_allowedUntil(fmtCutoff(cancelStatus.cutoff))}
					</p>
				{:else if cancelStatus.reason === 'past_cutoff'}
					<p class="text-xs text-amber-700">
						{m.cancel_pastCutoff(fmtCutoff(cancelStatus.cutoff))}
					</p>
				{:else if cancelStatus.reason === 'in_past'}
					<p class="text-xs text-gray-500">{m.manage_pastBooking()}</p>
				{:else}
					<p class="text-xs text-gray-500">{m.cancel_notAllowed()}</p>
				{/if}

				{#if error}
					<div
						class="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3"
					>
						{m.cancel_error()}
					</div>
				{/if}
				<form
					method="POST"
					use:enhance={() => {
						loading = true;
						error = false;
						return async ({ result }) => {
							loading = false;
							if (result.type === 'success') {
								success = true;
								await invalidate('app:reservation');
							} else {
								error = true;
							}
						};
					}}
				>
					<button
						type="submit"
						disabled={loading || !cancelStatus.allowed}
						class="w-full py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
					>
						{loading ? m.cancel_canceling() : m.cancel_cancelButton()}
					</button>
				</form>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
