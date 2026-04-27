# widget/CLAUDE.md

Embeddable SvelteKit booking widget for customer reservations.

## Package Overview

- **Purpose**: Customer-facing booking widget embedded on restaurant websites
- **Framework**: SvelteKit 2 + Svelte 5 runes
- **Deployment**: Cloudflare Pages
- **Database**: Neon PostgreSQL via Prisma
- **RPC**: svelte-rpc (widget API) + FlarePC (worker communication)
- **Embedding**: iframe with auto-height via postMessage

## Essential Commands

```bash
# Development
pnpm --filter widget dev          # Port 8987

# Build
pnpm --filter widget build

# Testing
pnpm --dir widget run test:unit
pnpm --dir widget run test:integration
```

## Embedding Pattern

### Restaurant adds to their website:
```html
<script
  id="cooking"
  data-element="main"
  src="https://widget.e-table.co/[restaurantId]/[widgetId]/script">
</script>
```

**Script behavior** (`script/+server.ts`):
1. Finds target element via `data-element` attribute
2. Creates iframe to `widget.e-table.co/[restaurantId]/[widgetId]?builder=true`
3. Listens for `postMessage` to adjust iframe height (auto-height)
4. Receives booking confirmation events

## Booking Flow (6-Step State Machine)

### State Management (Svelte 5 Runes)

```typescript
// States in src/lib/states/*.svelte.ts
let step = $state({ step: 'SELECTION' })  // Current step
let selection = $state({ service, pax, date, slot })  // Booking selections
let contact = $state({ firstName, lastName, email, phone, notes })  // Customer info
let paymentIntent = $state({ id, clientSecret, amount })  // Payment (if required)
let error = $state({ message, code })  // Error handling
```

### Flow:
1. **SELECTION**: Date → Service → Pax → Time Slot (color-coded availability)
2. **CONTACT**: Phone (intl-tel-input), email, name, notes (persisted to localStorage)
3. **BOOKING**: Auto-submits `api.book()` after 1s
4. **PAYMENT** (conditional): Stripe Elements if `REQUIRES_PAYMENT_INTENT` response
5. **DONE**: Confirmation + postMessage to parent window
6. **ERROR**: Fallback with retry

### Key Transitions:
- `OK` response → DONE
- `REQUIRES_PAYMENT_INTENT` → PAYMENT step
- `CUSTOMER_ALREADY_BOOKED_SERVICE` → ERROR
- Other errors → ERROR step

## API Integration

### Widget-Specific API (`src/api/api.ts`)

Uses **svelte-rpc** for type-safe server communication:

```typescript
import { api } from '$api/client'

// Get available services
const services = await api.getServices({ date: '2025-12-02' })

// Get time slots (color-coded: green/orange/red)
const slots = await api.getServiceSlots({ serviceId, pax, date })

// Create booking
const result = await api.book({
  serviceId, date, slot, pax,
  firstName, lastName, email, phone, notes,
  paymentIntentId  // Optional, if payment flow
})
```

**Integration**: API procedures call `event.locals.reservator` methods (from shared package).

### Worker Communication (FlarePC)

```typescript
import { worker } from '$api/client'

// For admin operations (rare)
const worker = createClient<Servers, 'admin'>({
  server: 'admin',
  endpoint: 'https://worker.e-table.co'
})
```

## Theme Customization

**Widget themes** stored in database (`widget.theme` JSON):

```typescript
{
  base_radius: '0.5rem',
  radius_sm: '0.375rem',
  // Background, foreground, button colors...
}
```

Injected as CSS variables in `Widget.svelte`.

**Builder mode**: `?builder=true` enables live theme editing via postMessage.

## Shared Package Integration

```typescript
// hooks.server.ts
const { locals } = await createLocals({
  dev, vars, platform, request, params,
  origin: 'WIDGET'
}, prisma)

// Provides:
locals.reservator  // Core booking engine
locals.tinybird    // Analytics
locals.logger      // Event logging
locals.prisma      // Database
```

