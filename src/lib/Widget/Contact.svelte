<script lang="ts">
	import TextInput from 'maket/TextInput';
	import { CaretLeft, Check } from 'phosphor-svelte';
	import Button from './Button.svelte';
	import { onMount, untrack } from 'svelte';
	import intlTelInput from 'intl-tel-input';
	import 'intl-tel-input/build/css/intlTelInput.css';
	import { contact, rememberMe, prefilled } from '$lib/states/contact.svelte';
	import { nextStep, previousStep } from '$lib/states/step.svelte';
	import { waitlist } from '$lib/states/waitlist.svelte';
	import { ClockCounterClockwise } from 'phosphor-svelte';
	import {
		formatPhoneAsYouType,
		convertToE164,
		formatPhoneNumberForDisplay,
		getPhoneValidationError
	} from '$lib/utils/phone';
	import { page } from '$app/state';
	import type { CountryCode } from 'libphonenumber-js';

	let lastNameErrors: string[] = $state([]);
	let firstNameErrors: string[] = $state([]);
	let emailErrors: string[] = $state([]);
	let phoneErrors: string[] = $state([]);
	let civilityErrors: string[] = $state([]);
	let iti: ReturnType<typeof intlTelInput> | undefined = $state();

	const CIVILITY_OPTIONS = [
		{ value: 'mrs', label: 'Madame' },
		{ value: 'mr', label: 'Monsieur' },
		{ value: 'other', label: 'Autre' }
	] as const;

	const EMAIL_REGEX =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

	// Dual-format phone state
	let phoneE164 = $state<string | null>(null); // Internal E.164 format for API
	let phoneDisplay = $state<string>(contact.phone || ''); // Formatted display for user

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
		const initialCountry = page.data.countryCode || 'FR';
		iti = intlTelInput(input, {
			geoIpLookup: (callback) => {
				callback(initialCountry);
			},
			initialCountry,
			containerClass: 'ui-field-input-container ui-text-input-container'
		});

		// Attach event listeners directly since TextInput doesn't pass them through
		input.addEventListener('input', handlePhoneInput);
		input.addEventListener('blur', validatePhone);

		const emailInput = document.querySelector('#email') as HTMLInputElement | null;
		emailInput?.addEventListener('blur', normalizeEmail);

		// Migrate old localStorage formats to E.164 and sync input value
		if (contact.phone) {
			const country = getSelectedCountry();
			phoneE164 = convertToE164(contact.phone, country);
			phoneDisplay = formatPhoneNumberForDisplay(contact.phone, country);
			contact.phone = phoneE164 || contact.phone;
			input.value = phoneDisplay;
		}
		contact.countryCode = getSelectedCountry() ?? contact.countryCode ?? 'FR';

		return () => {
			input.removeEventListener('input', handlePhoneInput);
			input.removeEventListener('blur', validatePhone);
			emailInput?.removeEventListener('blur', normalizeEmail);
		};
	});

	const validatePhone = () => {
		const country = getSelectedCountry();
		// Validate against E.164 format or raw display
		const toValidate = phoneE164 || phoneDisplay;
		const error = getPhoneValidationError(toValidate, country);
		phoneErrors = error ? [error] : [];
	};

	const validate = () => {
		if (!contact.civility) {
			civilityErrors = ['La civilité est requise'];
		} else {
			civilityErrors = [];
		}
		if (!contact.lastName) {
			lastNameErrors = ['Le nom est requis'];
		} else {
			lastNameErrors = [];
		}
		normalizeEmail();
		if (!contact.email) {
			emailErrors = ["L'adresse e-mail est requise"];
		} else if (!EMAIL_REGEX.test(contact.email)) {
			emailErrors = ["L'adresse e-mail est invalide"];
		} else {
			emailErrors = [];
		}
		// Validate phone using contextual error messages
		validatePhone();
		if (
			civilityErrors.length ||
			lastNameErrors.length ||
			emailErrors.length ||
			phoneErrors.length
		) {
			return;
		}
		nextStep();
	};

	const handlePhoneInput = (event: Event) => {
		const input = event.target as HTMLInputElement;
		const cursorPosition = input.selectionStart || 0;
		const valueBeforeFormat = input.value;

		const country = getSelectedCountry();

		// Format as user types
		const formatted = formatPhoneAsYouType(valueBeforeFormat, country);

		// Update both the state and the input value directly
		phoneDisplay = formatted;
		input.value = formatted;

		// Calculate new cursor position accounting for added spaces
		const charsBeforeCursor = valueBeforeFormat.slice(0, cursorPosition).replace(/\s/g, '').length;
		let newCursorPos = 0;
		let charCount = 0;
		for (let i = 0; i < formatted.length && charCount < charsBeforeCursor; i++) {
			if (formatted[i] !== ' ') {
				charCount++;
			}
			newCursorPos = i + 1;
		}

		// Restore cursor position after formatting
		requestAnimationFrame(() => {
			input.setSelectionRange(newCursorPos, newCursorPos);
		});

		// Convert to E.164 for storage/API
		phoneE164 = convertToE164(phoneDisplay, country);
		contact.phone = phoneE164 || phoneDisplay;
		contact.countryCode = country ?? contact.countryCode;

		// Auto-update intl-tel-input flag when user types country code
		if (iti && phoneDisplay.startsWith('+')) {
			iti.setNumber(phoneDisplay.replace(/\s/g, ''));
		}

		// Clear errors when user is typing (show only on blur)
		phoneErrors = [];
	};
