<script lang="ts">
	import { CaretDown } from 'phosphor-svelte';
	import {
		currentLocale,
		setLocale,
		SUPPORTED_LOCALES,
		type Locale
	} from '$lib/states/locale.svelte';

	const LABELS: Record<Locale, string> = {
		fr: 'Français',
		en: 'English'
	};

	let open = $state(false);
	let containerEl: HTMLDivElement | undefined = $state();

	const choose = (locale: Locale) => {
		open = false;
		setLocale(locale);
	};

	// Outside-click handler. Attached to `document` only while the dropdown
	// is open so we don't pay for the listener on every click otherwise.
	// The button's own onclick calls `event.stopPropagation()` so opening
	// the dropdown doesn't immediately race against this listener.
	$effect(() => {
		if (!open) return;
		const onDocClick = (event: MouseEvent) => {
			const target = event.target;
			if (target instanceof Node && containerEl && !containerEl.contains(target)) {
				open = false;
			}
		};
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});
</script>

<div bind:this={containerEl} class="relative">
	<button
		type="button"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label="Change language"
		onclick={(event) => {
			event.stopPropagation();
			open = !open;
		}}
		class="flex items-center gap-1 rounded px-2 py-1 text-sm font-semibold uppercase hover:bg-white hover:bg-opacity-10 focus:bg-white focus:bg-opacity-10 transition-colors"
	>
		<span>{currentLocale.value}</span>
		<CaretDown size={14} weight="bold" />
	</button>

	{#if open}
		<ul
			role="listbox"
			class="absolute right-0 top-full mt-1 min-w-[8rem] rounded-lg border border-white border-opacity-20 bg-primary shadow-lg z-10 overflow-hidden"
		>
			{#each SUPPORTED_LOCALES as locale (locale)}
				<li role="presentation">
					<button
						type="button"
						role="option"
						aria-selected={currentLocale.value === locale}
						onclick={() => choose(locale)}
						class="block w-full text-left px-3 py-2 text-sm hover:bg-white hover:bg-opacity-10 transition-colors data-[active=true]:bg-white data-[active=true]:bg-opacity-20"
						data-active={currentLocale.value === locale}
					>
						{LABELS[locale]}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
