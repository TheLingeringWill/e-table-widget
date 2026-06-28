import { getContext, setContext } from 'svelte';
export const create_theme_context = (opts) => {
    class Theme {
        transitions = $state({
            duration: 200,
            easing: 'cubicInOut',
            delay: 0,
            ...(opts?.transitions || {})
        });
        dialogTransitions = opts?.dialogTransitions || {};
        toastTransitions = opts?.toastTransitions || {};
        popoverTransitions = opts?.popoverTransitions || {};
        preferReducesMotion = $state(false);
        popovers = $state([]);
        dialogs = $state([]);
        breakpoint = $state(null);
        bodyPadding = $state(0);
        randomID = (type) => type + '-' + Math.random().toString(36).substring(2, 9);
        snippets = opts?.snippets || {};
        currentTheme = $state(opts?.defaultTheme.name || null);
        currentColorScheme = $state(opts?.defaultTheme.colorScheme || null);
        window = $state({
            width: 0,
            height: 0
        });
        dialog = {
            add: (dialog) => {
                this.dialogs.push(dialog);
            },
            remove: (dialog) => {
                this.dialogs = this.dialogs.filter((d) => d.id !== dialog.id);
            }
        };
        toggleScroll = (lock) => {
            if (typeof this.bodyPadding === 'number') {
                if (lock) {
                    if (document.body.style.overflow === 'hidden') {
                        return;
                    }
                    this.bodyPadding = window.innerWidth - document.body.clientWidth || 0;
                    document.body.style.overflow = 'hidden';
                    document.body.style.paddingRight = this.bodyPadding + 'px';
                }
                else {
                    document.body.style.overflow = 'auto';
                    document.body.style.paddingRight = '0px';
                }
            }
        };
        setTheme = (theme, colorScheme) => {
            this.currentTheme = theme;
            this.currentColorScheme = colorScheme;
            document.documentElement.setAttribute('data-theme', theme);
            document.documentElement.setAttribute('data-color-scheme', colorScheme);
            window.localStorage.setItem('color-scheme', colorScheme);
            window.localStorage.setItem('theme', theme);
        };
        getResponsiveProps = (props, breakpoint) => {
            const defaultProp = props.xl ?? props.lg ?? props.md ?? props.sm ?? props.xs ?? props;
            if (breakpoint === null) {
                return defaultProp;
            }
            else {
                const indexOfBreakpoint = ['xs', 'sm', 'md', 'lg', 'xl'].indexOf(breakpoint);
                const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'].slice(indexOfBreakpoint);
                for (const breakpoint of breakpoints) {
                    if (breakpoint in props) {
                        return props[breakpoint];
                    }
                }
                return defaultProp;
            }
        };
        getBreakpoint = () => {
            return window.innerWidth < 640
                ? 'xs'
                : window.innerWidth < 768
                    ? 'sm'
                    : window.innerWidth < 1024
                        ? 'md'
                        : window.innerWidth < 1280
                            ? 'lg'
                            : 'xl';
        };
        getColor = (color) => {
            const div = document.createElement('div');
            div.classList.add(`bg-${color}`);
            div.hidden = true;
            document.body.appendChild(div);
            const rbg = getComputedStyle(div).backgroundColor;
            const isRgb = rbg.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/) ||
                rbg.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)$/);
            if (isRgb) {
                const [, r, g, b] = isRgb.map((v) => parseInt(v));
                const rHex = r.toString(16);
                const gHex = g.toString(16);
                const bHex = b.toString(16);
                document.body.removeChild(div);
                return `#${rHex.length === 1 ? '0' + rHex : rHex}${gHex.length === 1 ? '0' + gHex : gHex}${bHex.length === 1 ? '0' + bHex : bHex}`;
            }
        };
        constructor() {
            $effect.pre(() => {
                this.preferReducesMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                this.currentTheme = window.localStorage.getItem('theme') || opts?.defaultTheme.name || null;
                this.currentColorScheme =
                    window.localStorage.getItem('color-scheme') || opts?.defaultTheme.colorScheme || null;
                window.addEventListener('storage', (e) => {
                    if (e.key === 'theme') {
                        this.currentTheme = e.newValue;
                        e.newValue && document.documentElement.setAttribute('data-theme', e.newValue);
                    }
                    if (e.key === 'color-scheme') {
                        this.currentColorScheme = e.newValue;
                        e.newValue && document.documentElement.setAttribute('data-color-scheme', e.newValue);
                    }
                });
                this.bodyPadding = window.innerWidth - document.body.clientWidth || 0;
                this.breakpoint = this.getBreakpoint();
                const resizeObserver = new ResizeObserver(() => {
                    this.window.width = document.body.clientWidth;
                    this.window.height = document.body.clientHeight;
                    // this.bodyPadding = window.innerWidth - document.body.clientWidth || 0;
                    const newBreakpoint = this.getBreakpoint();
                    if (newBreakpoint !== this.breakpoint) {
                        this.breakpoint = newBreakpoint;
                    }
                });
                resizeObserver.observe(document.body);
            });
        }
    }
    const theme = new Theme();
    setContext('theme', theme);
    return theme;
};
export const use_theme = () => {
    return getContext('theme');
};
