# Auth API

NestJS auth service for the Cortex workspace.

## Runtime

- Port: `3001`
- Global prefix: `/api`

## Database

Prisma schema:

```bash
apps/auth-api/prisma/schema.prisma
```

Commands:

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
```

## Development

From the workspace root:

```bash
bun run dev:auth-api
```

Build:

```bash
bun run build:auth-api
```

Unit tests:

```bash
bun run test:auth-api
```

E2E:

```bash
bun run e2e:auth-api
```
