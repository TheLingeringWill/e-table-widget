// /** @type {import('tailwindcss').Config} */
// export default {
// 	content: ['./src/**/*.{html,js,svelte,ts}'],

// 	theme: {
// 		extend: {}
// 	},
// 	plugins: []
// };

import { uy } from './src/lib/vendor/maket/plugin/uy.js';
import { maket } from './src/lib/vendor/maket/plugin/tailwind.plugin.js';
import plugin from 'tailwindcss/plugin';

const card = {
	base: uy`bg-surface-light raised rounded p-2 h-fit grid gap-4 text-contrast`,
	header: uy`grid gap-1`,
	mediaContainer: uy`overflow-hidden rounded-sm`,
	media: uy`size-full object-cover aspect-video`,
	img: uy`size-full object-cover`,
	title: uy`text-md  font-semibold`,
	body: uy`grid gap-4 w-full`,
	description: uy`text-sm text-contrast/70`,
	content: uy`text-sm grid gap-2`,
	actions: uy`flex gap-2`,
	row: {
		base: uy`grid-cols-12 gap-2 `,
		mediaContainer: uy`col-span-4`,
		body: uy`col-span-8`,
		actions: uy`justify-end`
	},
	rowReverse: {
		base: uy`grid-cols-12 gap-2 `,
		mediaContainer: uy`col-span-4 order-2 `,
		body: uy`col-span-8 order-1`
	},
	columnReverse: {
		mediaContainer: uy`order-2 `,
		body: uy`order-1`
	},
	overlay: {
		base: uy`p-0 relative isolate `,
		mediaContainer: uy`absolute z-0 rounded inset-0 size-full`,
		body: uy`p-2 bg-surface/70  z-10 rounded flex flex-col `
	},
	small: {
		base: uy`p-1`,
		header: uy`gap-1`,
		title: uy`text-base`,
		description: uy`text-sm`,
		media: uy`size-full object-cover hover:scale-105 transition-all duration-300 ease-in-out`,
		body: uy`gap-1`,
		content: uy`text-xs gap-1`,
		actions: uy`gap-1`,
		overlay: {
			base: uy`p-0 relative isolate `
		}
	},
	large: {
		base: uy`p-3`,
		header: uy`gap-2`,
		title: uy`text-lg`,
		description: uy`text-base`,
		media: uy`size-full object-cover hover:scale-105 transition-all duration-300 ease-in-out`,
		body: uy`gap-2`,
		content: uy`text-base gap-2`,
		actions: uy`gap-2`,
		overlay: {
			base: uy`p-0 relative isolate `
		}
	}
};

// /** @type {import('tailwindcss').Config} */
// export default {
// 	content: ['./src/**/*.{html,js,svelte,ts,theme.ts}'],
// 	theme: {},
// 	plugins: [
// 		require('tailwind-scrollbar'),

// 	]
// };

