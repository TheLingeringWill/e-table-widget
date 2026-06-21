<script lang="ts">
	import { CaretDown } from 'phosphor-svelte';
	import { fade } from 'svelte/transition';
	import Spinner from '../Spinner.svelte';

	// A horizontal segmented control that replaces the old vertical accordion for
	// the SELECTION step (TheFork-style). One pill, N equal segments. The active
	// segment is filled (themed), a segment with a chosen value shows that value +
	// a caret and is clickable to re-open it, and a not-yet-reachable segment is
	// dimmed/locked. The active step's content renders below this bar (in
	// Selection.svelte), so the three steps read horizontally and the content gets
	// the full width — no stacked headers to scroll past.
	type Step = {
		id: string;
		icon: any;
		// Label shown when the step has no value yet (e.g. "Pick a date").
		label: string;
		// The chosen value, shown instead of the label once set (e.g. "Tue 25 Jun",
		// "2 guests", "12:15"). null/undefined → pending.
		value?: string | null;
		// Gated like the old accordion: the pax step is disabled until a date is
		// picked, the slots step until date + pax.
		disabled?: boolean;
		loading?: boolean;
	};

	let {
		steps,
		activeIndex,
		onSelect,
		theme
	}: {
		steps: Step[];
		activeIndex: number | null;
		onSelect: (index: number) => void;
		theme: any;
	} = $props();
</script>

<!-- One rounded-full pill split into equal segments, divided by hairlines. The
     container border + the active fill come from the theme (.themed-border /
     [data-active]) so the bar tracks the brand on both light and dark surfaces. -->
<div
	class="themed-border flex w-full items-stretch overflow-hidden rounded-full border"
	role="tablist"
	aria-label="Booking steps"
>
	{#each steps as step, i (step.id)}
		{@const isActive = activeIndex === i}
		{@const hasValue = step.value != null && step.value !== ''}
		{@const Icon = step.icon}
		{#if i > 0}
			<div class="separator-w w-px shrink-0 self-stretch" aria-hidden="true"></div>
		{/if}
		<button
			type="button"
			role="tab"
			aria-selected={isActive}
			aria-disabled={step.disabled}
			data-active={isActive}
			data-first={i === 0}
			data-last={i === steps.length - 1}
			disabled={step.disabled}
			onclick={() => {
				if (!step.disabled) onSelect(i);
			}}
			class="step-seg flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-semibold disabled:cursor-not-allowed sm:gap-2 sm:px-3"
			title={hasValue ? (step.value ?? undefined) : step.label}
		>
			<Icon size={18} class="shrink-0" weight="regular" />
			<span class="min-w-0 truncate" dir="auto">{hasValue ? step.value : step.label}</span>
			{#if step.loading && !isActive}
				<span class="flex shrink-0 items-center" transition:fade>
					<Spinner size={16} width={2} color={theme.fontColor} />
				</span>
			{:else if hasValue && !isActive}
				<!-- A value-bearing step is re-openable: the caret signals you can go
				     back and change it (matches TheFork). The active step has no caret
				     since you're already in it. -->
				<CaretDown size={14} class="shrink-0 opacity-70" />
			{/if}
		</button>
	{/each}
</div>

<style>
	/* The global `button { border-radius: var(--base-radius) }` rounds every
	   segment on all four corners, so the active fill rendered as its own little
	   pill inset from the container — leaving a sliver of the dark surface between
	   the fill and the rounded edge. Square the inner corners so segments tile
	   edge-to-edge, then round the OUTER corners of the first/last segment to the
	   pill radius so the active fill *is* the pill end and reaches flush — no dark
	   crescent (TheFork-style). Logical (inline-start/end) radii auto-flip under
	   RTL, so the DOM-first segment rounds on whichever side it visually leads. */
	.step-seg {
		border-radius: 0 !important;
	}
	.step-seg[data-first='true'] {
		border-start-start-radius: 9999px !important;
		border-end-start-radius: 9999px !important;
	}
	.step-seg[data-last='true'] {
		border-start-end-radius: 9999px !important;
		border-end-end-radius: 9999px !important;
	}
	/* A pending (no value yet) step is lightly dimmed — same convention as the old
	   accordion header — but the active and value-bearing steps stay full strength.
	   Kept light so black text on a light brand doesn't wash out to grey. */
	.step-seg:disabled {
		opacity: 0.55;
	}
	.step-seg:not(:disabled):not([data-active='true']):hover {
		background-color: color-mix(in srgb, currentColor 6%, transparent);
	}
</style>
