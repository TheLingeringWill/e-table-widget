<script lang="ts">
	import { formatSlotDateTime } from '$lib/utils/slotFormat';
	import HourglassSimple from 'phosphor-svelte/lib/HourglassSimple';
	import CheckCircle from 'phosphor-svelte/lib/CheckCircle';
	import X from 'phosphor-svelte/lib/X';
	import * as m from '$lib/paraglide/messages';

	let { data } = $props();

	const reservation = $derived(data.reservation);
	const restaurant = $derived(data.restaurant);
	const displayState = $derived(data.displayState);

	const errorCopy = $derived(
		data.errorCode === 'transition_not_allowed'
			? m.reconfirm_alreadyProcessed()
			: data.errorCode === 'not_found'
				? m.error_reservationNotFound()
				: data.errorCode
					? m.reconfirm_genericError()
					: ''
	);

	const dateShort = $derived(
		formatSlotDateTime(reservation.startDate.date, reservation.startDate.time, 'ddd DD MMM')
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
</script>

<svelte:head>
	<title>{m.reconfirm_pageTitle({ name: restaurant.name })}</title>
</svelte:head>

<main class="page">
	<div class="stack" aria-live="polite">
		{#if displayState === 'reconfirmed'}
			<span class="hero-icon" aria-hidden="true">
				<CheckCircle size={64} weight="regular" color="#16a34a" />
			</span>
			<h1 class="hero-title">{m.reconfirm_thanksForReconfirming()}</h1>

			<section class="card card--info">
				<p class="resto-name">{restaurant.name}</p>
				{#if restaurant.address}
					<p class="resto-address">{restaurant.address}</p>
				{/if}
				{#if directionsUrl}
					<a class="directions" href={directionsUrl} target="_blank" rel="noopener noreferrer">
						{m.common_getDirections()}
					</a>
				{/if}
			</section>

			<section class="card card--details" aria-label={m.reconfirm_detailsAriaLabel()}>
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

			{#if restaurant.phone}
				<div class="contact">
					<p class="contact-heading">{m.reconfirm_forMoreInfo()}</p>
					<a class="contact-phone" href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>
				</div>

				<div class="footer-info">
					<p class="footer-name">{restaurant.name}</p>
					{#if restaurant.address}
						<p class="footer-address">{restaurant.address}</p>
					{/if}
					<a class="contact-phone" href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>
				</div>
			{/if}
		{:else if displayState === 'confirmed'}
			<span class="hero-icon" aria-hidden="true">
				<CheckCircle size={64} weight="regular" color="#16a34a" />
			</span>
			<h1 class="hero-title">{m.reconfirm_confirmedHeading()}</h1>

			<section class="card card--info">
				<p class="resto-name">{restaurant.name}</p>
				{#if restaurant.address}
					<p class="resto-address">{restaurant.address}</p>
				{/if}
				{#if directionsUrl}
					<a class="directions" href={directionsUrl} target="_blank" rel="noopener noreferrer">
						{m.common_getDirections()}
					</a>
				{/if}
			</section>

			<section class="card card--details" aria-label={m.reconfirm_detailsAriaLabel()}>
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

			{#if restaurant.phone}
				<div class="contact">
					<p class="contact-heading">{m.reconfirm_forMoreInfo()}</p>
					<a class="contact-phone" href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>
				</div>

				<div class="footer-info">
					<p class="footer-name">{restaurant.name}</p>
					{#if restaurant.address}
						<p class="footer-address">{restaurant.address}</p>
					{/if}
					<a class="contact-phone" href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>
				</div>
			{/if}
		{:else if displayState === 'canceled'}
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

			<p class="muted">{m.reconfirm_cannotModify()}</p>
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

		min-height: 100vh;
		background: #ffffff;
		color: var(--ink);
		font-size: 16px;
		line-height: 1.5;
		display: flex;
		justify-content: center;
		padding: 56px 24px 72px;
	}

	.stack {
		width: 100%;
		max-width: 520px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.hero-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin: 4px 0 18px;
	}

	.hero-title {
		margin: 0 0 36px;
		font-weight: 700;
		font-size: 24px;
		line-height: 1.25;
		letter-spacing: -0.01em;
		color: var(--ink);
		text-align: center;
	}

	.card {
		width: 100%;
		background: #ffffff;
		border: 1px solid var(--hair);
		border-radius: 10px;
		padding: 28px 28px;
		margin: 0 0 24px;
	}

	.card--info {
		text-align: left;
	}

	.card--details {
		padding: 22px 24px;
	}

	.card--details .label {
		margin: 0 0 12px;
	}

	.card-section {
		text-align: left;
	}

	.resto-name {
		margin: 0 0 14px;
		font-size: 22px;
		font-weight: 700;
		color: var(--ink);
		line-height: 1.25;
	}

	.resto-address {
		margin: 0 0 18px;
		font-size: 16px;
		color: var(--ink);
		line-height: 1.5;
		white-space: pre-line;
	}

	.directions {
		display: inline-block;
		margin: 0;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 4px;
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
		padding: 6px 18px;
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
		margin: 0 0 22px;
		font-size: 14px;
		font-weight: 400;
		color: var(--muted);
		line-height: 1.2;
	}

	.value {
		margin: 0;
		font-size: 17px;
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

	.muted {
		width: 100%;
		margin: 0;
		font-size: 14px;
		color: var(--muted);
		text-align: center;
	}

	.footnote {
		width: 100%;
		margin: 0;
		font-size: 13px;
		color: var(--ink);
		text-align: center;
		line-height: 1.5;
	}

	.contact {
		width: 100%;
		text-align: left;
		margin: 12px 0 36px;
	}

	.contact-heading {
		margin: 0 0 12px;
		font-size: 17px;
		font-weight: 700;
		color: var(--ink);
		line-height: 1.4;
	}

	.contact-phone {
		display: inline-block;
		font-size: 16px;
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	.contact-phone:hover {
		color: var(--brand);
	}

	.footer-info {
		width: 100%;
		text-align: left;
	}

	.footer-name {
		margin: 0 0 8px;
		font-size: 17px;
		font-weight: 700;
		color: var(--ink);
		line-height: 1.4;
	}

	.footer-address {
		margin: 0 0 8px;
		font-size: 15px;
		color: var(--ink);
		line-height: 1.5;
	}

	@media (max-width: 480px) {
		.page {
			padding: 32px 16px 56px;
		}

		.hero-title {
			font-size: 20px;
		}

		.resto-name {
			font-size: 19px;
		}

		.value {
			font-size: 15px;
		}

		.cell {
			padding: 4px 10px;
		}

		.card {
			padding: 22px 20px;
		}

		.card--details {
			padding: 18px 16px;
		}
	}
</style>
