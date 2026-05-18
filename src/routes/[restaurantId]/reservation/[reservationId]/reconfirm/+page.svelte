<script lang="ts">
	import { formatSlotDateTime } from '$lib/utils/slotFormat';
	import HourglassSimple from 'phosphor-svelte/lib/HourglassSimple';
	import Check from 'phosphor-svelte/lib/Check';
	import X from 'phosphor-svelte/lib/X';

	let { data } = $props();

	const reservation = $derived(data.reservation);
	const restaurant = $derived(data.restaurant);
	const displayState = $derived(data.displayState);

	const errorCopy = $derived(
		data.errorCode === 'transition_not_allowed'
			? 'Cette réservation a déjà été traitée.'
			: data.errorCode === 'not_found'
				? 'Cette réservation est introuvable.'
				: data.errorCode
					? 'Une erreur est survenue. Merci de réessayer.'
					: ''
	);

	const dateShort = $derived(
		formatSlotDateTime(reservation.startDate.date, reservation.startDate.time, 'ddd DD MMM')
	);
	const timeShort = $derived(
		formatSlotDateTime(reservation.startDate.date, reservation.startDate.time, 'HH:mm')
	);
	const paxLabel = $derived(`${reservation.pax} personne${reservation.pax > 1 ? 's' : ''}`);

	const directionsUrl = $derived(
		restaurant.address
			? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
					[restaurant.name, restaurant.address].filter(Boolean).join(', ')
				)}`
			: ''
	);
</script>

<svelte:head>
	<title>Confirmer ma réservation — {restaurant.name}</title>
</svelte:head>

<main class="page">
	<div class="stack" aria-live="polite">
		{#if displayState === 'confirmed'}
			<span class="hero-icon" aria-hidden="true">
				<Check size={36} weight="thin" color="#16a34a" />
			</span>
			<h1 class="hero-title">Réservation confirmée</h1>

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
						<p class="label">Date</p>
						<p class="value">{dateShort}</p>
					</div>
					<div class="cell">
						<p class="label">Heure</p>
						<p class="value">{timeShort}</p>
					</div>
					<div class="cell">
						<p class="label">Personnes</p>
						<p class="value">{paxLabel}</p>
					</div>
				</div>
			</section>

			<p class="footnote">À très bientôt chez {restaurant.name}.</p>
		{:else if displayState === 'canceled'}
			<span class="hero-icon" aria-hidden="true">
				<X size={36} weight="thin" color="#1A1A1A" />
			</span>
			<h1 class="hero-title">Réservation annulée</h1>

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
						<p class="label">Date</p>
						<p class="value">{dateShort}</p>
					</div>
					<div class="cell">
						<p class="label">Heure</p>
						<p class="value">{timeShort}</p>
					</div>
					<div class="cell">
						<p class="label">Personnes</p>
						<p class="value">{paxLabel}</p>
					</div>
				</div>
			</section>

			<p class="footnote">Merci de nous avoir prévenus.</p>
		{:else}
			<span class="hero-icon" aria-hidden="true">
				<HourglassSimple size={36} weight="thin" color="#1A1A1A" />
			</span>
			<h1 class="hero-title">Dernière étape</h1>

			<section class="card">
				<div class="card-section">
					<p class="resto-name">{restaurant.name}</p>
					{#if restaurant.address}
						<p class="resto-address">{restaurant.address}</p>
					{/if}
					{#if directionsUrl}
						<a class="directions" href={directionsUrl} target="_blank" rel="noopener noreferrer">
							Obtenir l'itinéraire
						</a>
					{/if}
				</div>

				<hr class="rule" />

				<div class="details" aria-label="Détails de la réservation">
					<div class="cell">
						<p class="label">Date</p>
						<p class="value">{dateShort}</p>
					</div>
					<div class="cell">
						<p class="label">Heure</p>
						<p class="value">{timeShort}</p>
					</div>
					<div class="cell">
						<p class="label">Personnes</p>
						<p class="value">{paxLabel}</p>
					</div>
				</div>
			</section>

			{#if errorCopy}
				<p class="error" role="alert">{errorCopy}</p>
			{/if}

			<p class="muted">Cette réservation ne peut plus être modifiée.</p>
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

	@media (max-width: 420px) {
		.cell {
			padding: 4px 10px;
		}
	}
</style>
