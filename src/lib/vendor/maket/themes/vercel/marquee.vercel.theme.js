export const vercel_marquee = (u) => ({
    container: {
        overflow: 'hidden'
    },
    animation: { to: { transform: 'translate(calc(-50% - 0.5rem))' } },
    list: {
        display: 'flex',
        minWidth: '100%',
        animation: 'marquee var(--animation-duration) linear infinite var(--animation-direction)',
        gap: '1rem',
        padding: '0 1rem',
        width: 'max-content',
        flexWrap: 'nowrap'
    }
});
