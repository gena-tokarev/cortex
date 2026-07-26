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

## Environment profiles

### Local development without Dockerized apps

The applications run on the host. Postgres and Redis are reached through
`localhost` (they may still be started as supporting containers).

```bash
cp .env.example .env.local  # first-time setup only
cp .env.local .env          # activate this profile
docker compose up -d postgres redis
bun run dev
```

The auth API listens on `http://localhost:3001/api` by default.
The web app listens on `http://localhost:3000`.

### Local development with Docker

All four services run in Docker. Container-to-container URLs use the Compose
service names `postgres`, `redis`, and `auth-api`, while ports 3000/3001 remain
available on localhost.

```bash
cp .env.example .env.local-docker  # first-time setup only
# Change DATABASE_URL, REDIS_URL, and AUTH_API_URL to Docker service names.
cp .env.local-docker .env           # activate this profile
docker compose up --build -d
```

This mode does not require `shared_proxy`.

### VPS with Docker

The production containers join the external `shared_proxy` Docker network using
the aliases `focoris-web` and `focoris-auth-api`. Public HTTPS and `/api/`
routing are owned by the sibling `infra` repository.

```bash
cp .env.example .env.dev  # first-time setup only
# Set Docker service URLs, HTTPS origins, secure cookies, and real secrets.
# Then copy .env.dev to the VPS.
cp .env.dev .env
docker network inspect shared_proxy >/dev/null 2>&1 || docker network create shared_proxy
docker compose up --build -d
```

The web and API ports are bound to loopback for VPS diagnostics; public traffic
reaches the containers over `shared_proxy`. `AUTH_API_URL` is intentionally the
internal Docker URL used by server-side web routes. `COMPOSE_FILE` in each
profile selects either the base Compose file or the base plus dev override.

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
