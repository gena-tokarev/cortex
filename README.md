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

## Local development

The web and auth API run on the host with Bun. The root `compose.yml` contains
only Postgres and Redis, exposed on loopback for the local applications.

```bash
cp .env.example .env.local  # first-time setup only
cp .env.local .env          # activate this profile
docker compose up -d postgres redis
bun run dev
```

The auth API listens on `http://localhost:3001/api` by default.
The web app listens on `http://localhost:3000`. Application Dockerfiles are
built by CI; local full-stack Compose is intentionally not maintained.

### Public VPS development environment

The VPS deployment is image-based and is described under
[Development CI/CD](#development-cicd). It uses
`deploy/compose.development.yml`, not the local `compose.yml`.

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

## Development CI/CD

Pull requests and pushes to `main` run the Bun/Turborepo validation pipeline in
GitHub Actions. A passing `main` commit publishes immutable `linux/amd64`
images to GHCR and deploys their exact digests. The VPS performs no Git
operations or application image builds.

The deployment manifest and script are copied to
`/home/deploy/apps/focoris`. The workflow never uploads, replaces, downloads,
or prints the VPS-only `.env`. The generated `.release.env` stores only the
currently deployed image digests.

### One-time GitHub setup

Create a GitHub environment named `development`.

Add one environment secret:

```text
DEPLOY_SSH_PRIVATE_KEY
```

Add these environment variables:

```text
DEPLOY_HOST=167.233.59.107
DEPLOY_PORT=22
DEPLOY_USER=deploy
DEPLOY_PATH=/home/deploy/apps/focoris
DEPLOY_SSH_KNOWN_HOSTS=<complete raw ssh-keyscan line>
```

```bash
ssh-keyscan -p 22 -t ed25519 167.233.59.107 2>/dev/null
```

The known-host value begins as follows and is not the SHA256 fingerprint:

```text
167.233.59.107 ssh-ed25519 AAAAC3...
```

The Actions key's public half belongs in
`/home/deploy/.ssh/authorized_keys`. No repository secret, GHCR PAT, or
additional key pair is needed.

### VPS setup

```bash
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/apps/focoris/.env
sudo chmod 600 /home/deploy/apps/focoris/.env
sudo -u deploy docker ps
docker compose version
docker network inspect shared_proxy
docker volume inspect focoris_postgres_data
```

Keep all application configuration in
`/home/deploy/apps/focoris/.env`. Start from `deploy/.env.example`, retain the
existing database credentials, and remove `COMPOSE_FILE`. Important remote
values are:

```dotenv
DATABASE_URL=postgresql://focoris:URL_ENCODED_PASSWORD@postgres:5432/focoris_auth?schema=public
REDIS_URL=redis://redis:6379
AUTH_API_URL=http://auth-api:3001
WEB_APP_ORIGIN=https://focoris-dev.podolog-warsaw.pl
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
GOOGLE_CALLBACK_URL=https://focoris-dev.podolog-warsaw.pl/api/external-auth/google/callback
GOOGLE_ALLOWED_WEB_REDIRECT_URIS=https://focoris-dev.podolog-warsaw.pl
PASSKEY_RP_ID=focoris-dev.podolog-warsaw.pl
PASSKEY_ALLOWED_ORIGINS=https://focoris-dev.podolog-warsaw.pl
```

If the existing Postgres container uses a volume other than
`focoris_postgres_data`, update the explicit external volume name in the
deployment manifest before deploying. This guard prevents an accidental empty
database.

The sibling `infra` repository already routes `/api/*` to
`focoris-auth-api:3001` and all other paths to `focoris-web:3000`. Verify:

```bash
dig +short focoris-dev.podolog-warsaw.pl A
docker network inspect shared_proxy
```

The DNS result must be `167.233.59.107`. The infra `.env` must contain:

```dotenv
FOCORIS_DOMAIN=focoris-dev.podolog-warsaw.pl
```

Postgres and Redis remain private, while web and API join `shared_proxy` under
the aliases expected by Nginx.

### First publication

New GHCR packages initially require a one-time visibility change. After the
first image jobs publish successfully, make both `focoris-auth-api` and
`focoris-web` packages public in their GitHub package settings, then rerun the
deployment job. The job verifies anonymous access before touching the VPS.

### Deployment and rollback

The deployment pulls both exact digests, verifies Postgres and Redis, applies
Prisma migrations from the new API image, and then replaces the application
containers. Pull or migration failures leave the running application
unchanged. Failed application health checks restore the previous images.

The readiness endpoint is:

```text
GET /api/health
```

It returns `200` only when both Postgres and Redis are reachable. For a manual
rollback, run the **Deploy development** workflow and enter the full
40-character commit SHA. Application rollback does not reverse database
migrations, so migrations must remain backward-compatible.
