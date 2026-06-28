export const vercel_heading = ({ theme, text }) => {
    return {
        base: {
            scrollMargin: '20rem',
            margin: '0px 0px',
            ...text('colors.text.DEFAULT')
        },
        h1: { fontSize: theme('fontSize.4xl'), lineHeight: theme('fontSize.4xl') },
        h2: { fontSize: theme('fontSize.3xl'), lineHeight: theme('fontSize.3xl') },
        h3: { fontSize: theme('fontSize.2xl'), lineHeight: theme('fontSize.2xl') },
        h4: { fontSize: theme('fontSize.xl'), lineHeight: theme('fontSize.xl') },
        h5: { fontSize: theme('fontSize.lg'), lineHeight: theme('fontSize.lg') },
        h6: { fontSize: theme('fontSize.md'), lineHeight: theme('fontSize.md') },
        muted: {
            ...text('colors.text.muted')
        },
        balanced: {
            textWrap: 'balance'
        },
        bold: { fontWeight: 'bold' },
        light: { fontWeight: 'light' },
        center: {
            textAlign: 'center'
        },
        right: {
            textAlign: 'right'
        },
        left: {
            textAlign: 'left'
        },
        underline: {
            textDecoration: 'underline',
            textDecorationThickness: '0.125rem',
            textUnderlineOffset: `calc(${theme('fontSize.4xl')}/10)`
        }
    };
};
