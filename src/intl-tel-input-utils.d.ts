// intl-tel-input ships build/js/utils.js (loaded lazily via `loadUtilsOnInit`)
// but exposes no matching .d.ts for the `/utils` subpath. Declare it so the
// dynamic `import('intl-tel-input/utils')` in Contact.svelte type-checks under
// moduleResolution: bundler. Kept as a standalone ambient (script) file — no
// imports/exports — so the declaration applies globally.
declare module 'intl-tel-input/utils';
