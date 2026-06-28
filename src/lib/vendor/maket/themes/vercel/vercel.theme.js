// import { vercel_avatar } from './avatar.vercel.theme';
// import { vercel_heading } from './heading.vercel.theme';
// import { vercel_text } from './text.vercel.theme';
// import { vercel_badge } from './badge.vercel.theme';
// import { vercel_code } from './code.vercel.theme';
// import { vercel_blockquote } from './blockquote.vercel';
// import { vercel_callout } from './callout.vercel.theme';
// import { vercel_dialog } from './dialog.vercel.theme';
// import { vercel_thumb } from './thumb.vercel.theme';
// import { vercel_marquee } from './marquee.vercel.theme';
import { uy } from '../../plugin/uy.js';
export const vercel_theme = {
    themes: {
        dark: {
            radius: 10,
            colorScheme: 'dark',
            colors: {
                primary: 'zinc'
            }
        },
        light: {
            radius: 10,
            colorScheme: 'light',
            colors: {
                primary: 'zinc'
            }
        }
    },
    components: {
        hoverCard: {},
        card: {},
        kbd: {},
        slideShow: {},
        slider: {},
        marquee: {},
        tabs: {},
        networkIndicator: {},
        separator: {
            base: uy `bg-[rgb(var(--color)_/_1)] text-[rgb(var(--color-fg)_/_1)] text-xs text-center relative`,
            horizontal: uy `h-[var(--size)] w-full`,
            vertical: uy `w-[var(--size)] h-full`,
            label: uy `absolute top-1/2 left-1/2 whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2 bg-opacity-80 text-[0.75rem] px-2 bg-[rgb(var(--current-background)_/_var(--tw-bg-opacity))]`
        },
        heading: {
            base: uy `scroll-m-[20rem] mx-0 text-colors`,
            h1: uy `text-4xl leading-none`,
            h2: uy `text-3xl leading-none`,
            h3: uy `text-2xl leading-none`,
            h4: uy `text-xl leading-none`,
            h5: uy `text-lg leading-none`,
            h6: uy `text-base leading-none`,
            muted: uy `text-muted`,
            balanced: uy ``, // Tailwind does not have a utility for textWrap 'balance'
            bold: uy `font-bold`,
            light: uy `font-light`,
            center: uy `text-center`,
            right: uy `text-right`,
            left: uy `text-left`,
            underline: uy `underline decoration-[0.125rem] underline-offset-[calc(1.25rem/10)]`
        },
        text: {},
        button: {},
        breadcrumbs: {},
        toast: {},
        code: {},
        chip: {},
        callout: {},
        menu: {},
        form: {},
        blockquote: {},
        thumb: {},
        avatar: {},
        avatarGroup: {},
        textInput: {},
        field: {},
        badge: {},
        pininput: {
            base: uy `flex items-center gap-2`,
            input: uy `rounded-md bg-white text-center text-lg text-magnum-900 shadow-sm size-12`
        },
        accordion: {},
        accordionGroup: {}
        // avatar: vercel_avatar(utils),
        // badge: vercel_badge(utils),
        // code: vercel_code(utils),
        // blockquote: vercel_blockquote(utils),
        // callout: vercel_callout(utils),
        // dialog: vercel_dialog(utils),
        // thumb: vercel_thumb(utils),
        // marquee: vercel_marquee(utils)
    }
};
