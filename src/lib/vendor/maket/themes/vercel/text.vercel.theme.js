export const vercel_text = ({ theme, text }) => {
    return {
        base: {
            fontSize: theme('fontSize.DEFAULT'),
            lineHeight: theme('fontSize.DEFAULT'),
            ...text('colors.text.DEFAULT'),
            textUnderlineOffset: `calc(${theme('fontSize.DEFAULT')}/10)`
        },
        muted: {
            ...text('colors.text.muted')
        },
        sm: {
            fontSize: theme('fontSize.sm'),
            lineHeight: theme('fontSize.sm'),
            textUnderlineOffset: `calc(${theme('fontSize.sm')}/10)`
        },
        xs: {
            fontSize: theme('fontSize.xs'),
            lineHeight: theme('fontSize.xs'),
            textUnderlineOffset: `calc(${theme('fontSize.xs')}/10)`
        },
        underline: {
            textDecoration: 'underline',
            textDecorationThickness: '0.05rem'
        },
        bold: {
            fontWeight: 'bold'
        },
        light: {
            fontWeight: 'lighter'
        },
        italic: {
            fontStyle: 'italic'
        },
        uppercase: {
            textTransform: 'uppercase'
        },
        lowercase: {
            textTransform: 'lowercase'
        },
        capitalize: {
            textTransform: 'capitalize'
        },
        lineClamp: {
            overflow: 'hidden',
            display: '-webkit-box',
            webkitBoxOrient: 'vertical'
        }
    };
};
