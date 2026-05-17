<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { formatSlotDateTime } from '$lib/utils/slotFormat';
	import HourglassSimple from 'phosphor-svelte/lib/HourglassSimple';
	import Check from 'phosphor-svelte/lib/Check';
	import X from 'phosphor-svelte/lib/X';
	import * as m from '$lib/paraglide/messages';

	let { data, form } = $props();

	const reservation = $derived(data.reservation);
	const restaurant = $derived(data.restaurant);

	let submitting = $state<null | 'confirm' | 'cancel'>(null);

	const resolvedAction = $derived<null | 'confirm' | 'cancel'>(
		reservation.status === 'reconfirmed' || reservation.status === 'confirmed'
			? 'confirm'
			: reservation.status === 'canceled'
				? 'cancel'
				: form?.success && form.action === 'confirm'
					? 'confirm'
					: form?.success && form.action === 'cancel'
						? 'cancel'
						: null
	);

	const canConfirm = $derived(reservation.availableTransitions.includes('reconfirmed'));
	const canCancel = $derived(reservation.availableTransitions.includes('canceled'));

	const actionError = $derived(form && form.success === false ? form : null);
	const errorCopy = $derived(
		actionError?.code === 'transition_not_allowed'
			? m.reconfirm_alreadyProcessed()
			: actionError?.code === 'not_found'
				? m.error_reservationNotFound()
				: actionError
					? m.reconfirm_genericError()
					: ''
	);

	const dateShort = $derived(
		formatSlotDateTime(reservation.startDate.date, reservation.startDate.time, 'ddd DD MMM')
	);
	const dateLong = $derived(
		formatSlotDateTime(reservation.startDate.date, reservation.startDate.time, 'dddd D MMMM')
	);
	const timeShort = $derived(
		formatSlotDateTime(reservation.startDate.date, reservation.startDate.time, 'HH:mm')
	);
	const paxLabel = $derived(m.common_paxCount({ pax: reservation.pax }));

	const directionsUrl = $derived(
		restaurant.address
			? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
					[restaurant.name, restaurant.address].filter(Boolean).join(', ')
				)}`
			: ''
	);

	const enhanceFor = (name: 'confirm' | 'cancel') => () => {
		submitting = name;
		return async ({ result }: { result: import('@sveltejs/kit').ActionResult }) => {
			submitting = null;
			await applyAction(result);
			if (result.type === 'failure') await invalidateAll();
		};
	};
</script>

<svelte:head>
	<title>{m.reconfirm_pageTitle({ name: restaurant.name })}</title>
</svelte:head>

<main class="page">
	<div class="stack" aria-live="polite">
		{#if resolvedAction === 'confirm'}
			<span class="hero-icon" aria-hidden="true">
				<Check size={36} weight="thin" color="#16a34a" />
			</span>
			<h1 class="hero-title">{m.reconfirm_confirmedHeading()}</h1>

			<section class="card">
				<div class="card-section">
					<p class="resto-name">{restaurant.name}</p>
					{#if restaurant.address}
						<p class="resto-address">{restaurant.address}</p>
					{/if}
				</div>
				<hr class="rule" />
				<div class="details">
					<div class="cell">
						<p class="label">{m.common_date()}</p>
						<p class="value">{dateShort}</p>
					</div>
					<div class="cell">
						<p class="label">{m.common_time()}</p>
						<p class="value">{timeShort}</p>
					</div>
					<div class="cell">
						<p class="label">{m.common_guests()}</p>
						<p class="value">{paxLabel}</p>
					</div>
				</div>
			</section>

			<p class="footnote">{m.reconfirm_seeYouSoon({ name: restaurant.name })}</p>
		{:else if resolvedAction === 'cancel'}
			<span class="hero-icon" aria-hidden="true">
				<X size={36} weight="thin" color="#1A1A1A" />
			</span>
			<h1 class="hero-title">{m.reconfirm_canceledHeading()}</h1>

			<section class="card">
				<div class="card-section">
					<p class="resto-name">{restaurant.name}</p>
					{#if restaurant.address}
						<p class="resto-address">{restaurant.address}</p>
					{/if}
				</div>
				<hr class="rule" />
				<div class="details">
					<div class="cell">
						<p class="label">{m.common_date()}</p>
						<p class="value">{dateShort}</p>
					</div>
					<div class="cell">
						<p class="label">{m.common_time()}</p>
						<p class="value">{timeShort}</p>
					</div>
					<div class="cell">
						<p class="label">{m.common_guests()}</p>
						<p class="value">{paxLabel}</p>
					</div>
				</div>
			</section>

			<p class="footnote">{m.reconfirm_thanksForLettingUsKnow()}</p>
		{:else}
			<span class="hero-icon" aria-hidden="true">
				<HourglassSimple size={36} weight="thin" color="#1A1A1A" />
			</span>
			<h1 class="hero-title">{m.reconfirm_finalStep()}</h1>

			<section class="card">
				<div class="card-section">
					<p class="resto-name">{restaurant.name}</p>
					{#if restaurant.address}
						<p class="resto-address">{restaurant.address}</p>
					{/if}
					{#if directionsUrl}
						<a class="directions" href={directionsUrl} target="_blank" rel="noopener noreferrer">
							{m.common_getDirections()}
						</a>
					{/if}
				</div>

				<hr class="rule" />

				<div class="details" aria-label={m.reconfirm_detailsAriaLabel()}>
					<div class="cell">
						<p class="label">{m.common_date()}</p>
						<p class="value">{dateShort}</p>
					</div>
					<div class="cell">
						<p class="label">{m.common_time()}</p>
						<p class="value">{timeShort}</p>
					</div>
					<div class="cell">
						<p class="label">{m.common_guests()}</p>
						<p class="value">{paxLabel}</p>
					</div>
				</div>
			</section>

			{#if errorCopy}
				<p class="error" role="alert">{errorCopy}</p>
			{/if}

			{#if !canConfirm && !canCancel}
				<p class="instruction muted">{m.reconfirm_cannotModify()}</p>
			{:else}
				<p class="instruction">{m.reconfirm_clickBelow()}</p>

				<div class="actions">
					{#if canConfirm}
						<form method="POST" action="?/confirm" use:enhance={enhanceFor('confirm')}>
							<button
								type="submit"
								class="btn"
								data-variant="confirm"
								disabled={submitting !== null}
								aria-busy={submitting === 'confirm'}
							>
								{submitting === 'confirm' ? m.reconfirm_confirming() : m.reconfirm_confirmButton()}
							</button>
						</form>
					{/if}
					{#if canCancel}
						<form method="POST" action="?/cancel" use:enhance={enhanceFor('cancel')}>
							<button
								type="submit"
								class="btn"
								data-variant="cancel"
								disabled={submitting !== null}
								aria-busy={submitting === 'cancel'}
							>
								{submitting === 'cancel' ? m.reconfirm_canceling() : m.reconfirm_cancelButton()}
							</button>
						</form>
					{/if}
				</div>
			{/if}

			<p class="footer">
				{m.reconfirm_autoCancelWarning()}
			</p>
		{/if}
	</div>
</main>

<style>
	:global(html),
	:global(body) {
		background: #ffffff !important;
	}

	.page {
		--ink: #1a1a1a;
		--muted: #6b6b6b;
		--hair: #d6d3cb;
		--brand: #0042db;
		--rose: #8a1f2b;
		--success: #16a34a;
		--success-hover: #15803d;

		min-height: 100vh;
		background: #ffffff;
		color: var(--ink);
		font-size: 14px;
		line-height: 1.5;
		display: flex;
		justify-content: center;
		padding: 40px 20px 56px;
	}

	.stack {
		width: 100%;
		max-width: 380px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.hero-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin: 4px 0 12px;
	}

	.hero-title {
		margin: 0 0 28px;
		font-weight: 700;
		font-size: 18px;
		line-height: 1.2;
		letter-spacing: -0.005em;
		color: var(--ink);
		text-align: center;
	}

	.card {
		width: 100%;
		background: #ffffff;
		border: 1px solid var(--hair);
		border-radius: 4px;
		padding: 24px 22px;
		margin: 0 0 28px;
	}

	.card-section {
		text-align: left;
	}

	.resto-name {
		margin: 0 0 12px;
		font-size: 18px;
		font-weight: 700;
		color: var(--ink);
		line-height: 1.25;
	}

	.resto-address {
		margin: 0 0 14px;
		font-size: 14px;
		color: var(--ink);
		line-height: 1.45;
		white-space: pre-line;
	}

	.directions {
		display: inline-block;
		margin: 0;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.directions:hover {
		color: var(--brand);
	}

	.rule {
		border: 0;
		border-top: 1px solid var(--hair);
		margin: 22px 0 18px;
	}

	.details {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0;
	}

	.cell {
		padding: 4px 14px;
		text-align: left;
		min-width: 0;
	}

	.cell + .cell {
		border-left: 1px solid var(--hair);
	}

	.cell:first-child {
		padding-left: 0;
	}

	.cell:last-child {
		padding-right: 0;
	}

	.label {
		margin: 0 0 18px;
		font-size: 12px;
		font-weight: 400;
		color: var(--muted);
		line-height: 1.2;
	}

	.value {
		margin: 0;
		font-size: 14px;
		font-weight: 700;
		color: var(--ink);
		line-height: 1.3;
	}

	.error {
		width: 100%;
		margin: 0 0 18px;
		padding: 10px 12px;
		border-radius: 3px;
		background: rgba(138, 31, 43, 0.06);
		border-left: 2px solid var(--rose);
		color: var(--rose);
		font-size: 13px;
		text-align: left;
	}

	.instruction {
		width: 100%;
		margin: 0 0 16px;
		font-size: 14px;
		color: var(--ink);
		text-align: left;
	}

	.instruction.muted {
		color: var(--muted);
		text-align: center;
	}

	.actions {
		width: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
		margin: 0 0 24px;
	}

	.actions form {
		margin: 0;
		display: flex;
	}

	.btn {
		width: 100%;
		min-height: 56px;
		padding: 10px 14px;
		border: 0;
		border-radius: 2px;
		font-family: inherit;
		font-weight: 700;
		font-size: 12px;
		line-height: 1.25;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		text-align: center;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			background-color 140ms ease,
			color 140ms ease,
			opacity 140ms ease;
	}

	.btn[data-variant='confirm'] {
		background: var(--success);
		color: #ffffff;
	}

	.btn[data-variant='confirm']:hover:not(:disabled) {
		background: var(--success-hover);
	}

	.btn[data-variant='cancel'] {
		background: #ffffff;
		color: var(--ink);
		border: 1px solid var(--ink);
	}

	.btn[data-variant='cancel']:hover:not(:disabled) {
		background: var(--ink);
		color: #ffffff;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
	}

	.footer,
	.footnote {
		width: 100%;
		margin: 0;
		font-size: 13px;
		color: var(--muted);
		text-align: center;
		line-height: 1.5;
	}

	.footnote {
		color: var(--ink);
	}

	@media (max-width: 420px) {
		.cell {
			padding: 4px 10px;
		}
	}
</style>
