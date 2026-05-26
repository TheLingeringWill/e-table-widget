<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { Calendar, Clock, ForkKnife } from 'phosphor-svelte';
	import { formatSlotDate, formatSlotDateTime } from '$lib/utils/slotFormat';
	import * as m from '$lib/paraglide/messages';

	let { data, form } = $props();

	const { reservation, restaurant, widget, cancelStatus, cancelFlow, updateStatus } = data;

	let loading = $state(false);
	let success = $state(false);
	let error = $state(false);

	const alreadyCanceled = $derived(
		['USER_CANCELED', 'RESTAURANT_CANCELED'].includes(reservation.status)
	);

	function fmtCutoff(cutoff: { date: string; time: string }) {
		return {
			time: formatSlotDateTime(cutoff.date, cutoff.time, 'HH:mm'),
			date: formatSlotDateTime(cutoff.date, cutoff.time, 'D MMM YYYY')
		};
	}

	function formatCents(cents: number) {
		return (cents / 100).toFixed(2);
	}
</script>

<div class="min-h-screen bg-gray-50 flex md:items-center justify-center px-4 py-2 md:py-6 lg:py-8">
	<div
		class="max-w-md md:max-w-xl lg:max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 lg:p-7 space-y-3 md:space-y-4 h-fit"
	>
		<h1 class="text-xl font-semibold text-gray-900 text-center">
			{m.cancel_managementHeading()}
		</h1>

		<p class="text-sm text-gray-600 leading-snug">
			{m.cancel_managementIntro()} <strong class="font-semibold text-gray-900">{restaurant.name}</strong>. {m.cancel_managementSummary()}
		</p>

		<div class="grid grid-cols-3 gap-3 text-gray-900">
			<div class="flex items-center justify-center gap-2">
				<Calendar size={22} weight="regular" class="shrink-0" />
				<span class="text-sm font-medium leading-tight">
					{formatSlotDate(reservation.startDate.date, 'ddd D MMM YYYY')}
				</span>
			</div>
			<div class="flex items-center justify-center gap-2">
				<Clock size={22} weight="regular" class="shrink-0" />
				<span class="text-sm font-medium leading-tight">
					{reservation.startDate.time}
				</span>
			</div>
			<div class="flex items-center justify-center gap-2">
				<ForkKnife size={22} weight="bold" class="shrink-0" />
				<span class="text-sm font-medium leading-tight">
					{m.common_paxCount({ pax: reservation.pax })}
				</span>
			</div>
		</div>

		<div class="rounded-xl border border-gray-200 divide-y divide-gray-200 overflow-hidden">
			<div class="flex justify-between items-center px-4 py-2.5 md:py-3 text-sm">
				<span class="text-gray-700">{m.details_firstName()}</span>
				<span class="text-gray-900 font-medium text-right">
					{reservation.firstName || '—'}
				</span>
			</div>
			<div class="flex justify-between items-center px-4 py-2.5 md:py-3 text-sm">
				<span class="text-gray-700">{m.details_lastName()}</span>
				<span class="text-gray-900 font-medium text-right">
					{reservation.lastName || '—'}
				</span>
			</div>
			<div class="flex justify-between items-center px-4 py-2.5 md:py-3 text-sm">
				<span class="text-gray-700">{m.details_email()}</span>
				<span class="text-gray-900 font-medium text-right break-all ml-3">
					{reservation.email || '—'}
				</span>
			</div>
			<div class="flex justify-between items-center px-4 py-2.5 md:py-3 text-sm">
				<span class="text-gray-700">{m.details_phone()}</span>
				<span class="text-gray-900 font-medium text-right">
					{reservation.phone || '—'}
				</span>
			</div>
		</div>

		{#if success || alreadyCanceled}
			<div
				class="rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium px-4 py-3 text-center"
			>
				{m.cancel_canceled()}
			</div>
			{#if widget}
				<button
					type="button"
					onclick={() => goto(`/${widget.id}`)}
					class="w-full py-2.5 md:py-3 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50 transition-colors text-sm"
				>
					{m.cancel_makeAnother()}
				</button>
			{/if}
		{:else if data.isTerminal}
			<div
				class="rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-3 text-center"
			>
				{m.manage_terminalStatus()}
			</div>
			{#if widget}
				<button
					type="button"
					onclick={() => goto(`/${widget.id}`)}
					class="w-full py-2.5 md:py-3 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50 transition-colors text-sm"
				>
					{m.cancel_makeAnother()}
				</button>
			{/if}
		{:else if cancelFlow.inPast}
			<div
				class="rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-3 text-center"
			>
				{m.manage_pastBooking()}
			</div>
			{#if widget}
				<button
					type="button"
					onclick={() => goto(`/${widget.id}`)}
					class="w-full py-2.5 md:py-3 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50 transition-colors text-sm"
				>
					{m.cancel_makeAnother()}
				</button>
			{/if}
		{:else}
			<div class="space-y-3">
				{#if updateStatus.allowed}
					<p class="text-sm md:text-[15px] font-semibold text-gray-900">{m.cancel_modifyIntro()}</p>
				{:else if updateStatus.reason === 'past_cutoff'}
					<p class="text-sm font-semibold text-amber-700">{m.manage_modifyNoLongerPossible()}</p>
				{:else if updateStatus.reason === 'in_past'}
					<p class="text-sm font-semibold text-gray-900">{m.manage_pastBooking()}</p>
				{:else}
					<p class="text-sm font-semibold text-gray-900">{m.manage_modifyNotAllowed()}</p>
				{/if}

				<button
					type="button"
					disabled={!updateStatus.allowed}
					onclick={() => goto(`/${restaurant.id}/reservation/${reservation.id}`)}
					class="w-full py-2.5 md:py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
				>
					{m.cancel_modifyButton()}
				</button>
			</div>

			<div class="space-y-3">
				{#if cancelFlow.masterDisabled}
					<p class="text-sm font-semibold text-gray-900">{m.cancel_notAllowed()}</p>
				{:else if cancelFlow.inPast}
					<p class="text-sm font-semibold text-gray-900">{m.manage_pastBooking()}</p>
				{:else if cancelFlow.isLate}
					<div
						class="rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm px-4 py-3 space-y-2"
					>
						<p class="font-semibold">{m.cancel_lateWarningHeading()}</p>
						<p>{m.cancel_lateWarningBody()}</p>
						{#if cancelFlow.imprint}
							<p class="font-medium">
								{m.cancel_lateImprintNotice({
									amount: formatCents(cancelFlow.imprint.amountCents)
								})}
							</p>
						{/if}
					</div>
				{/if}

				{#if cancelFlow.canCancel}
					<p class="text-sm md:text-[15px] font-semibold text-gray-900">{m.cancel_cancelIntro()}</p>
				{/if}

				{#if error || form?.error}
					<div
						class="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3"
					>
						{form?.error ?? m.cancel_error()}
					</div>
				{/if}

				{#if cancelFlow.canCancel}
					{#key form}
						<form
							method="POST"
							use:enhance={() => {
								loading = true;
								error = false;
								return async ({ result, update }) => {
									loading = false;
									if (result.type === 'success') {
										success = true;
										await invalidate('app:reservation');
									} else if (result.type === 'failure') {
										await update({ reset: false });
									} else {
										error = true;
										await update({ reset: false });
									}
								};
							}}
							class="space-y-2"
						>
							<input
								type="text"
								id="cancel-reason"
								name="reason"
								required
								maxlength="500"
								aria-label={m.cancel_reasonLabel()}
								placeholder={m.cancel_reasonLabel()}
								value={form?.reason ?? ''}
								class="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							/>
							{#if form?.reasonError}
								<p class="text-red-600 text-xs">{form.reasonError}</p>
							{/if}
							<button
								type="submit"
								disabled={loading}
								class="w-full py-2.5 md:py-3 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
							>
								{loading ? m.cancel_canceling() : m.cancel_cancelButton()}
							</button>
						</form>
					{/key}
				{/if}
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
