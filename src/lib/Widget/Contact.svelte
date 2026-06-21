<script lang="ts">
	import TextInput from 'maket/TextInput';
	import { CaretLeft, Check, ClockCounterClockwise, Info } from 'phosphor-svelte';
	import { onMount } from 'svelte';
	import intlTelInput from 'intl-tel-input';
	import 'intl-tel-input/build/css/intlTelInput.css';
	import { contact, rememberMe, prefilled } from '$lib/states/contact.svelte';
	import { selection } from '$lib/states/selection.svelte';
	import { reservation } from '$lib/states/reservation.svelte';
	import { nextStep, previousStep } from '$lib/states/step.svelte';
	import { waitlist } from '$lib/states/waitlist.svelte';
	import { convertToE164, getPhoneValidationError } from '$lib/utils/phone';
	import { page } from '$app/state';
	import type { CountryCode } from 'libphonenumber-js';
	import type { BookingCivility } from '$lib/api-types';
	import * as m from '$lib/paraglide/messages';
	import { useWidget } from '$lib/context.svelte';

	const widgetCtx = useWidget();
	const theme = $derived(
		widgetCtx.theme as {
			backgroundColor?: string;
			fontColor?: string;
			buttonBorderRadius?: number;
		}
	);

	let lastNameErrors: string[] = $state([]);
	let firstNameErrors: string[] = $state([]);
	let emailErrors: string[] = $state([]);
	let phoneErrors: string[] = $state([]);
	let civilityErrors: string[] = $state([]);
	let iti: ReturnType<typeof intlTelInput> | undefined = $state();

	const showPreAuthNotice = $derived.by(() => {
		// A guarantee already in place — legacy hold or a saved card — means no new
		// pre-auth will be requested, so don't show the notice.
		if (reservation.paymentStatus === 'requires_capture' || reservation.stripeSetupIntentId)
			return false;
		if (waitlist.isWaitlist) return false;
		// A `save_card` experience always saves a card (price × pax penalty),
		// regardless of the slot capture policy — same branch Booking.svelte
		// takes when creating the setup intent.
		if (selection.experience?.paymentOption === 'save_card') return true;
		const svc = selection.service;
		const slot = selection.slot;
		const pax = selection.pax;
		if (!svc || !slot || !pax) return false;
		const captureEnabled =
			(slot as { captureEnabled?: boolean | null }).captureEnabled ??
			(svc as { captureEnabled?: boolean }).captureEnabled ??
			false;
		if (!captureEnabled) return false;
		const threshold =
			(slot as { captureThreshold?: number | null }).captureThreshold ??
			(svc as { captureThreshold?: number | null }).captureThreshold ??
			0;
		return pax >= threshold;
	});

	const CIVILITY_OPTIONS = $derived<{ value: BookingCivility; label: string }[]>([
		{ value: 'mrs', label: m.contact_civilityMrs() },
		{ value: 'mr', label: m.contact_civilityMr() },
		{ value: 'other', label: m.contact_civilityOther() }
	]);

	const EMAIL_REGEX =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

	const getSelectedCountry = (): CountryCode | undefined => {
		if (iti) {
			const countryData = iti.getSelectedCountryData();
			return countryData?.iso2?.toUpperCase() as CountryCode;
		}
		return undefined;
	};

	const normalizeEmail = () => {
		contact.email = contact.email.trim().toLowerCase();
	};

	onMount(() => {
		const input = document.querySelector('#phone') as HTMLInputElement;
		let destroyed = false; // guards deferred work against a mid-flight unmount
		// intl-tel-input (with its utils module) owns formatting, the dynamic
		// per-country placeholder, and the searchable country dropdown. We never
		// write the input value ourselves — the previous hand-rolled AsYouType +
		// setNumber logic fought the library and mangled non-French numbers.
		iti = intlTelInput(input, {
			initialCountry: (page.data.countryCode || 'FR').toLowerCase(),
			loadUtilsOnInit: () => import('intl-tel-input/utils'),
			nationalMode: false, // show the full international number incl. dial code
			autoPlaceholder: 'aggressive', // dynamic placeholder per country (incl. dial code)
			countrySearch: true,
			fixDropdownWidth: false, // let CSS size the dropdown to the full field width
			separateDialCode: false,
			strictMode: true,
			containerClass: 'widget-iti'
		});

		// Read-only sync while typing: derive E.164 for the API from whatever
		// intl-tel-input currently displays, and track the selected country. We never
		// write the input here — that's what made the old code fight the library and
		// mangle foreign numbers.
		const syncPhone = (event?: Event) => {
			const country = getSelectedCountry();
			contact.countryCode = country ?? contact.countryCode ?? 'FR';
			// A `countrychange` on an EMPTY field must not wipe an existing number.
			// This fires when the user picks their country before typing, and during
			// prefill seeding (setCountry) — clobbering contact.phone to '' there is
			// what made "remember me" silently drop foreign numbers. Only real `input`
			// edits may clear the number.
			if (event?.type === 'countrychange' && !input.value.trim()) {
				phoneErrors = [];
				return;
			}
			contact.phone = convertToE164(input.value, country);
			phoneErrors = []; // clear while typing; validation happens on blur

			// Live international promotion: once the typed number is complete & valid,
			// snap the *display* to full international form ("+33 6 12 34 56 78") as the
			// user types, mirroring the blur behaviour. intl-tel-input's own
			// formatAsYouType only spaces the number in the form it was typed (a national
			// entry stays "06 12 34 56 78"); convertToE164 is what prepends the dial code.
			// Skip values already in '+...' form — that both avoids re-promoting an
			// international number and terminates the re-entrancy: iti.setNumber dispatches
			// a synchronous 'input' event that re-enters this handler with a value that now
			// starts with '+', so the branch is skipped on re-entry.
			const raw = input.value;
			if (
				raw &&
				!raw.trimStart().startsWith('+') &&
				getPhoneValidationError(raw, country) === null
			) {
				const e164 = convertToE164(raw, country);
				// Defer like the blur path: setNumber's synchronous 'input' event would
				// otherwise re-enter our $state updates mid-handler and trip Svelte's
				// state_unsafe_mutation guard.
				if (e164.startsWith('+')) queueMicrotask(() => !destroyed && iti?.setNumber(e164));
			}
		};

		// On blur, promote a complete number to the full international form so the
		// committed value mirrors the reference widget ("+1 201-555-0199",
		// "+33 6 12 34 56 78"). convertToE164 (libphonenumber) drops national trunk
		// prefixes correctly for every country — unlike a naive dial-code prepend,
		// which would turn FR "06…" into an invalid "+330 6…". Partial/invalid input
		// is left untouched; once the value starts with "+", intl-tel-input keeps it
		// international on later edits too.
		const reformatPhone = () => {
			if (input.value && !input.value.trimStart().startsWith('+')) {
				const e164 = convertToE164(input.value, getSelectedCountry());
				// Defer the rewrite: iti.setNumber dispatches a synchronous 'input'
				// event, and re-entering our state updates mid-blur trips Svelte's
				// state_unsafe_mutation guard. A microtask runs it in a clean tick.
				if (e164.startsWith('+')) queueMicrotask(() => !destroyed && iti?.setNumber(e164));
			}
			validatePhone();
		};

		input.addEventListener('input', syncPhone);
		input.addEventListener('countrychange', syncPhone);
		input.addEventListener('blur', reformatPhone);

		const emailInput = document.querySelector('#email') as HTMLInputElement | null;
		emailInput?.addEventListener('blur', normalizeEmail);

		// Seed from prefill: Widget.svelte restores contact.phone (E.164) and
		// contact.countryCode (from localStorage / a server reservation) before
		// this component mounts. setNumber formats it and sets the flag.
		if (contact.phone) {
			if (contact.countryCode) iti.setCountry(contact.countryCode.toLowerCase());
			iti.setNumber(contact.phone);
		}
		contact.countryCode = getSelectedCountry() ?? contact.countryCode ?? 'FR';

		return () => {
			destroyed = true;
			input.removeEventListener('input', syncPhone);
			input.removeEventListener('countrychange', syncPhone);
			input.removeEventListener('blur', reformatPhone);
			emailInput?.removeEventListener('blur', normalizeEmail);
			iti?.destroy();
		};
	});

	const validatePhone = () => {
		const input = document.querySelector('#phone') as HTMLInputElement | null;
		const country = getSelectedCountry();
		// getPhoneValidationError is pure libphonenumber-js, so it validates
		// reliably even before intl-tel-input's utils finish loading.
		const code = getPhoneValidationError(input?.value ?? contact.phone, country);
		phoneErrors = code
			? [code === 'PHONE_REQUIRED' ? m.contact_phoneRequired() : m.contact_phoneInvalid()]
			: [];
	};

	const validate = () => {
		if (!contact.civility) {
			civilityErrors = [m.contact_civilityRequired()];
		} else {
			civilityErrors = [];
		}
		if (!contact.lastName) {
			lastNameErrors = [m.contact_lastNameRequired()];
		} else {
			lastNameErrors = [];
		}
		if (!contact.firstName) {
			firstNameErrors = [m.contact_firstNameRequired()];
		} else {
			firstNameErrors = [];
		}
		normalizeEmail();
		if (!contact.email) {
			emailErrors = [m.contact_emailRequired()];
		} else if (!EMAIL_REGEX.test(contact.email)) {
			emailErrors = [m.contact_emailInvalid()];
		} else {
			emailErrors = [];
		}
		// Validate phone using contextual error messages
		validatePhone();
		if (
			civilityErrors.length ||
			lastNameErrors.length ||
			firstNameErrors.length ||
			emailErrors.length ||
			phoneErrors.length
		) {
			return;
		}
		nextStep();
	};
