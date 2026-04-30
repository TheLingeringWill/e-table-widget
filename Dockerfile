# syntax=docker/dockerfile:1

# ── Stage 1: builder ─────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

# All app config (API_URL, WIDGET_API_SECRET, PUBLIC_STRIPE_KEY) is read at
# runtime via $env/dynamic/{private,public} from process.env. The image is
# env-agnostic and reusable across staging/prod — values come from the ECS
# task definition (environment[] + secrets[]).

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
  PORT=3000 \
  NODE_ENV=production

EXPOSE 3000

CMD ["node", "build"]
