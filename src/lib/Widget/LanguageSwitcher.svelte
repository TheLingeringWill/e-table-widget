<script lang="ts">
	import { Check } from 'phosphor-svelte';
	import {
		currentLocale,
		setLocale,
		SUPPORTED_LOCALES,
		type Locale
	} from '$lib/states/locale.svelte';
	import { useWidget } from '$lib/context.svelte';

	// The trigger sits on the brand surface, so its text must track the theme
	// foreground (auto black/white) — not a hardcoded white that vanishes on a
	// light brand. The dropdown itself is always a white popup with dark text.
	const widget = useWidget();
	const fontColor = $derived((widget.theme?.fontColor as string) ?? '#ffffff');

	const LABELS: Record<Locale, string> = {
		fr: 'Français',
		en: 'English',
		de: 'Deutsch',
		es: 'Español',
		pt: 'Português',
		it: 'Italiano',
		nl: 'Nederlands',
		ja: '日本語',
		zh: '中文',
		ko: '한국어',
		ru: 'Русский',
		ar: 'العربية'
	};

	let open = $state(false);
	let triggerEl: HTMLButtonElement | undefined = $state();
	let menuEl: HTMLDivElement | undefined = $state();
	// Anchor by `right` in LTR and by `left` in RTL so the menu always opens
	// on-screen (the trigger sits in the opposite corner under RTL). `rtl` is
	// read from the live document direction set server-side on <html dir>.
	let pos = $state({ top: 0, left: 0, right: 0, rtl: false });

	const computePos = () => {
		if (!triggerEl) return;
		const r = triggerEl.getBoundingClientRect();
		const rtl =
			typeof document !== 'undefined' && document.documentElement.getAttribute('dir') === 'rtl';
		pos = {
			top: r.bottom + 4,
			left: r.left,
			right: window.innerWidth - r.right,
			rtl
		};
	};

	const toggle = (event: MouseEvent) => {
		event.stopPropagation();
		if (open) {
			open = false;
		} else {
			computePos();
			open = true;
		}
	};

	const choose = (locale: Locale) => {
		open = false;
		setLocale(locale);
	};

	// Portal action: relocate the menu out of `#widget` (which has
	// `md:overflow-hidden`) so the dropdown isn't silently clipped.
	const portal = (node: HTMLElement) => {
		document.body.appendChild(node);
		return {
			destroy: () => {
				if (node.parentNode === document.body) document.body.removeChild(node);
			}
		};
	};

	$effect(() => {
		if (!open) return;

		const onDocPointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (triggerEl?.contains(target)) return;
			if (menuEl?.contains(target)) return;
			open = false;
		};
		const onKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') open = false;
		};

		document.addEventListener('pointerdown', onDocPointerDown);
		document.addEventListener('keydown', onKeydown);
		window.addEventListener('scroll', computePos, { passive: true, capture: true });
		window.addEventListener('resize', computePos);

		return () => {
			document.removeEventListener('pointerdown', onDocPointerDown);
			document.removeEventListener('keydown', onKeydown);
			window.removeEventListener('scroll', computePos, { capture: true });
			window.removeEventListener('resize', computePos);
		};
	});
</script>

<button
	bind:this={triggerEl}
	type="button"
	aria-haspopup="menu"
	aria-expanded={open}
	aria-label="Change language"
	onclick={toggle}
	class="lang-trigger flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold uppercase tracking-wide focus:outline-none transition-colors"
	style="color: {fontColor};"
	data-open={open}
>
	{currentLocale.value}
</button>

{#if open}
	<div
		bind:this={menuEl}
		use:portal
		role="menu"
		aria-label="Language"
		style:top="{pos.top}px"
		style:left={pos.rtl ? `${pos.left}px` : null}
		style:right={pos.rtl ? null : `${pos.right}px`}
		style:z-index="9999"
		class="fixed w-60 overflow-hidden rounded-lg border border-[#e0e0e1] bg-white p-1 shadow-[0_1px_12px_rgba(29,31,32,0.08),0_1px_2px_rgba(232,232,232,0.12)]"
	>
		{#each SUPPORTED_LOCALES as locale (locale)}
			{@const active = currentLocale.value === locale}
			<button
				type="button"
				role="menuitem"
				aria-current={active ? 'true' : undefined}
				onclick={() => choose(locale)}
				class="flex h-10 w-full items-center justify-between gap-2 rounded-md px-3 text-[13px] text-[#2c2e30] hover:bg-black hover:bg-opacity-5 focus:outline-none focus-visible:bg-black focus-visible:bg-opacity-5 transition-colors"
			>
				<span>{LABELS[locale]}</span>
				{#if active}
					<Check size={16} weight="bold" />
				{/if}
			</button>
		{/each}
	</div>
{/if}

<style>
	/* Hover/open tint follows the (theme-driven) text color via currentColor, so
	   it reads on both dark and light brand surfaces — the old hardcoded white
	   tint was invisible on a light brand. The trigger text itself is slightly
	   dimmed to mirror the previous text-opacity-80. */
	.lang-trigger {
		opacity: 0.8;
	}
	.lang-trigger:hover,
	.lang-trigger:focus-visible,
	.lang-trigger[data-open='true'] {
		opacity: 1;
		background-color: color-mix(in srgb, currentColor 12%, transparent);
	}
</style>
