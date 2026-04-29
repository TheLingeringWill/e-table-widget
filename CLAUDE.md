# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Embeddable SvelteKit booking widget for restaurant customer reservations. SvelteKit 2 + Svelte 5 runes, deployed to Cloudflare Pages (`wrangler.toml` → `e-table-widget`). The widget runs in an iframe on restaurant websites; the parent loads `/<restaurantId>/script` which injects the iframe and brokers `postMessage` events (`resize`, `gtm_event`).

## Commands

Package manager is **pnpm** and the dev server runs on **port 8987** (vite.config.ts).

```bash
pnpm dev                    # Dev server on http://localhost:8987
pnpm build                  # Cloudflare-adapter build
pnpm preview                # Preview built bundle on :4173
pnpm check                  # svelte-kit sync + svelte-check (typecheck Svelte)
pnpm lint                   # prettier --check + eslint
pnpm format                 # prettier --write
pnpm test:unit              # Vitest (src/**/*.{test,spec}.{js,ts})
pnpm test:integration       # Playwright (tests/, builds + previews on :4173)
pnpm load-test              # scripts/load-test-reservations.ts (see scripts/README.md)
```

**Verification note:** the unit + Playwright suites were already broken before the in-progress REST migration began. Do not rely on `pnpm test:unit` / `test:integration` as a pass/fail signal — verify behavior with Chrome MCP against the running dev server (parent harness at `test-fixtures/parent.html` mirrors widget→parent `postMessage` traffic to console for `read_console_messages`).

## Architecture

### REST migration (in progress)

The widget previously called shared package internals (Reservator/Prisma) directly. It now talks **only** to the e-table REST API at `PUBLIC_API_URL` via a server-only BFF.

- **`src/lib/server/api/rest-client.ts`** — thin `fetch` wrapper. Auth header is `X-API-Key: WIDGET_API_SECRET` (read from `$env/static/private` — never importable from client code). Returns a `RestResult<T>` discriminated union (`{ ok: true, data } | { ok: false, error: { code, message } }`) for 4xx; throws on 5xx.
- **`src/lib/server/api/widget-api.ts`** — typed `createWidgetApi(restaurantId)` factory. **The only entry point server code should use to talk to the API.** Methods: `getAggregate`, `getWidget`, `getServices`, `getAvailabilities`, `getBooking`, `createBooking`, `updateBooking`, `setBookingStatus`, `upsertReview`, `getReviewSettings`, `getPaymentIntent`.
- **`src/lib/server/api/types.ts`** re-exports DTOs from `src/lib/api-types.ts` (the canonical, client-safe DTO copy of the OpenAPI shapes — refresh from `${PUBLIC_API_URL}/api-docs/openapi.json` when adapter touches a new field).
- **`src/lib/server/api/adapters/`** — DTO ↔ legacy widget-state shapes. Date/time normalization, slot semantic-state derivation (`AVAILABLE | ALMOST_FULL | FULL | CLOSED`), pax filtering (REST has no pax filter — applied client-side).
- **`src/lib/server/api/mocks/payment-intent.ts`** — payment-intent endpoints (PRD §9.2) are not yet on the live API. When `WIDGET_PAYMENT_MOCK_MODE` is set (`stripe-test` | `full`), the BFF synthesizes the payment-intent record. Hard rule: **mocks live ONLY in this file**, no per-component `if (mock)` branches.

### Hand-rolled RPC dispatcher (replaces svelte-rpc)

The widget UI calls a handful of named methods over a `POST /api/<method>` endpoint with devalue-encoded multipart bodies. There is **no `svelte-rpc` dependency** anywhere in widget source (PRD §0.4 item a) — both ends speak the wire format directly.

