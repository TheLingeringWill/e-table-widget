# syntax=docker/dockerfile:1

# ── Stage 1: builder ─────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

# Build-time public env (baked into the bundle by $env/static/public)
ARG PUBLIC_API_URL
ARG PUBLIC_STRIPE_KEY
ENV PUBLIC_API_URL=${PUBLIC_API_URL} \
  PUBLIC_STRIPE_KEY=${PUBLIC_STRIPE_KEY}

# $env/static/private is read at build time too. The values baked here are
# placeholders so the build doesn't fail on missing-env validation; the real
# values come from Secrets Manager at runtime via process.env.
ENV WIDGET_API_SECRET=build-time-placeholder \
  PRIVATE_STRIPE_KEY=build-time-placeholder \
  PRIVATE_STRIPE_WEBHOOKS=build-time-placeholder \
  PRIVATE_RESEND_KEY=build-time-placeholder

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile

COPY . .
RUN pnpm build \
  && pnpm prune --prod

# ── Stage 2: runtime ─────────────────────────────────────────────────
FROM node:22-alpine AS runtime

RUN apk add --no-cache curl \
  && addgroup -S -g 1001 appgroup \
  && adduser -S -u 1001 -G appgroup appuser

WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/build ./build
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json

USER appuser

ENV HOST=0.0.0.0 \
  PORT=3002 \
  NODE_ENV=production

EXPOSE 3002

CMD ["node", "build"]
