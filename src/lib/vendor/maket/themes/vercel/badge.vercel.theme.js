export const vercel_badge = () => ({
    base: {
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        borderRadius: '9999px',
        width: 'fit-content',
        padding: '0.25rem 0.5rem',
        justifyContent: 'center',
        fontWeight: '400',
        '--tw-bg-opacity': '1',
        '--tw-text-opacity': '1',
        backgroundColor: `rgb( var(--color)/ var(--tw-bg-opacity))`,
        color: `rgb(var(--color-fg)/ var(--tw-text-opacity))`,
        "&[data-variant='outline']": {},
        "&[data-variant='soft']": {}
    },
    soft: {
        '--tw-bg-opacity': `${0.2}`,
        backgroundColor: `rgb(var(--color)/ var(--tw-bg-opacity))`,
        color: `rgb(var(--color)/ var(--tw-text-opacity))`
    },
    outline: {
        backgroundColor: 'inherit',
        border: '1px solid rgb(var(--color)/ var(--tw-bg-opacity))',
        color: `rgb(var(--color)/ var(--tw-text-opacity))`
    },
    container: {
        small: {
            fontSize: '11px',
            lineHeight: '11px',
            padding: '4.5px 8px'
        },
        normal: {
            fontSize: '12px',
            lineHeight: '12px',
            padding: '6px 10px'
        },
        large: {
            fontSize: '14px',
            lineHeight: '14px',
            padding: '9px 12px'
        }
    },
    icon: {
        small: {
            maxHeight: '11px',
            maxWidth: '11px'
        },
        normal: {
            maxHeight: '12px',
            maxWidth: '12px'
        },
        large: {
            maxHeight: '14px',
            maxWidth: '14px'
        }
    }
});
