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

## VPS deployment

The production containers join the external `shared_proxy` Docker network using
the aliases `focoris-web` and `focoris-auth-api`. Public HTTPS and `/api/`
routing are owned by the sibling `infra` repository.

```bash
cp .env.docker.example .env.docker
# Replace every placeholder in .env.docker.
docker network inspect shared_proxy >/dev/null 2>&1 || docker network create shared_proxy
docker compose --env-file .env.docker up --build -d
```

The web and API ports are bound to loopback for VPS diagnostics; public traffic
reaches the containers over `shared_proxy`. `AUTH_API_URL` is intentionally the
internal Docker URL used by server-side web routes.

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
