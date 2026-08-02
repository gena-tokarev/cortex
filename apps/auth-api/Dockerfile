FROM oven/bun:1.2.19-alpine AS manifests

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/auth-api/package.json apps/auth-api/package.json
COPY apps/auth-api-e2e/package.json apps/auth-api-e2e/package.json
COPY apps/web/package.json apps/web/package.json
COPY libs/auth-nest/package.json libs/auth-nest/package.json
COPY libs/encoding/package.json libs/encoding/package.json

FROM manifests AS dependencies

RUN bun install --frozen-lockfile

FROM dependencies AS builder

COPY . .

RUN bun run db:generate
RUN bun run build:auth-api

FROM manifests AS production-dependencies

RUN bun install --frozen-lockfile --production --filter @cortex/auth-api
COPY apps/auth-api/prisma/schema.prisma apps/auth-api/prisma/schema.prisma
RUN bunx --bun prisma generate --schema apps/auth-api/prisma/schema.prisma

FROM node:25-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/auth-api/dist ./apps/auth-api/dist
COPY --from=builder --chown=node:node /app/apps/auth-api/package.json ./apps/auth-api/package.json
COPY --from=builder --chown=node:node /app/apps/auth-api/prisma ./apps/auth-api/prisma
COPY --from=builder --chown=node:node /app/libs/auth-nest/dist ./libs/auth-nest/dist
COPY --from=builder --chown=node:node /app/libs/auth-nest/package.json ./libs/auth-nest/package.json
COPY --from=builder --chown=node:node /app/libs/encoding/dist ./libs/encoding/dist
COPY --from=builder --chown=node:node /app/libs/encoding/package.json ./libs/encoding/package.json

USER node

EXPOSE 3001

CMD ["node", "apps/auth-api/dist/main.js"]
