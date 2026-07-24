FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY . .

RUN bun install
RUN bun run db:generate
RUN bun run build:auth-api

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "cd /app/apps/auth-api && bunx prisma migrate deploy --schema prisma/schema.prisma && node dist/main.js"]
