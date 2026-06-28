export const vercel_blockquote = ({ theme, text, background, border, fontSize, upperFirst }) => ({
    '.ui-blockquote': {
        display: 'grid',
        alignItems: 'center',
        gap: theme('gap.4'),
        padding: `${theme('padding.3')} ${theme('padding.8')}`,
        maxWidth: 'min(100%, 650px)',
        containerType: 'inline-size',
        borderRadius: theme('borderRadius.DEFAULT'),
        borderLeftWidth: '6px',
        flexWrap: 'wrap',
        '--tw-bg-opacity': '0.2',
        '--tw-border-opacity': '1',
        '--tw-text-opacity': '1',
        backgroundColor: `rgb(var(--color)/ var(--tw-bg-opacity))`,
        color: `rgb(var(--color)/ var(--tw-text-opacity))`,
        borderLeft: `4px solid rgb(var(--color)/ var(--tw-border-opacity))`,
        ...fontSize('fontSize.DEFAULT'),
        '.ui-blockquote-content': {
            ...upperFirst,
            position: 'relative',
            '&:before': {
                content: 'open-quote',
                fontSize: theme('fontSize.2xl'),
                opacity: '0.5',
                top: '0.1em',
                position: 'absolute',
                left: '-20px'
            }
        },
        '.ui-blockquote-description': {
            ...upperFirst,
            marginLeft: 'auto',
            textAlign: 'right',
            fontStyle: 'italic',
            opacity: '0.5',
            ...fontSize('fontSize.sm')
        },
        '&[data-size="large"]': {
            padding: `${theme('padding.4')} ${theme('padding.9')}`,
            ...fontSize('fontSize.md'),
            borderLeftWidth: '8px',
            '.ui-blockquote-description': {
                ...fontSize('fontSize.DEFAULT')
            }
        },
        '&[data-size="small"]': {
            padding: `${theme('padding.2')} ${theme('padding.7')}`,
            borderLeftWidth: '2px',
            ...fontSize('fontSize.sm'),
            '.ui-blockquote-description': {
                ...fontSize('fontSize.xs')
            }
        }
    }
});
