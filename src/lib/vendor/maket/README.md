# Vendored `maket`

This directory is a vendored, in-repo copy of the [`maket`](https://www.npmjs.com/package/maket)
design-system package (originally `maket@0.0.203`). It was vendored to **drop the external
pre-1.0 dependency while keeping the exact same UI** — the code here is maket's own `dist` output,
unmodified, so it generates byte-identical markup and CSS.

## What's here

Only the transitive closure reachable from the entry points the widget actually uses:

- `Components/Theme.svelte` — theme context provider (used in `src/routes/+layout.svelte`)
- `Components/Form/TextInput/TextInput.svelte` — used in `Contact.svelte`
- `Components/Separator/Separator.svelte` — used in `Payment.svelte`
- `Components/Form/Calendar/CalendarInput.svelte` — used via `ZonedCalendarInput.svelte`
- `plugin/tailwind.plugin.js` + `plugin/uy.js` — the Tailwind plugin + `uy` DSL helper, consumed
  by `tailwind.config.js`

Import the components by explicit path, e.g.
`import TextInput from '$lib/vendor/maket/Components/Form/TextInput/TextInput.svelte'`.
(No barrel `index.ts` — maket's own `dist/index.js` re-exports the plugin and is imported
internally, so it occupies the package-root index.)

## Updating

This is a manual vendor — there is no longer a `maket` dependency in `package.json`. To pull a newer
upstream version, re-run the closure copy from a freshly installed `maket/dist`. The source files
use relative imports with explicit extensions, so the directory layout must be preserved.
