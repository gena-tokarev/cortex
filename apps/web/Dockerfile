FROM oven/bun:1.2.19-alpine AS deps

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN cd /app/apps/web && node ../../node_modules/next/dist/bin/next build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["sh", "-c", "cd /app/apps/web && node ../../node_modules/next/dist/bin/next start --port 3000"]
