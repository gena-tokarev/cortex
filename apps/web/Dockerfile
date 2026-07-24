FROM oven/bun:1.2.19-alpine

WORKDIR /app

COPY . .

RUN bun install
RUN bun run build:web

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "cd /app/apps/web && node ../../node_modules/next/dist/bin/next start --port 3000"]
