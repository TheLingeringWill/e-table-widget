// Server-side re-export of the canonical REST DTO types.
// Canonical definitions live in `widget/src/lib/api-types.ts` so client modules
// can import them without crossing the SvelteKit `$lib/server` boundary.
// Item §0.4 e mandates this file's presence; it stays as a re-export shim.

export * from '$lib/api-types';