- **`src/hooks.server.ts`** — `rpcHandle` is the dispatcher. Dispatches to `router[method].call(event, validated_input)`, encodes the result back as multipart with a single `value` field. Also installs `corsHandle` (open CORS for `/api/*`) and `localsHandle` (sets `event.locals.countryCode` from Cloudflare's `cf.country`).
- **`src/lib/server/rpc-router.ts`** — defines the methods (`getServices`, `getServiceSlots`, `book`, `loadReservation`, `loadPaymentIntent`, `getAlternativeRestaurant`). Each calls into `createWidgetApi(...)` and runs the response through an adapter to produce the shape the existing UI components expect. Restaurant id is read from the `X-RESTO` header (the dispatcher path has no `:restaurantId` segment).
- **`src/lib/widget-rpc-client.ts`** — browser-side `Proxy` that mirrors the legacy `[result, error]` tuple-returning API. Statically typed against `import type { router as Router }` from the server module — never imports server code at runtime, only types.

### Booking flow (state machine)

State lives in `src/lib/states/*.svelte.ts` as Svelte 5 `$state` runes. Step transitions in `step.svelte.ts`:

```
SELECTION → CONTACT → BOOKING → (PAYMENT →) DONE
                                   ↓
                                ERROR (terminal until reset)
```

`book` returns one of `OK | REQUIRES_PAYMENT_INTENT | CUSTOMER_ALREADY_BOOKED_SERVICE | ERROR` (`ApiReturnStatus` in `src/lib/api-types.ts`). On `REQUIRES_PAYMENT_INTENT`, Stripe Elements (PUBLIC_STRIPE_KEY) confirms the intent, then `book` is called again with `paymentIntentId` only.

UI components live in `src/lib/Widget/` (`Selection.svelte`, `Contact.svelte`, `Booking.svelte`, `Payment.svelte`, `Done.svelte`, `Error.svelte`, `Header.svelte`, `Summary.svelte`).

### Routes

```
src/routes/
├── +layout.{server.ts,svelte}           # Currently no-op layout
└── [restaurantId]/
    ├── +layout.server.ts                # Loads aggregate (restaurant + widget + theme), 'no-store' cache
    ├── +page.svelte                     # Mounts <Widget>
    ├── script/+server.ts                # Returns the embeddable JS that injects the iframe + GTM detection
    ├── pay/[paymentIntentId]/           # Standalone payment route
    ├── reservation/[reservationId]/     # Edit-existing-booking entry
    ├── review/                          # Customer review submission
    └── leave-a-review/                  # Variant entry from email links
```

Note: the legacy `[widgetId]` URL segment is gone — widgets are 1:1 with restaurants in the new schema (PRD §5).

### Theme assembly (PRD §6.4)

`+layout.server.ts` builds the theme from the REST aggregate. Convention (corrected 2026-04-29):

- `backgroundColor` = `widget.color` (dark brand surface)
- `buttonTextColor` = `widget.color` (dark text on white button)
- `fontColor` / `buttonColor` / `borderColor` = hardcoded `#ffffff`

`widget.color` is the brand surface, not a font color. Inverting this is the most common mistake.

### Timezone handling

`src/lib/utils/zonedDateUtils.ts` is a widget-local copy of the legacy shared util (the `shared` workspace package was removed). Provided to components via context (`useZonedDateUtils()` in `src/lib/context.svelte.ts`).

**Critical:** slot timestamps from `/restaurants/{id}/availabilities` are **already timezone-aware** — combine `date: 'YYYY-MM-DD'` + `time: 'HH:MM'` into a JS `Date` directly (see `adapters/slot-state.ts` and `adapters/booking.ts:combineDateAndTime`). Running them through `ZonedDateUtils.inferDateToZone` adds a spurious offset and shifts displayed times by hours. Other date fields (e.g. user-selected calendar dates) still need ZonedDateUtils.

## Environment

Copy `.env.example` to `.env`. Server-only secrets (read via `$env/static/private`):

- `WIDGET_API_SECRET` — `X-API-Key` for the REST API. Generate with `openssl rand -hex 32`.
- `PRIVATE_STRIPE_KEY`, `PRIVATE_STRIPE_WEBHOOKS`, `PRIVATE_RESEND_KEY`, etc.
- `WIDGET_PAYMENT_MOCK_MODE` — empty / `off` / `stripe-test` / `full` (see mock module above).

Public (`$env/static/public`):

- `PUBLIC_API_URL` — REST API base (e.g. `https://jonathan-api-local.e-table.co`).
- `PUBLIC_STRIPE_KEY` — for Stripe Elements on the client.

## Conventions / gotchas

- **Server boundary:** anything under `src/lib/server/` and `*.server.ts` is server-only. Never import these from `.svelte` components or non-`.server.ts` files; the REST secret would leak.
- **Cloudflare adapter:** `vite.config.ts` externalizes `cloudflare:sockets`; the `.prisma/client/default → @prisma/client` alias is a leftover and currently unused (no Prisma client at runtime).
- **Build target:** `cargo`/Rust does not apply here despite the parent monorepo's `api/` workspace — this directory is a standalone SvelteKit project.
- **Adding a new RPC method:** add to `router` in `rpc-router.ts` (with a Valibot input schema), then call `api.<methodName>(input)` from any `.svelte` component. The `Proxy`-based client picks it up automatically; types flow from `typeof router`.
- **Adding a new REST endpoint:** add a method to `createWidgetApi` in `widget-api.ts`, declare the DTOs in `src/lib/api-types.ts`, then wire the RPC method through an adapter. Don't call `restCall` from anywhere except `widget-api.ts`.
