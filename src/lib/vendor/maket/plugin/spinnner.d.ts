import type { TailwindOptions } from './tailwind.plugin.js';
export declare const getSpinner: (options: TailwindOptions) => {
    style: {
        width: string;
        height: string;
        border: string;
        borderBottomColor: string;
        borderRadius: string;
        display: string;
        boxSizing: string;
        animation: string;
    };
    keyframes: {
        'ui-spinner-animation': {
            '0%': {
                transform: string;
            };
            '100%': {
                transform: string;
            };
        };
    };
} | {
    style: {
        width: string;
        height: string;
        border: string;
        borderBottomColor: string;
        borderRadius: string;
        display: string;
        boxSizing: string;
        animation: string;
    };
    keyframes: {
        'ui-spinner-animation': {
            '0%': {
                transform: string;
            };
            '100%': {
                transform: string;
            };
        };
    };
} | {
    style: {
        width: string;
        height: string;
        borderRadius: string;
        position: string;
        animation: string;
        '&::before': {
            content: string;
            boxSizing: string;
            position: string;
            inset: string;
            borderRadius: string;
            border: string;
            animation: string;
        };
    };
    keyframes: {
        'ui-spinner-animation': {
            '100%': {
                transform: string;
            };
        };
        'ui-spinner-animation-before': {
            '0%': {
                clipPath: string;
            };
            '25%': {
                clipPath: string;
            };
            '50%': {
                clipPath: string;
            };
            '75%': {
                clipPath: string;
            };
            '100%': {
                clipPath: string;
            };
        };
    };
} | {
    style: {
        width: string;
        height: string;
        borderRadius: string;
        position: string;
        animation: string;
        '&::before': {
            content: string;
            boxSizing: string;
            position: string;
            inset: string;
            borderRadius: string;
            border: string;
            animation: string;
        };
    };
    keyframes: {
        'ui-spinner-animation': {
            '100%': {
                transform: string;
            };
        };
        'ui-spinner-animation-before': {
            '0%': {
                clipPath: string;
            };
            '25%': {
                clipPath: string;
            };
            '50%': {
                clipPath: string;
            };
            '75%': {
                clipPath: string;
            };
            '100%': {
                clipPath: string;
            };
        };
    };
};
export declare const spinners: {
    spinlargeQuarter: {
        style: {
            width: string;
            height: string;
            border: string;
            borderBottomColor: string;
            borderRadius: string;
            display: string;
            boxSizing: string;
            animation: string;
        };
        keyframes: {
            'ui-spinner-animation': {
                '0%': {
                    transform: string;
                };
                '100%': {
                    transform: string;
                };
            };
        };
    };
    spinLargeThreeQuarter: {
        style: {
            width: string;
            height: string;
            border: string;
            borderBottomColor: string;
            borderRadius: string;
            display: string;
            boxSizing: string;
            animation: string;
        };
        keyframes: {
            'ui-spinner-animation': {
                '0%': {
                    transform: string;
                };
                '100%': {
                    transform: string;
                };
            };
        };
    };
    spinDynamicThick: {
        style: {
            width: string;
            height: string;
            borderRadius: string;
            position: string;
            animation: string;
            '&::before': {
                content: string;
                boxSizing: string;
                position: string;
                inset: string;
                borderRadius: string;
                border: string;
                animation: string;
            };
        };
        keyframes: {
            'ui-spinner-animation': {
                '100%': {
                    transform: string;
                };
            };
            'ui-spinner-animation-before': {
                '0%': {
                    clipPath: string;
                };
                '25%': {
                    clipPath: string;
                };
                '50%': {
                    clipPath: string;
                };
                '75%': {
                    clipPath: string;
                };
                '100%': {
                    clipPath: string;
                };
            };
        };
    };
    spinDynamicThin: {
        style: {
            width: string;
            height: string;
            borderRadius: string;
            position: string;
            animation: string;
            '&::before': {
                content: string;
                boxSizing: string;
                position: string;
                inset: string;
                borderRadius: string;
                border: string;
                animation: string;
            };
        };
        keyframes: {
            'ui-spinner-animation': {
                '100%': {
                    transform: string;
                };
            };
            'ui-spinner-animation-before': {
                '0%': {
                    clipPath: string;
                };
                '25%': {
                    clipPath: string;
                };
                '50%': {
                    clipPath: string;
                };
                '75%': {
                    clipPath: string;
                };
                '100%': {
                    clipPath: string;
                };
            };
        };
    };
};
export type Spinner = keyof typeof spinners;
