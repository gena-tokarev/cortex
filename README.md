# Cortex Workspace

Cortex is a Bun workspace managed with Turborepo.

Active projects:

- `apps/auth-api` — NestJS authentication backend
- `apps/auth-api-e2e` — authentication end-to-end tests
- `apps/web` — Next.js web application
- `libs/auth-nest` and `libs/encoding` — shared workspace packages

## Local development

Install Bun and Docker, then:

```bash
bun install
cp .env.example .env.local  # first-time setup
cp .env.local .env          # activate the local profile
docker compose up -d postgres redis
bun run dev
```

The web application runs at `http://localhost:3000`; the auth API runs at
`http://localhost:3001/api`. The local Compose file provides only PostgreSQL
and Redis. Application containers are built by CI and are not maintained in
the local Compose stack.

Common commands:

```bash
bun run lint
bun run test
bun run build
bun run e2e
bun run db:generate
bun run db:migrate
bun run db:seed
```

Auth E2E tests use Testcontainers and start isolated PostgreSQL and Redis
containers. Optional local configuration can be copied from
`apps/auth-api-e2e/.env.example`.

## CI/CD

Pull requests run validation and build both Docker images without publishing.
A passing push to `main` publishes immutable `linux/amd64` images:

- `ghcr.io/gena-tokarev/cortex-auth-api`
- `ghcr.io/gena-tokarev/cortex-web`

The workflow then commits both image digests atomically to
`gena-tokarev/infra` at `environments/development/cortex/release.yaml`. Argo CD
detects that Git commit and reconciles k3s. GitHub Actions has no VPS, SSH,
Kubernetes, or Argo CD credentials.

The GitHub `development` environment requires:

```text
Variable: INFRA_APP_ID
Secret:   INFRA_APP_PRIVATE_KEY
```

These belong to a narrowly scoped GitHub App installed only on the private
`infra` repository with repository contents read/write permission.

The development site is `https://cortex-dev.podolog-warsaw.pl`. Runtime
secrets are SOPS-encrypted in the private infra repository; they are not built
into either image.

Health endpoints:

- `GET /api/health/live` checks only that the API process is alive.
- `GET /api/health` checks PostgreSQL and Redis readiness.

Rollback is performed by reverting the corresponding release commit in the
infra repository. Database migrations are not reversed and must remain
backward-compatible with the preceding application version.
