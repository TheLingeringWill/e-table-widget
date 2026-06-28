export const vercel_avatar = ({ theme, background, text, border }) => ({
    avatarContainer: {
        position: 'relative',
        alignItems: 'center',
        borderWidth: '1px',
        ...border('colors.border.DEFAULT'),
        ...text('colors.text.DEFAULT'),
        aspectRatio: '1/1',
        borderRadius: '9999px',
        width: '2.5rem',
        height: '2.5rem'
    },
    image: {
        borderRadius: '9999px',
        position: 'absolute',
        top: '0',
        left: '0',
        zIndex: '0',
        objectFit: 'cover',
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        maxHeight: '100%'
    },
    initials: {
        position: 'absolute',
        ...background('colors.background.DEFAULT'),
        bottom: '0',
        width: '100%',
        height: '100%',
        textAlign: 'center',
        left: '0',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        fontSize: '1rem'
    },
    prefix: {
        position: 'absolute',
        bottom: '-0.25rem',
        borderRadius: '9999px',
        borderWidth: '1px',
        ...border('colors.border.DEFAULT'),
        padding: '0.25rem',
        ...background('colors.background.DEFAULT'),
        width: '1.1rem',
        height: '1.1rem',
        left: '-0.25rem',
        aspectRatio: '1/1'
    },
    suffix: {
        position: 'absolute',
        bottom: '-0.25rem',
        borderRadius: '9999px',
        borderWidth: '1px',
        ...border('colors.border.DEFAULT'),
        padding: '0.25rem',
        ...background('colors.background.DEFAULT'),
        width: '1.1rem',
        height: '1.1rem',
        right: '-0.25rem',
        aspectRatio: '1/1'
    },
    groupContainer: {
        display: 'flex',
        isolation: 'isolate',
        '.ui-avatar-container:not(:first-child)': {
            marginLeft: '-0.75rem'
        }
    },
    remainingCount: {
        ...background('colors.muted.DEFAULT'),
        ...text('colors.text.DEFAULT'),
        textAlign: 'center',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        borderWidth: '1px',
        ...border('colors.border.DEFAULT'),
        width: '2.5rem',
        height: '2.5rem',
        fontSize: '1rem',
        marginLeft: '-0.75rem',
        zIndex: '+1'
    },
    small: {
        groupContainer: {
            '.ui-avatar-container:not(:first-child)': {
                marginLeft: '-0.5rem'
            }
        },
        avatarContainer: {
            width: '2rem',
            height: '2rem'
        },
        image: {},
        prefix: { width: '0.90rem', height: '0.90rem', left: '-0.25rem' },
        suffix: { width: '0.90rem', height: '0.90rem', right: '-0.25rem' },
        initials: { fontSize: '0.75rem' },
        remainingCount: {
            width: '2rem',
            height: '2rem',
            fontSize: '0.75rem',
            marginLeft: '-0.5rem'
        }
    },
    large: {
        groupContainer: {
            '.ui-avatar-container:not(:first-child)': {
                marginLeft: '-1rem'
            }
        },
        avatarContainer: {
            width: '3rem',
            height: '3rem'
        },
        image: {},
        prefix: { width: '1.4rem', height: '1.4rem', left: '-0.5rem' },
        suffix: { width: '1.4rem', height: '1.4rem', right: '-0.5rem' },
        initials: { fontSize: '1.25rem' },
        remainingCount: {
            width: '3rem',
            height: '3rem',
            fontSize: '1.25rem',
            marginLeft: '-1rem'
        }
    }
});