/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}', './src/lib/vendor/maket/**/*.{js,svelte,ts}'],
	safelist: ['dark'],
	plugins: [
		maket({
			customDesignSystem: {
				themes: {
					dark: {
						radius: 10
					},
					light: {
						radius: 10
					}
				},

				components: {
					card,
					accordion: {
						base: uy`w-full isolate relative `,
						button: uy`cursor-default p-2 transition-all w-full flex items-center gap-2`,
						buttonContent: uy`flex-1`,
						title: uy`text-contrast text-base`,
						description: uy`text-contrast-muted text-sm`,
						actions: uy`flex gap-2`,
						icon: uy`size-4 transition-all`,
						content: uy`p-2 text-sm origin-top w-full`,
						outlined: {
							base: uy`bg-surface border border-surface-lighter last-of-type:border rounded`
						},
						card: {
							base: uy`bg-surface-light rounded raised`
						},
						small: {
							title: uy`text-sm`,
							description: uy`text-xs`
						},
						large: {
							title: uy`text-md`,
							description: uy`text-base`
						}
					},
					accordionGroup: {
						base: 'grid',
						outlined: {
							base: uy`bg-surface border border-surface-lighter rounded`,
							accordion: {
								base: uy`border-0 border-b last-of-type:border-b-0 rounded-none first-of-type:rounded-t last-of-type:rounded-b`
							},
							splitted: {
								base: uy`bg-transparent border-none rounded`,
								accordion: uy`rounded border border-surface-lighter`
							}
						},
						card: {
							base: uy`bg-surface-light rounded raised`,
							splitted: {
								base: uy`bg-transparent border-0 raised-none`,
								accordion: {
									base: uy`rounded raised last-of-type:raised`
								}
							},
							accordion: {
								base: uy`raised-none border-0 rounded-none last-of-type:border-0 border-b border-surface-lighter first-of-type:rounded-t last-of-type:rounded-b`
							}
						},
						classic: {
							splitted: {
								accordion: {
									base: {
										base: uy`last-of-type:border-0 border-b border-surface-lighter`
									}
								}
							}
						},
						splitted: {
							base: uy`gap-2`
						},
						small: {
							base: uy`gap-1`
						},
						large: {
							base: uy`gap-4`
						}
					},
					dialog: {
						base: 'z-[+50] fixed left-0 flex bg-surface-dark/50 right-0 top-0 bottom-0 w-[100vw] isolate h-[var(--window-height)] py-4 overflow-y-auto',
						container: 'z-10 relative w-[400px] raised-xl bg-surface flex flex-col',
						header: 'border-b border-surface-lighter bg-surface-light p-4 pr-10',
						title: 'font-semibold text-md text-contrast',
						description: 'text-sm text-contrast-lighter mt-2',
						closeButton: 'absolute top-2 right-0 p-2',
						content: 'p-4 flex-1 bg-surface text-contrast',
						footer: 'px-4 pt-2',
						'drawer-left': {
							base: 'justify-start ',
							header: 'sticky top-0 z-10 ',
							container: 'left-4'
						},
						'drawer-right': {
							base: 'justify-end',
							container: 'right-4'
						},
						'drawer-bottom': {
							base: 'items-end justify-center ',
							container: 'w-[calc(100%-2rem)] max-w-[500px] '
						},
						'drawer-top': {
							base: 'items-start justify-center ',
							container: 'w-[calc(100%-2rem)] max-w-[500px] '
						},
						'full-screen': {
							base: 'items-start justify-center',
							container: 'w-full raised rounded'
						},
						alert: {
							base: 'justify-center',
							container: 'h-fit mx-auto top-20'
						},
						modal: {
							base: 'justify-center',
							container: 'h-fit mx-auto my-auto overflow-visible'
						}
					},
					slideShow: {
						base: uy`relative w-full h-full`,
						container: uy`flex flex-nowrap absolute w-full h-full inset-0`,
						slide: {
							base: uy`isolate p-2 flex-full h-full w-full relative flex`,
							topCenter: uy`justify-center items-start text-center`,
							bottomCenter: uy`justify-center items-end text-center`,
							left: uy`justify-start items-center text-left`,
							right: uy`justify-end items-center text-right`,
							topLeft: uy`justify-start items-start text-left`,
							topRight: uy`justify-end items-start text-right`,
							bottomLeft: uy`justify-start items-end text-left`,
							bottomRight: uy`justify-end items-end text-right`,
							middle: uy` justify-center items-center text-center`,
							middleLeft: uy` justify-start items-center text-left`,
							middleRight: uy` justify-end items-center text-right`
						},
						content: uy`z-10 text-contrast`,
						imageContainer: uy`absolute inset-0 w-full h-full`,
						image: uy`select-none object-cover w-full h-full pointer-events-none`,
						dotsContainer: uy``,
						dots: uy`flex items-center z-20 absolute bottom-2 left-0 w-full justify-center gap-5 `,
						dot: {
							base: uy`rounded-full transition-all hover:scale-105 size-3 bg-surface raised`,
							active: uy`scale-110 bg-primary`
						},
						progress: uy`flex items-center z-20 absolute bottom-2 left-0 w-1/2 justify-center rounded overflow-hidden h-1 m-auto right-0 bg-surface`,

						progressIndicator: uy` w-full h-full bg-primary rounded-full origin-left transition-all duration-0`
					},
					kbd: {
						base: uy`px-1.5 py-1 text-xs bg-color text-color-fg font-sans  inline-flex gap-1 items-center text-center shadow-small rounded leading-[100%]`,
						key: uy`no-underline`,
						small: uy`text-[10px] px-1 py-0.5 gap-0.5`,
						large: uy`text-sm px-2 py-1 gap-1.5`,
						ghost: uy`bg-color/20 text-color`,
						soft: uy`bg-color-muted text-color`,
						outline: uy`bg-opacity-0 text-color border-color border`
					},
					networkIndicator: {
						base: uy`fixed z-[1000] bg-color transition-[300] h-1 opacity-0 w-full top-0 left-0 origin-left `,
						loading: uy`opacity-100`
					},
					tabs: {
						base: uy`w-full grid`,
						header: uy`overflow-auto flex items-center  p-2 gap-2`,
						prefix: uy``,
						suffix: uy``,
						list: uy`flex flex-1 items-center gap-2 justify-between`,
						trigger: uy`p-2 transition-all cursor-pointer rounded text-sm text-contrast-muted hover:text-contrast data-[active="true"]:text-contrast`,
						tab: uy``,
						'tucked-center': {
							header: uy`justify-between`,
							list: uy`justify-center`
						},
						'tucked-start': {
							header: uy`justify-start`,
							list: uy`justify-start`
						},
						'tucked-end': {
							header: uy`justify-start`,
							list: uy`justify-end`
						},
						'full-width': {
							header: uy`justify-between`,
							list: uy`justify-between`
						}
					},
					marquee: {
						base: uy`overflow-hidden py-4 w-full`,
						list: uy`flex gap-4 w-max flex-nowrap animate-marquee`,
						item: uy`flex-shrink-0`
					},
					text: {
						base: uy`text-contrast text-base`,
						small: uy`text-sm`,
						large: uy`text-lg`,
						muted: uy`text-contrast-muted`,
						underline: uy`underline decoration-[0.125rem] underline-offset-[calc(1.25rem/10)]`,
						light: uy`font-light`,
						bold: uy`font-bold`,
						italic: uy`italic`,
						uppercase: uy`uppercase`,
						lowercase: uy`lowercase`,
						capitalize: uy`capitalize`
					},
					separator: {
						base: uy`border-color-lighter text-contrast-muted text-xs text-center relative rounded`,
						horizontal: uy`w-full`,
						vertical: uy` h-full`,
						label: uy`absolute top-1/2 left-1/2 whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2 bg-opacity-80 text-[0.75rem] px-2 bg-[var(--current-background)] leading-[2px]`
					},
					avatarGroup: {
						base: uy`flex gap-[-0.25rem] isolate ml-[0.3rem]`,
						avatar: {
							base: uy`ml-[-0.3rem]`
						},
						'remaining-count': uy`bg-muted text-contrast text-center rounded-full flex items-center justify-center uppercase font-bold border border-surface-lighter size-10  ml-[-0.75rem] z-[+1] text-sm`,
						large: {
							'remaining-count': uy`size-12 text-base`,
							avatar: {
								base: uy`ml-[-0.5rem]`
							}
						},
						small: {
							'remaining-count': uy`size-8 text-xs`,
							avatar: {
								base: uy`ml-[-0.25rem]`
							}
						}
					},
					avatar: {
						base: uy`relative items-center border border-surface-lighter text-contrast aspect-ratio-1 size-10 rounded-full`,
						image: uy`rounded-full absolute top-0 left-0 z-0 object-cover w-full max-w-full h-full max-h-full`,
						initials: uy`absolute bg-surface bottom-0 w-full h-full text-center left-0 rounded-full flex items-center justify-center uppercase font-bold text-sm`,
						prefix: uy`absolute bottom-[-0.25rem] rounded-full border border-surface-lighter p-[0.25rem] bg-surface size-4 left-[-0.25rem] aspect-square`,
						suffix: uy`absolute bottom-[-0.25rem] rounded-full border border-surface-lighter p-[0.25rem] bg-surface size-4 right-[-0.25rem] aspect-square`,
						small: {
							base: uy`size-8`,
							initials: uy`text-xs`,
							prefix: uy`size-3.5 left-[-0.2rem] bottom-[-0.2rem]`,
							suffix: uy`size-3.5 right-[-0.2rem] bottom-[-0.2rem] `
						},
						large: {
							base: uy`size-12`,
							initials: uy`text-base`,
							suffix: uy`size-5 right-[-0.3rem] bottom-[-0.3rem] `,
							prefix: uy`size-5 left-[-0.4rem] bottom-[-0.4rem] `
						}
					},
					thumb: {
						parent: uy`isolate relative`,
						base: uy` z-[-1] rounded opacity-0`,
						visible: uy`opacity-100`,
						ghost: {
							passive: uy`bg-color-lighter/10`,
							active: uy`bg-color-lighter/10 text-primary-fg`
						},
						solid: {
							passive: uy`bg-color-lighter`,
							active: uy`bg-color-lighter`
						},
						outline: {
							passive: uy` bg-opacity-0 border-color border`,
							active: uy` bg-opacity-0 border-color border`
						},
						underline: {
							passive: uy` bg-color h-0.5 rounded bottom-0`,
							active: uy` bg-color h-0.5 rounded bottom-0`
						}
					},

					blockquote: {
						base: uy`grid items-center gap-4 px-2.5 py-3 rounded border-l-6 flex-wrap w-full max-w-[650px] border-l-4 bg-color/20 text-color border-color`,
						description: uy`text-sm text-opacity-65`,
						small: {
							base: uy`text-sm px-2 py-2.5`,
							description: uy`text-xs`
						},
						large: {
							base: uy`text-lg px-3 py-3.5`,
							description: uy`text-base`
						}
					},
					callout: {
						base: uy`flex justify-between items-center gap-4 rounded px-2 py-3 w-full max-w-[600px] flex-wrap`,
						title: uy`text-base`,
						content: uy`flex-1 grid gap-2`,
						description: uy`text-sm`,
						solid: uy`bg-color text-color-fg`,
						soft: uy`bg-color/20 text-color`,
						outline: uy`bg-opacity-0 text-color border-color border`,
						icon: uy`size-4`,
						large: {
							title: uy`text-md`,
							description: uy`text-base`,
							icon: uy`size-5`
						},
						small: {
							title: uy`text-sm`,
							description: uy`text-xs`,
							icon: uy`size-3.5`
						},
						actions: uy`w-auto flex gap-2 flex-wrap`
					},
					hoverCard: {
						...card,
						parent: uy`raised-sm rounded bg-surface-light`,
						base: uy`bg-surface-light max-w-[350px] raised-0 ${card.base}`,
						column: {
							...card.column,
							base: uy`max-w-[350px]`
						},
						columnReverse: {
							...card.columnReverse,
							base: uy` max-w-[350px] ${card.columnReverse.base}`
						},
						row: {
							...card.row,
							base: uy`max-w-[450px] ${card.row.base}`
						},
						rowReverse: {
							...card.rowReverse,
							base: uy` max-w-[450px] ${card.rowReverse.base}`
						}
					},
					toast: {
						base: uy` cursor-default absolute pointer-events-auto bg-surface-light border border-surface-lighter text-contrast duration-500 max-w-[300px] px-2 py-1.5 flex items-center justify-between gap-2 rounded-md min-w-[250px]`,
						content: uy`grid flex-1`,
						title: uy`text-xs font-semibold`,
						description: uy`text-xs`,
						suffix: uy`max-h-10`,
						prefix: uy`max-h-6 aspect-square`,
						close: uy` absolute p-0.5 size-4 rounded-full aspect-square border border-surface-lighter bg-surface-light -top-1.5 -left-1.5`,
						richColors: {
							base: uy`bg-color-muted border-color-light text-color`,
							close: uy`bg-color-muted border border-color-light text-color`
						}
					},
					breadcrumbs: {
						base: uy`flex gap-2 items-center`,
						item: {
							base: uy`text-sm p-2 rounded-md text-contrast duration-500 hover:bg-surface-light/20`,
							disabled: uy`cursor-not-allowed opacity-40`
						},
						separator: uy`size-4 text-contrast-muted`
					},
					chip: {
						base: uy`bg-color text-color-fg rounded-full px-2 py-1 text-xs leading-4 gap-1 w-fit flex justify-center items-center`,

						soft: uy`bg-opacity-20 text-color`,
						outline: uy`bg-opacity-0 text-color border-color border`,
						prefix: uy`w-4 h-4`,
						suffix: uy`w-4 h-4`,
						large: {
							base: uy`text-base leading-5  gap-2 px-2.5 py-1.5`,
							prefix: uy`w-5 h-5`,
							suffix: uy`w-5 h-5`
						},
						small: {
							base: uy`text-[10px] leading-[10px] gap-1 px-1.5 py-1`,
							prefix: uy`w-2 h-2`,
							suffix: uy`w-2 h-2`
						}
					},
					code: {
						base: uy`bg-surface-dark text-contrast rounded px-3 py-6 text-sm border border-surface-lighter w-full whitespace-pre-wrap block`,
						subst: uy`text-contrast-muted`,
						formula: uy`text-contrast-muted`,
						property: uy`text-contrast-muted`,
						params: uy`text-contrast-muted`,
						comment: uy`text-contrast-muted`,
						punctuation: uy`text-contrast-muted`,
						tag: uy`text-contrast-muted`,
						attr: uy`text-contrast-muted`,
						attribute: uy`text-contrast-muted`,
						'selector-tag': uy`text-contrast-muted`,
						keyword: uy`text-contrast-muted`,
						doctag: uy`text-contrast-muted`,
						type: uy`text-contrast-muted`,
						number: uy`text-contrast-muted`,
						'selector-id': uy`text-contrast-muted`,
						'selector-class': uy`text-contrast-muted`,
						quote: uy`text-contrast-muted`,
						'template-tag': uy`text-contrast-muted`,
						deletion: uy`text-contrast-muted`,
						title: uy`text-contrast-muted`,
						section: uy`text-contrast-muted`,
						regexp: uy`text-contrast-muted`,
						variable: uy`text-contrast-muted`,
						'template-variable': uy`text-contrast-muted`,
						'selector-attr': uy`text-contrast-muted`,
						operator: uy`text-contrast-muted`,
						'selector-pseudo': uy`text-contrast-muted`,
						literal: uy`text-contrast-muted`,
						built_in: uy`text-contrast-muted`,
						bullet: uy`text-contrast-muted`,
						code: uy`text-contrast-muted`,
						addition: uy`text-contrast-muted`,
						meta: uy`text-contrast-muted`,
						emphasis: uy`text-contrast-muted`,
						strong: uy`text-contrast`,
						name: uy`text-contrast`,
						symbol: uy`text-contrast`,
						link: uy`text-contrast`,
						string: uy`text-contrast`
					},
					button: {
						base: uy`rounded-md cursor-pointer inline-flex whitespace-nowrap items-center justify-center relative bg-color text-color-fg transition-all duration-100 ease-in-out transform-origin-center overflow-hidden outline-none text-sm leading-[1.5rem] px-4 py-2 h-9 gap-2 hover:bg-opacity-85 active:bg-opacity-90 active:scale-[0.99] after:w-6 after:h-6`,
						prefix: uy`w-6 h-6`,
						suffix: uy`w-6 h-6`,
						surface: {
							base: uy`bg-surface-dark text-color-fg`,
							outline: uy`bg-opacity-0  border-surface-dark hover:bg-surface-dark/20 text-contrast`,
							soft: uy`bg-surface-dark  bg-opacity-40 text-contrast hover:bg-opacity-25`,
							ghost: uy`text-contrast hover:bg-opacity-60`,
							link: uy` text-contrast`
						},

						soft: {
							base: uy`bg-color-muted/20 text-color`
						},
						ghost: {
							base: uy`bg-color-muted/0 text-color hover:bg-opacity-40`
						},
						link: {
							base: uy`bg-opacity-0 text-color justify-start hover:underline underline-offset-4 text-left`
						},
						small: {
							base: uy`px-2.5 py-1.5 text-xs leading-4 h-7 gap-1 after:w-3 after:h-3`,
							suffix: uy`w-4 h-4`,
							prefix: uy`w-4 h-4`
						},
						outline: {
							base: uy`bg-opacity-0 text-color border border-color hover:bg-opacity-5`
						},

						large: {
							base: uy`px-6 py-2.5 text-base leading-7 h-11 gap-2 after:w-6 after:h-6`,
							prefix: uy`w-7 h-7`,
							suffix: uy`w-7 h-7`
						},
						fullWidth: uy`w-full flex-1 grid-cols-[1fr]`,
						squared: uy`aspect-square px-0`,
						disabled: uy` opacity-55 cursor-not-allowed`,
						loading: uy`text-opacity-0 cursor-default`
						// loading: uy`text-opacity-0 cursor-wait data-[variant="solid"]:after:border-color data-[variant="solid"]:after:border-t-2 data-[variant="solid"]:after:border-t-color `
					},
					menu: {
						base: 'z-10 bg-surface-light raised rounded p-0.5 w-fit grid gap-1',
						item: 'px-4 py-1.5 text-sm text-left text-nowrap outline-none rounded outline-none cursor-pointer p-2 w-full items-center text-sm text-contrast  justify-between flex items-center gap-4'
					},
					form: {
						base: uy`grid gap-4`
					},
					field: {
						base: uy`grid gap-2`,
						label: uy`text-contrast-light font-light text-sm`,
						description: uy`text-contrast-muted text-xs leading-3 flex-1`,
						helper: uy`text-contrast-muted text-xs leading-3`,
						errors: uy`grid gap-1`,
						error: uy`text-danger text-xs leading-3`,
						actions: uy`flex items-start gap-2`,
						header: uy`flex items-end gap-2 justify-between`,
						footer: uy`flex items-start gap-2 justify-between`,
						inputContainer: uy`flex-1 gap-2 flex justify-between w-full items-center p-1`
					},
					textInput: {
						parent: uy`bg-surface-light border border-surface-lighter text-contrast-light w-full focus-within:ring-1 focus-within:ring-contrast focus-within:ring-opacity-50 ring-0 transition-all rounded-lg font-normal`,
						base: uy`p-2 outline-none flex-1 h-full w-full rounded bg-transparent leading-3 text-sm resize-none placeholder:text-contrast-muted autofill:text-contrast-light`
					},
					toggle: {
						group: {
							base: uy`flex items-center gap-2 overflow-hidden`,
							outline: {
								base: uy`gap-0 border border-color-lighter rounded`,
								button: {
									base: uy`border-0 h-full border-r first-of-type:border-l-0 border-color-lighter last-of-type:border-r-0 rounded-none`
								}
							}
						},
						button: {
							base: uy`outline-none text-contrast-lighter p-1.5 text-xs aspect-square rounded transition-all hover:bg-color-lighter`,
							checked: uy`bg-color-lighter text-contrast ring-color ring-1`,
							disabled: uy`opacity cursor-not-allowed`,
							selected: uy`text-contrast ring-1 ring-offset-1 ring-color`,
							small: {
								base: uy`p-1 text-xs`
							},
							large: {
								base: uy`p-2 text-sm`
							},
							outline: uy`border border-color-lighter`
						}
					},
					badge: {
						parent: uy`relative overflow-visible`,
						base: uy`rounded-full leading-[100%] px-1 min-h-5 min-w-5 text-xs flex items-center justify-center bg-color text-color-fg absolute z-10`,
						topLeft: uy`-top-2 -left-2`,
						topRight: uy`-top-2 -right-2`,
						bottomLeft: uy`-bottom-2 -left-2`,
						bottomRight: uy`-bottom-2 -right-2`,
						large: {
							base: uy`min-h-7 min-w-7 text-sm`,
							topLeft: uy`-top-3 -left-3`,
							topRight: uy`-top-3 -right-3`,
							bottomLeft: uy`-bottom-3 -left-3`,
							bottomRight: uy`-bottom-3 -right-3`
						},
						small: {
							base: uy`min-h-4 min-w-4 text-[8px]`,
							topLeft: uy`-top-1.5 -left-1.5`,
							topRight: uy`-top-1.5 -right-1.5`,
							bottomLeft: uy`-bottom-1.5 -left-1.5`,
							bottomRight: uy`-bottom-1.5 -right-1.5`
						},
						ghost: uy`bg-color-light/40 text-color`,
						outlined: uy`bg-color-muted text-color border-color border`
					}
				}
			}
		}),
		// `rtl:` variant for the few genuinely direction-dependent utilities
		// (Tailwind v3 has no built-in logical/RTL variant). It only matches
		// under `<html dir="rtl">` — i.e. Arabic — so every LTR locale renders
		// byte-for-byte unchanged.
		plugin(({ addVariant }) => addVariant('rtl', '&:where([dir="rtl"], [dir="rtl"] *)'))
	]
};

export default config;