</script>

<div class="w-full h-full">
	<!-- <div class="border-b w-full max-w-[100px] h-[1px] px-5"></div> -->
	<form class="flex flex-col gap-5 flex-grow" onsubmit={(e) => e.preventDefault()}>
		<div class="flex flex-col md:gap-5 gap-4">
			<div class="flex items-center gap-5 pt-3">
				<button onclick={() => previousStep()}>
					<CaretLeft size={28} />
				</button>
				<h2 class="text-md font-normal">Informations de contact</h2>
			</div>
			{#if prefilled.value}
				<div
					class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm"
				>
					<Check size={16} weight="bold" />
					<span>Vos informations ont été pré-remplies</span>
				</div>
			{/if}
			{#if waitlist.isWaitlist}
				<div
					class="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded text-orange-800 text-base font-bold"
				>
					<ClockCounterClockwise size={20} weight="bold" />
					<span>Vous serez ajouté à la liste d'attente pour ce créneau</span>
				</div>
			{/if}
			<div class="flex flex-col md:gap-4 gap-3">
				<div class="flex flex-col gap-2">
					<span class="text-sm">* Civilité :</span>
					<div class="flex gap-2">
						{#each CIVILITY_OPTIONS as option (option.value)}
							<button
								type="button"
								class="flex-1 px-3 py-2 border rounded text-sm transition-colors {contact.civility ===
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
						<span class="text-xs text-red-600">{civilityErrors[0]}</span>
					{/if}
				</div>
				<TextInput
					id="phone"
					inputContainerClass="p-0"
					errors={phoneErrors}
					label="* Numéro de téléphone :"
					bind:value={phoneDisplay}
				/>
				<TextInput
					id="email"
					errors={emailErrors}
					label="* Adresse e-mail"
					bind:value={contact.email}
				/>
				<TextInput errors={lastNameErrors} label="* Nom :" bind:value={contact.lastName} />
				<TextInput errors={firstNameErrors} label="Prénom :" bind:value={contact.firstName} />
				<TextInput label="Notes pour notre équipe :" bind:value={contact.notes} />
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
						<span class="text-sm">Se souvenir de moi</span>
					</button>
					<p class="text-xs text-gray-500 ml-7">
						Vos informations sont stockées uniquement sur cet appareil.
					</p>
				</div>
			</div>
			<div class="flex items-center gap-8">
				<Button onclick={validate} revert>Continuer</Button>
			</div>
		</div>
	</form>
</div>
