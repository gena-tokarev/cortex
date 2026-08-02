FROM oven/bun:1.2.19-alpine AS dependencies

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/auth-api/package.json apps/auth-api/package.json
COPY apps/auth-api-e2e/package.json apps/auth-api-e2e/package.json
COPY apps/web/package.json apps/web/package.json
COPY libs/auth-nest/package.json libs/auth-nest/package.json
COPY libs/encoding/package.json libs/encoding/package.json

RUN bun install --frozen-lockfile

FROM node:25-alpine AS builder

WORKDIR /app

COPY --from=dependencies /app /app
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN cd /app/apps/web && node ../../node_modules/next/dist/bin/next build

FROM node:25-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static

USER node

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