</script>

<div class="w-full h-full">
	<!-- <div class="border-b w-full max-w-[100px] h-[1px] px-5"></div> -->
	<form class="contact-form flex flex-col gap-5 flex-grow" onsubmit={(e) => e.preventDefault()}>
		<div class="flex flex-col md:gap-5 gap-4">
			<div class="flex items-center gap-5 pt-3">
				<button onclick={() => previousStep()}>
					<CaretLeft size={28} class="rtl:-scale-x-100" />
				</button>
				<h2 class="text-xl font-bold">{m.contact_heading()}</h2>
			</div>
			{#if prefilled.value}
				<div
					class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm"
				>
					<Check size={16} weight="bold" />
					<span>{m.contact_prefillNotice()}</span>
				</div>
			{/if}
			{#if showPreAuthNotice}
				<div
					class="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm"
				>
					<Info size={16} weight="bold" />
					<span>{m.contact_preauthNotice()}</span>
				</div>
			{/if}
			{#if waitlist.isWaitlist}
				<div
					class="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded text-orange-800 text-base font-bold"
				>
					<ClockCounterClockwise size={20} weight="bold" />
					<span>{m.contact_waitlistNotice()}</span>
				</div>
			{/if}
			<div class="flex flex-col md:gap-4 gap-3">
				<div class="flex flex-col gap-2">
					<span class="text-sm font-semibold">{m.contact_civilityLabel()}</span>
					<div class="flex gap-2">
						{#each CIVILITY_OPTIONS as option (option.value)}
							<button
								type="button"
								class="flex-1 px-3 py-2 border rounded text-sm font-medium transition-colors {contact.civility ===
								option.value
									? 'bg-gray-800 border-gray-800 text-white'
									: 'bg-white border-gray-400 text-gray-800 hover:border-gray-600'}"
								onclick={() => {
									contact.civility = option.value;
									civilityErrors = [];
								}}
							>
								{option.label}
							</button>
						{/each}
					</div>
					{#if civilityErrors.length}
						<span class="text-sm text-red-600">{civilityErrors[0]}</span>
					{/if}
				</div>
				<div class="flex flex-col gap-2">
					<label for="phone" class="text-sm font-semibold">{m.contact_phoneLabel()}</label>
					<!-- Phone numbers read left-to-right by spec, so the typed value itself
					     must never be reordered inside an RTL page — `dir="ltr"` on the input
					     pins the digits/dial-code. The surrounding field, however, follows the
					     page direction (see the scoped style below) so it mirrors the sibling
					     contact fields: in RTL the flag picker sits on the right and the
					     number aligns to the right edge. -->
					<input id="phone" type="tel" dir="ltr" autocomplete="tel" data-1p-ignore />
					{#if phoneErrors.length}
						<span class="text-sm text-red-600">{phoneErrors[0]}</span>
					{/if}
				</div>
				<TextInput
					id="email"
					errors={emailErrors}
					label={m.contact_emailLabel()}
					bind:value={contact.email}
				/>
				<TextInput
					errors={lastNameErrors}
					label={m.contact_lastNameLabel()}
					bind:value={contact.lastName}
				/>
				<TextInput
					errors={firstNameErrors}
					label={m.contact_firstNameLabel()}
					bind:value={contact.firstName}
				/>
				<TextInput label={m.contact_notesLabel()} bind:value={contact.notes} />
				<div class="flex flex-col gap-1">
					<button
						type="button"
						class="flex items-center gap-2 cursor-pointer"
						onclick={() => (rememberMe.checked = !rememberMe.checked)}
					>
						<div
							class="w-5 h-5 border border-gray-400 rounded flex items-center justify-center transition-all {rememberMe.checked
								? 'bg-gray-800 border-gray-800'
								: 'bg-white'}"
						>
							{#if rememberMe.checked}
								<Check size={14} weight="bold" color="white" />
							{/if}
						</div>
						<span class="text-sm font-semibold">{m.contact_rememberMe()}</span>
					</button>
					<p class="text-sm text-gray-500 ml-7 rtl:ml-0 rtl:mr-7">
						{m.contact_rememberMeHelper()}
					</p>
				</div>
			</div>
			<div class="flex items-center gap-8">
				<button
					type="button"
					class="flex items-center justify-center gap-2 w-full py-3 text-base font-semibold uppercase transition-all hover:brightness-110 focus:brightness-95 focus:outline-none"
					style="background: {theme?.backgroundColor};
					       color: {theme?.fontColor};
					       border: 1px solid {theme?.backgroundColor};
					       border-radius: {theme?.buttonBorderRadius ?? 8}px;"
					onclick={validate}
				>
					{m.contact_continue()}
				</button>
			</div>
		</div>
	</form>
</div>

<style>
	/* The phone field mirrors its sibling contact inputs (email / name), which
	   right-align automatically under `dir="rtl"`. So the intl-tel-input
	   container follows the page direction: in RTL the flex order flips the flag
	   picker to the right and the input to its left, matching the rest of the
	   column. The number itself stays LTR via `dir="ltr"` on the <input>; we only
	   nudge its text to the right edge so it lines up with the siblings. Under
	   LTR the container is already ltr and the input already left-aligned, so
	   these rules are no-ops there — byte-for-byte unchanged. */
	:global([dir='rtl'] .widget-iti #phone) {
		text-align: right;
	}
</style>
