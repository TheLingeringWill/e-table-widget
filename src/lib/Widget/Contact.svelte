<script lang="ts">
	import TextInput from 'maket/TextInput';
	import { CaretLeft, Check } from 'phosphor-svelte';
	import Button from './Button.svelte';
	import { onMount, untrack } from 'svelte';
	import intlTelInput from 'intl-tel-input';
	import 'intl-tel-input/build/css/intlTelInput.css';
	import * as v from 'valibot';
	import { contact, rememberMe, prefilled } from '$lib/states/contact.svelte';
	import { nextStep, previousStep } from '$lib/states/step.svelte';
	import { waitlist } from '$lib/states/waitlist.svelte';
	import { ClockCounterClockwise } from 'phosphor-svelte';
	import {
	formatPhoneAsYouType,
	convertToE164,
	formatPhoneNumberForDisplay,
	getPhoneValidationError
} from 'shared/utils/phone';
	import { page } from '$app/state';
	import type { CountryCode } from 'libphonenumber-js';

	let lastNameErrors: string[] = $state([]);
	let firstNameErrors: string[] = $state([]);
	let emailErrors: string[] = $state([]);
	let phoneErrors: string[] = $state([]);
	let iti: ReturnType<typeof intlTelInput> | undefined = $state();

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

	onMount(() => {
		const input = document.querySelector('#phone') as HTMLInputElement;
		iti = intlTelInput(input, {
			geoIpLookup: (callback) => {
				callback(page.data.countryCode);
			},
			initialCountry: page.data.countryCode,
			containerClass: 'ui-field-input-container ui-text-input-container'
		});

		// Attach event listeners directly since TextInput doesn't pass them through
		input.addEventListener('input', handlePhoneInput);
		input.addEventListener('blur', validatePhone);

		// Migrate old localStorage formats to E.164 and sync input value
		if (contact.phone) {
			const country = getSelectedCountry();
			phoneE164 = convertToE164(contact.phone, country);
			phoneDisplay = formatPhoneNumberForDisplay(contact.phone, country);
			contact.phone = phoneE164 || contact.phone;
			input.value = phoneDisplay;
		}

		return () => {
			input.removeEventListener('input', handlePhoneInput);
			input.removeEventListener('blur', validatePhone);
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
		if (!contact.lastName) {
			lastNameErrors = ['Le nom est requis'];
		} else {
			lastNameErrors = [];
		}
		if (!contact.email) {
			emailErrors = ["L'adresse e-mail est requise"];
		} else {
			if (!v.safeParse(v.pipe(v.string(), v.email()), contact.email).success) {
				emailErrors = ["L'adresse e-mail est invalide"];
			} else {
				emailErrors = [];
			}
		}
		// Validate phone using contextual error messages
		validatePhone();
		if (lastNameErrors.length || emailErrors.length || phoneErrors.length) {
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
				<div class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
					<Check size={16} weight="bold" />
					<span>Vos informations ont été pré-remplies</span>
				</div>
			{/if}
			{#if waitlist.isWaitlist}
				<div class="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded text-orange-800 text-base font-bold">
					<ClockCounterClockwise size={20} weight="bold" />
					<span>Vous serez ajouté à la liste d'attente pour ce créneau</span>
				</div>
			{/if}
			<div class="flex flex-col md:gap-4 gap-3">
				<TextInput
					id="phone"
					inputContainerClass="p-0"
					errors={phoneErrors}
					label="* Numéro de téléphone :"
					bind:value={phoneDisplay}
				/>
				<TextInput errors={emailErrors} label="* Adresse e-mail" bind:value={contact.email} />
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
