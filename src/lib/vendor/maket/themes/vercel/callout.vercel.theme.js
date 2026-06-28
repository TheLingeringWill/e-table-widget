export const vercel_callout = ({ theme, fontSize, upperFirst }) => ({
    '.ui-callout': {
        display: 'flex',
        alignItems: 'center',
        gap: theme('gap.4'),
        borderRadius: theme('borderRadius.DEFAULT'),
        padding: `${theme('padding.2')} ${theme('padding.3')}`,
        maxWidth: 'min(100%, 650px)',
        containerType: 'inline-size',
        flexWrap: 'wrap',
        '&[data-size="large"]': {
            padding: `${theme('padding.3')} ${theme('padding.3')}`,
            '.ui-callout-title': {
                ...fontSize('fontSize.md')
            },
            '.ui-callout-description': {
                ...fontSize('fontSize.DEFAULT')
            },
            '.ui-callout-icon': {
                width: '30px',
                height: '30px'
            }
        },
        '&[data-size="small"]': {
            padding: `${theme('padding.1')} ${theme('padding.3')}`,
            '.ui-callout-title': {
                ...fontSize('fontSize.sm')
            },
            '.ui-callout-description': {
                ...fontSize('fontSize.xs')
            },
            '.ui-callout-icon': {
                width: '15px',
                height: '15px'
            }
        }
    },
    '.ui-callout-content': {
        flex: '1 1 0%',
        display: 'grid',
        gap: theme('gap.2')
    },
    '.ui-callout-actions': {
        width: 'auto',
        display: 'flex',
        gap: theme('gap.2'),
        flexWrap: 'wrap'
    }
});
