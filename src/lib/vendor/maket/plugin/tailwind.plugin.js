import twPlugin from 'tailwindcss/plugin.js';
import { getTypeScale } from './typeScale.js';
import { vercel_theme } from '../themes/index.js';
import { components } from './components.js';
import { generateColorPalette, paletteToCssVariables, toTailwindCssTheme } from './palette.js';
import { deepMerge } from '../types/index.js';
import { resolveComponentDefinition } from './uy.js';
import { getSpinner } from './spinnner.js';
let cachedConfig;
const maket = twPlugin.withOptions(function (options) {
    return async function ({ addComponents, addUtilities, addVariant, config, theme, addBase, matchUtilities }) {
        const { themes } = deepMerge(options?.baseDesignSystem || vercel_theme, options?.customDesignSystem);
        addVariant('dc', '& > *');
        // Shadows utilities
        addBase({
            '[data-color-scheme="dark"]': {
                '--dark-raised-border': '1px solid var(--current-border, hsl(var(--surface-lighter) / var(--tw-border-opacity,1)))',
                '--dark-raised-shadow': 'none'
            },
            '[data-color-scheme="light"]': {
                // '--light-raised-border': 'none'
                '--light-raised-border': 'var(--current-border, hsl(var(--surface-lighter) / var(--tw-border-opacity,1)))'
            }
        });
        addUtilities({
            '.flex-full': {
                flex: '0 0 100%'
            },
            '.h-window': {
                height: 'var(--window-height)'
            },
            '.w-window': {
                width: 'var(--window-width)'
            }
        });
        matchUtilities({
            raised: (value) => {
                if (value !== 'none') {
                    const valueWithoutRgb = value.replace(/rgb\((.*?)\)/g, 'var(--tw-shadow-color)');
                    return {
                        border: '1px solid var(--light-raised-border, var(--current-border, hsl(var(--surface-lighter) / var(--tw-border-opacity,1))))',
                        '--tw-shadow': value,
                        '--tw-shadow-colored': valueWithoutRgb,
                        'box-shadow': `var(--dark-raised-shadow, var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow))`
                    };
                }
                else {
                    return {
                        'box-shadow': 'none',
                        '--tw-shadow': 'none',
                        '--tw-shadow-colored': 'none',
                        border: '0px'
                    };
                }
            }
        }, {
            values: theme('boxShadow')
        });
        addComponents({
            '.ui-spinner': getSpinner(options).style
        });
        addBase({
            '.ui-icon': {
                maxHeight: '100%',
                aspectRatio: '1/1'
            },
            details: {
                'padding-left': '0',
                'background-image': 'none',
                '-webkit-appearance': 'none',
                summary: {
                    'list-style': 'none',
                    'padding-left': '0',
                    'background-image': 'none',
                    '-webkit-appearance': 'none',
                    '&::marker': {
                        display: 'none',
                        content: '""'
                    },
                    '&::-webkit-details-marker': {
                        display: 'none',
                        content: '""'
                    }
                }
            },
            '[data-color="primary"]': {
                '--color': 'var(--primary-DEFAULT)',
                '--color-fg': 'var(--primary-fg)',
                '--color-light': 'var(--primary-light)',
                '--color-lighter': 'var(--primary-lighter)',
                '--color-muted': 'var(--primary-muted)',
                '--color-dark': 'var(--primary-dark)'
            },
            '[data-color="secondary"]': {
                '--color': 'var(--secondary-DEFAULT)',
                '--color-fg': 'var(--secondary-fg)',
                '--color-light': 'var(--secondary-light)',
                '--color-lighter': 'var(--secondary-lighter)',
                '--color-muted': 'var(--secondary-muted)',
                '--color-dark': 'var(--secondary-dark)'
            },
            '[data-color="success"]': {
                '--color': 'var(--success-DEFAULT)',
                '--color-fg': 'var(--success-fg)',
                '--color-light': 'var(--success-light)',
                '--color-lighter': 'var(--success-lighter)',
                '--color-muted': 'var(--success-muted)',
                '--color-dark': 'var(--success-dark)'
            },
            '[data-color="danger"]': {
                '--color': 'var(--danger-DEFAULT)',
                '--color-fg': 'var(--danger-fg)',
                '--color-light': 'var(--danger-light)',
                '--color-lighter': 'var(--danger-lighter)',
                '--color-muted': 'var(--danger-muted)',
                '--color-dark': 'var(--danger-dark)'
            },
            '[data-color="warning"]': {
                '--color': 'var(--warning-DEFAULT)',
                '--color-fg': 'var(--warning-fg)',
                '--color-light': 'var(--warning-light)',
                '--color-lighter': 'var(--warning-lighter)',
                '--color-muted': 'var(--warning-muted)',
                '--color-dark': 'var(--warning-dark)'
            },
            '[data-color="info"]': {
                '--color': 'var(--info-DEFAULT)',
                '--color-fg': 'var(--info-fg)',
                '--color-light': 'var(--info-light)',
                '--color-lighter': 'var(--info-lighter)',
                '--color-muted': 'var(--info-muted)',
                '--color-dark': 'var(--info-dark)'
            },
            '[data-color="surface"]': {
                '--color': 'var(--surface-DEFAULT)',
                '--color-fg': 'var(--surface-fg)',
                '--color-light': 'var(--surface-light)',
                '--color-lighter': 'var(--surface-lighter)',
                '--color-muted': 'var(--surface-muted)',
                '--color-dark': 'var(--surface-dark)'
            },
            '[data-color="contrast"]': {
                '--color': 'var(--contrast-DEFAULT)',
                '--color-fg': 'var(--contrast-fg)',
                '--color-light': 'var(--contrast-light)',
                '--color-lighter': 'var(--contrast-lighter)',
                '--color-muted': 'var(--contrast-muted)',
                '--color-dark': 'var(--contrast-dark)'
            }
        });
        matchUtilities({
            'bg-color': (value, { modifier }) => {
                return {
                    '--tw-bg-opacity': modifier ? `${parseInt(modifier) / 100}` : '1',
                    'background-color': `hsl(var(--color${value}) / var(--tw-bg-opacity))`,
                    '--current-background': `hsl(var(--color${value}) / var(--tw-bg-opacity))`,
                    '--tw-ring-offset-color': `hsl(var(--color${value}) / var(--tw-bg-opacity))`
                };
            },
            'text-color': (value, { modifier }) => {
                return {
                    '--tw-text-opacity': modifier ? `${parseInt(modifier) / 100}` : '1',
                    color: `hsl(var(--color${value}) / var(--tw-text-opacity))`
                };
            },
            'ring-color': (value) => {
                return {
                    '--tw-ring-opacity': '1',
                    '--tw-ring-color': `hsl(var(--danger-${value}) / var(--tw-ring-opacity))`
                };
            },
            'border-color': (value, { modifier }) => {
                return {
                    '--tw-border-opacity': modifier ? `${parseInt(modifier) / 100}` : '1',
                    '--tw-border-color': `var(--color${value})`,
                    borderColor: `hsl(var(--tw-border-color) / var(--tw-border-opacity))`
                };
            },
            'border-t-color': (value, { modifier }) => {
                return {
                    '--tw-border-opacity': modifier ? `${parseInt(modifier) / 100}` : '1',
                    borderTopColor: `hsl(var(--color) / var(--tw-border-opacity))`
                };
            },
            'border-b-color': (value, { modifier }) => {
                return {
                    '--tw-border-opacity': modifier ? `${parseInt(modifier) / 100}` : '1',
                    borderBottomColor: `hsl(var(--color) / var(--tw-border-opacity))`
                };
            },
            'border-l-color': (value, { modifier }) => {
                return {
                    '--tw-border-opacity': modifier ? `${parseInt(modifier) / 100}` : '1',
                    borderLeftColor: `hsl(var(--color) / var(--tw-border-opacity))`
                };
            },
            'border-r-color': (value, { modifier }) => {
                return {
                    '--tw-border-opacity': modifier ? `${parseInt(modifier) / 100}` : '1',
                    borderRightColor: `hsl(var(--color) / var(--tw-border-opacity))`
                };
            }
            // 'ring-color': (value, { modifier }) => {
            // 	console.log({ value });
            // 	return {
            // 		'--tw-ring-opacity': modifier ? `${parseInt(modifier) / 100}` : '1',
            // 		ringColor: `hsl(var(--color) / var(--tw-ring-opacity))`
            // 	};
            // },
        }, {
            values: {
                DEFAULT: '',
                light: '-light',
                lighter: '-lighter',
                dark: '-dark',
                muted: '-muted',
                fg: '-fg'
            },
            type: 'color',
            modifiers: 'any'
        });
        Object.entries(themes).forEach(([theme_name, theme_definition], i) => {
            const colorPalette = generateColorPalette(theme_definition);
            const cssVariables = paletteToCssVariables(colorPalette);
            if (i === 0) {
                addComponents({
                    [`html`]: cssVariables
                });
            }
            addComponents({
                [`html[data-theme="${theme_name}"]`]: cssVariables
            });
            Object.entries(colorPalette).forEach(([colorKey]) => {
                matchUtilities({
                    [`bg-${colorKey}`]: (value, { modifier }) => {
                        return {
                            '--tw-bg-opacity': modifier ? `${parseInt(modifier) / 100}` : '1',
                            '--current-background': value.replace('<alpha-value>', 'var(--tw-bg-opacity)'),
                            'background-color': value.replace('<alpha-value>', 'var(--tw-bg-opacity)')
                        };
                    },
                    [`border-${colorKey}`]: (value, { modifier }) => {
                        return {
                            '--tw-border-opacity': modifier ? `${parseInt(modifier) / 100}` : '1',
                            '--current-border': value.replace('<alpha-value>', 'var(--tw-border-opacity)'),
                            'border-color': value.replace('<alpha-value>', 'var(--tw-border-opacity)')
                        };
                    }
                }, {
                    values: theme(`colors.${colorKey}`),
                    modifiers: 'any'
                });
            });
        });
        cachedConfig = config();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - this is a private API
        if (cachedConfig?.content?.files?.[0]?.extension !== 'components') {
            // wasCached = true;
            const [base, target] = await Promise.all([
                resolveComponentDefinition(options?.baseDesignSystem?.components || vercel_theme.components, cachedConfig),
                resolveComponentDefinition(options?.customDesignSystem?.components || vercel_theme.components, cachedConfig)
            ]);
            Object.entries(components).forEach(([key, value]) => {
                if (key in base) {
                    const component = value(base[key], target[key]);
                    if (Array.isArray(component)) {
                        component.forEach((component) => {
                            addComponents(component);
                        });
                    }
                    else {
                        addComponents(component);
                    }
                }
            });
        }
    };
}, (options) => {
    const typeScale = getTypeScale({
        min: {
            fontSize: 12.5,
            screenWidth: 400,
            ratio: 'Minor Second'
        },
        max: {
            fontSize: 11.5,
            screenWidth: 1280,
            ratio: 'Minor Third'
        }
    });
    return {
        safelist: ['animate-marquee', 'animate-ui-spinner', 'animate-ui-spinner-before'],
        theme: {
            extend: {
                animation: {
                    spinner: 'spinner 1.1s infinite linear',
                    marquee: 'marquee var(--animation-duration) infinite var(--animation-direction) linear',
                    'ui-spinner': 'ui-spinner-animation 1.1s infinite linear',
                    'ui-spinner-before': 'ui-spinner-animation-before 1.1s infinite linear'
                },
                keyframes: {
                    marquee: { to: { transform: 'translate(calc(-50% - 0.5rem))' } },
                    ...getSpinner(options).keyframes,
                    fadeIn: {
                        from: {
                            opacity: '0'
                        }
                    },
                    fadeOut: {
                        to: {
                            opacity: '0'
                        }
                    },
                    fadeInOut: {
                        from: {
                            opacity: '1'
                        },
                        to: {
                            opacity: '0'
                        }
                    },
                    slideFromRight: {
                        from: {
                            transform: 'translateX(100%)'
                        }
                    },
                    slideFromLeft: {
                        to: {
                            transform: 'translateX(-100%)'
                        }
                    },
                    slideToRight: {
                        to: {
                            transform: 'translateX(100%)'
                        }
                    },
                    slideToLeft: {
                        to: {
                            transform: 'translateX(-100%)'
                        }
                    },
                    spinner: {
                        to: {
                            transform: 'rotate(360deg)'
                        }
                    }
                },
                colors: toTailwindCssTheme(),
                fontSize: typeScale
            }
        }
    };
});
export { maket };
