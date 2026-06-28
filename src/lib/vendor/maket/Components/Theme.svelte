<script lang="ts">
	import { create_theme_context } from '../theme.svelte';
	import type { Snippet } from 'svelte';
	import type { DialogState, DialogType } from './Dialog/dialog.types.js';
	import type { ToastPosition } from './Toast/toast.js';
	import type { BaseTransitionParams, TypedTransitionProps } from '../transitions/transition.js';
	import type { Placement } from '@floating-ui/dom';
	import BeforeHydratation from './BeforeHydratation.svelte';
	import { onMountAutoWidthInput } from '../utils/useAutoWidthInput.js';
	import { warning } from './Icons/warning.js';
	import { info } from './Icons/info.js';
	import { checkCircle } from './Icons/checkCircle.js';
	import { warningOctagon } from './Icons/warningOctagon.js';
	import { x } from './Icons/x.js';
	import { plus } from './Icons/plus.js';
	import { minus } from './Icons/minus.js';
	import { caretDown } from './Icons/caretDown.js';
	import { caretUp } from './Icons/caretUp.js';
	import { dotsNine } from './Icons/dotsNine.js';
	import { dotsThree } from './Icons/dotsThree.js';
	import { file } from './Icons/file.js';
	import { eye } from './Icons/eye.js';
	import { eyeClosed } from './Icons/eyeClosed.js';
	import { caretRight } from './Icons/caretRight.js';
	import { calendar } from './Icons/calendar.js';

	let {
		children,
		defaultDialogSuffix,
		transitions,
		defaultDialogPrefix,
		popoverTransitions,
		dialogTransitions,
		toastTransitions,
		defaultTheme = { colorScheme: 'light', name: 'light' }
	}: {
		defaultTheme?: { colorScheme: string; name: string };
		data?: any;
		children: Snippet;
		transitions?: BaseTransitionParams;
		defaultDialogSuffix?: Snippet<[DialogState]>;
		defaultDialogPrefix?: Snippet<[DialogState]>;
		dialogTransitions?: TypedTransitionProps<DialogType, 'fso'>;
		toastTransitions?: TypedTransitionProps<ToastPosition, 'fso'>;
		popoverTransitions?: TypedTransitionProps<Placement, 'fso'>;
	} = $props();
	create_theme_context({
		transitions,
		dialogTransitions,
		toastTransitions,
		popoverTransitions,
		defaultTheme,
		dialog: {
			defaultDialogPrefix,
			defaultDialogSuffix
		},
		snippets: {
			defaultWarningIcon: warning,
			defaultInfoIcon: info,
			defaultSuccessIcon: checkCircle,
			defaultDangerIcon: warningOctagon,
			defaultCloseIcon: x,
			defaultPlusIcon: plus,
			defaultMinusIcon: minus,
			defaultChevronDownIcon: caretDown,
			defaultChevronUpIcon: caretUp,
			defaultDotsIcon: dotsNine,
			defaultMenuIcon: dotsThree,
			defaultEyeOpenIcon: eye,
			defaultEyeCloseIcon: eyeClosed,
			defaultChevronRightIcon: caretRight,
			defaultCalendarIcon: calendar,
			defaultFileIcon: file
		}
	});

	const setWindowDimensions = () => {
		const setWindowHeight = () => {
			document.documentElement.style.setProperty('--window-height', window.innerHeight + 'px');
		};
		const setWindowWidth = () => {
			document.documentElement.style.setProperty('--window-width', window.innerWidth + 'px');
		};
		window.addEventListener('resize', setWindowHeight);
		window.addEventListener('resize', setWindowWidth);
		setWindowHeight();
	};

	const setTheme = (_DEFAULT_THEME_: string, _DEFAULT_COLOR_SCHEME_: string) => {
		const t = localStorage.getItem('theme') || _DEFAULT_THEME_;
		const c = localStorage.getItem('color-scheme') || _DEFAULT_COLOR_SCHEME_;
		document.documentElement.setAttribute('data-theme', t);
		document.documentElement.setAttribute('data-color-scheme', c);
		window.addEventListener('storage', (e): void => {
			if (e.key === 'theme') {
				document.documentElement.setAttribute('data-theme', e.newValue || '');
			}
			if (e.key === 'color-scheme') {
				document.documentElement.setAttribute('data-color-scheme', e.newValue || '');
			}
		});
	};
</script>

<BeforeHydratation
	execute={[
		setWindowDimensions,
		onMountAutoWidthInput,
		[
			setTheme,
			{ _DEFAULT_THEME_: defaultTheme.name, _DEFAULT_COLOR_SCHEME_: defaultTheme.colorScheme }
		]
	]}
	stylize={[
		/*CSS */ `
@media (prefers-reduced-motion) {
	::view-transition-group(*),
	::view-transition-old(*),
	::view-transition-new(*) {
		animation: none !important;
	}
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
	-webkit-background-clip: text;
	-webkit-text-fill-color: hsl(var(--surface-muted)/1);
	transition: background-color 50000s ease-in-out 500000s;
	box-shadow:  0 0 0px 1000px transparent inset;
}
`
	]}
/>

{@render children()}