**CRITICAL**: Widget uses Reservator for ALL booking logic (availability, slots, booking creation).

## Form Validation

- **Valibot**: Email schema validation
- **Phone**: `validatePhoneNumber()` from shared/utils (French + international)
- **Required**: lastName, email, phone
- **Real-time**: Error state arrays for immediate feedback

## Environment Variables

Create `.env` from `.env.example`:

```bash
# Database
DATABASE_URL                    # Neon PostgreSQL

# Stripe
PRIVATE_STRIPE_SECRET_KEY
PUBLIC_STRIPE_KEY               # For Stripe Elements

# Services
PRIVATE_TINYBIRD_TOKEN
PRIVATE_ADMIN_API_KEY           # Worker API access
PRIVATE_EMAILER_KEY
```

## Timezone Awareness

**CRITICAL**: Widget operates in restaurant timezone:

```typescript
const { zonedDateUtils } = useZonedDateUtils()

// Format dates in restaurant timezone
zonedDateUtils.format(date, 'PPP')

// Parse dates in restaurant timezone
zonedDateUtils.parse(dateString)
```

## Routes Structure

```
routes/
├── [restaurantId]/[widgetId]/
│   ├── +layout.server.ts            # Widget config loader
│   ├── +page.svelte                 # Main booking widget
│   ├── script/+server.ts            # Embeddable script
│   ├── payment/[paymentIntentId]/   # Standalone payment
│   └── reservation/[reservationId]/
│       ├── cancel/+page.server.ts   # Cancellation
│       └── review/+page.svelte      # Review submission
```

## Critical Patterns

### Loading Widget Configuration

```typescript
// +layout.server.ts
const widget = await event.locals.prisma.widget.findUnique({
  where: { id: params.widgetId, restaurantId: params.restaurantId },
  include: { restaurant: true }
})

if (!widget) error(404, 'Widget not found')
return { widget }
```

### Calling Reservator

```typescript
// api.ts procedure
export const book = procedure.input(schema).handler(async (input, event) => {
  return await event.locals.reservator.book({
    serviceId: input.serviceId,
    date: input.date,
    slot: input.slot,
    pax: input.pax,
    customer: { firstName, lastName, email, phone },
    notes: input.notes,
    paymentIntentId: input.paymentIntentId,
    origin: 'WIDGET'
  })
})
```

### Auto-Height iframe

```typescript
// autoHeight.svelte.ts
const observer = new MutationObserver(() => {
  const height = document.body.scrollHeight
  window.parent.postMessage({ type: 'resize', height }, '*')
})

observer.observe(document.body, { childList: true, subtree: true })
```

## Common Gotchas

### "Widget not loading"
Check `restaurantId` and `widgetId` are valid in database.

### "Payment not working"
- Verify `PUBLIC_STRIPE_KEY` is set
- Check Stripe Connect account connection
- Ensure payment intent creation succeeds

### "Timezone issues"
- All date operations MUST use `zonedDateUtils` from context
- Check `restaurant.timezone` is set (e.g., "Europe/Paris")

### "iframe height wrong"
- Ensure `autoHeight.svelte.ts` is imported
- Check postMessage listener in parent script

### "API errors"
- Verify `PRIVATE_ADMIN_API_KEY` matches worker
- Check `DATABASE_URL` connection
- Ensure Prisma client is regenerated: `pnpm generate:db`

## Integration with Other Packages

**shared**: All booking logic via Reservator, timezone via ZonedDateUtils
**worker**: Admin operations via FlarePC (rare)
**prisma-shared**: Widget, Restaurant, Reservation models
**emailer**: Email confirmations sent via Messenger in Reservator

## Summary

Widget is a **production-ready embeddable booking system** that:
- ✅ Provides complete customer reservation flow with payment
- ✅ Uses Svelte 5 runes for reactive state
- ✅ Integrates with shared Reservator for booking logic
- ✅ Supports theme customization per restaurant
- ✅ Handles timezone-aware operations
- ✅ Auto-resizes via postMessage for seamless iframe embedding
