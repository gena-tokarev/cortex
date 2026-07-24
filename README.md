# Focoris Workspace

This workspace is now Bun + Turborepo based.

Active projects:

- `apps/auth-api` - NestJS auth backend
- `apps/auth-api-e2e` - auth end-to-end tests
- `apps/web` - Next.js web app
- `libs/auth-nest` and `libs/encoding` - shared workspace packages

## Prerequisites

- Bun
- Node.js 20+
- Docker

## Install

```bash
bun install
```

## Common Commands

```bash
bun run dev:web
bun run dev:auth-api
bun run build:web
bun run build:auth-api
bun run test:auth-api
bun run e2e:auth-api
bun run db:generate
bun run db:migrate
bun run db:seed
```

## Local Services

Start infrastructure:

```bash
docker compose up -d postgres redis
```

Run the auth API:

```bash
bun run dev:auth-api
```

Run the web app:

```bash
bun run dev:web
```

The auth API listens on `http://localhost:3001/api` by default.
The web app listens on `http://localhost:3000`.

## Auth E2E

Auth e2e uses Testcontainers and starts isolated Postgres and Redis containers automatically.

Optional local env:

```bash
cp apps/auth-api-e2e/.env.example apps/auth-api-e2e/.env
```

Run:

```bash
bun run e2e:auth-api
```
