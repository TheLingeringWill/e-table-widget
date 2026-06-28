export const vercel_dialog = ({ theme, text, background, border, fontSize }) => ({
    '.ui-dialog-overlay': {
        padding: theme('padding-10'),
        ...background('colors.background.DEFAULT', 0.8),
        '&[open]': {
            position: 'fixed',
            width: '100dvw',
            height: '100dvh',
            top: '0',
            left: '0',
            bottom: '0',
            right: '0',
            display: 'flex',
            overflowY: 'auto',
            overflowX: 'hidden'
        },
        '.ui-dialog-container': {
            // mx-auto bg-surface-light border border-surface-lighter w-[500px] rounded p-10 flex items-center
            ...background('colors.background.DEFAULT'),
            borderWidth: theme('borderWidth.DEFAULT'),
            ...border('colors.border.DEFAULT'),
            ...text('colors.border.DEFAULT'),
            display: 'flex',
            flexDirection: 'column',
            gridTemplateColumns: '1fr',
            gap: theme('gap.4'),
            width: '500px',
            '&:has(> .ui-dialog-footer)': {
                paddingBottom: '0'
            }
        },
        "&[data-type='drawer-right'] .ui-dialog-container": {
            marginTop: 'auto',
            marginBottom: 'auto',
            marginLeft: 'auto',
            borderRadius: `${theme('borderRadius.DEFAULT')} 0 0  ${theme('borderRadius.DEFAULT')}`,
            width: '500px',
            maxWidth: '100%',
            height: '90%',
            maxHeight: '95%',
            overflowY: 'auto'
        },
        "&[data-type='drawer-left'] .ui-dialog-container": {
            marginTop: 'auto',
            marginBottom: 'auto',
            marginRight: 'auto',
            borderRadius: `0 ${theme('borderRadius.DEFAULT')} ${theme('borderRadius.DEFAULT')} 0`,
            width: '500px',
            maxWidth: '100%',
            height: '90%',
            maxHeight: '95%',
            overflowY: 'auto',
            direction: 'rtl',
            '*': {
                direction: 'ltr'
            }
        },
        "&[data-type='drawer-bottom']": {
            overflowY: 'hidden'
        },
        "&[data-type='drawer-bottom'] .ui-dialog-container": {
            marginTop: 'auto',
            marginLeft: 'auto',
            marginRight: 'auto',
            borderRadius: `${theme('borderRadius.DEFAULT')} ${theme('borderRadius.DEFAULT')} 0 0`,
            width: 'min(98%, 500px)',
            height: 'auto',
            maxHeight: '800px',
            overflowY: 'auto',
            borderBottomWidth: '0px'
        },
        "&[data-type='modal']": {
            padding: theme('padding.10')
        },
        "&[data-type='modal'] .ui-dialog-container": {
            margin: 'auto',
            transformOrigin: 'top center',
            width: 'min(95%, 500px)',
            borderRadius: theme('borderRadius.DEFAULT')
        },
        "&[data-type='alert-dialog'] .ui-dialog-container": {
            margin: 'auto',
            width: 'min(95%, 500px)',
            borderRadius: theme('borderRadius.DEFAULT'),
            height: 'auto,'
        },
        '.ui-dialog-header': {
            display: 'flex',
            gap: theme('gap.4'),
            borderRadius: `${theme('borderRadius.DEFAULT')} ${theme('borderRadius.DEFAULT')} 0 0`,
            flexWrap: 'wrap',
            height: 'fit-content',
            padding: theme('padding.4'),
            // position: 'sticky',
            // top: '0',
            ...background('colors.muted.DEFAULT')
        },
        '.ui-dialog-header-prefix': {},
        '.ui-dialog-header-title': {
            flex: '1 1 0%',
            display: 'flex',
            alignItems: 'center',
            ...fontSize('fontSize.lg'),
            ...text('colors.text.DEFAULT')
        },
        '.ui-dialog-header-suffix': {
            marginLeft: 'auto'
        },
        '.ui-dialog-description': {
            ...fontSize('fontSize.sm'),
            ...text('colors.text.muted'),
            width: '100%'
        },
        '.ui-dialog-content': {
            padding: theme('padding.4'),
            ...text('colors.text.DEFAULT')
        },
        '.ui-dialog-footer': {
            display: 'flex',
            gap: theme('gap.4'),
            justifyContent: 'flex-end',
            ...background('colors.muted.DEFAULT'),
            borderTopWidth: theme('borderWidth.DEFAULT'),
            ...border('colors.border.DEFAULT'),
            borderRadius: `0 0 ${theme('borderRadius.DEFAULT')} ${theme('borderRadius.DEFAULT')}`,
            padding: theme('padding.4'),
            marginTop: 'auto'
            // position: 'sticky',
            // bottom: '0'
        }
    },
    ".ui-drawer[open][data-position='left']": {
        justifyContent: 'flex-start'
    },
    ".ui-drawer[open][data-position='right']": {
        justifyContent: 'flex-end'
    },
    '.ui-modal': {
        '&.ui-dialog-overlay': {}
    }
});
