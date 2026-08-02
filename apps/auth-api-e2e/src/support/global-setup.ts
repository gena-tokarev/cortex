import { spawn } from 'child_process';
import { config as loadEnv } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Socket } from 'net';
import { GenericContainer } from 'testcontainers';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

loadEnv({ path: 'apps/auth-api-e2e/.env' });

const E2E_RUNTIME_PATH = join('apps', 'auth-api-e2e', '.tmp', 'runtime.json');
const WORKSPACE_ROOT = join(__dirname, '..', '..', '..', '..');
const BUN_BINARY = process.env.BUN_BINARY ?? 'bun';

function runCommand(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  cwd = WORKSPACE_ROOT,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      cwd,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(`${command} ${args.join(' ')} exited with code ${code}`),
      );
    });
  });
}

async function waitForPortOpen(port: number, host: string): Promise<void> {
  const startedAt = Date.now();
  const timeoutMs = 30_000;

  while (Date.now() - startedAt < timeoutMs) {
    const socket = new Socket();

    try {
      await new Promise<void>((resolve, reject) => {
        socket.once('connect', () => {
          socket.destroy();
          resolve();
        });
        socket.once('error', reject);
        socket.connect(port, host);
      });
      return;
    } catch {
      socket.destroy();
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error(`Timed out waiting for ${host}:${port} to accept connections`);
}

module.exports = async function () {
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  const authApiPort = process.env.AUTH_API_PORT
    ? Number(process.env.AUTH_API_PORT)
    : 3001;
  const pgUser = process.env.TEST_DB_USER ?? 'cortex';
  const pgPassword = process.env.TEST_DB_PASSWORD ?? 'cortex';
  const pgDb = process.env.TEST_DB_NAME ?? 'cortex_auth_test';
  const pgImage = process.env.TEST_DB_IMAGE ?? 'postgres:16-alpine';
  const redisImage = process.env.TEST_REDIS_IMAGE ?? 'redis:7-alpine';

  const postgres = await new PostgreSqlContainer(pgImage)
    .withUsername(pgUser)
    .withPassword(pgPassword)
    .withDatabase(pgDb)
    .start();
  const redis = await new GenericContainer(redisImage)
    .withExposedPorts(6379)
    .start();

  const dbUrl = `${postgres.getConnectionUri()}?schema=public`;
  const redisUrl = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;
  const baseEnv = { ...process.env };
  delete baseEnv.NODE_OPTIONS;
  delete baseEnv.VSCODE_INSPECTOR_OPTIONS;
  const commandEnv = {
    ...baseEnv,
    AUTH_ACCESS_TOKEN_SECRET:
      process.env.AUTH_ACCESS_TOKEN_SECRET ?? 'e2e-access-token-secret',
    AUTH_ACCESS_TOKEN_TTL_SECONDS:
      process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS ?? '900',
    AUTH_COOKIE_SAME_SITE: process.env.AUTH_COOKIE_SAME_SITE ?? 'lax',
    AUTH_COOKIE_SECURE: process.env.AUTH_COOKIE_SECURE ?? 'false',
    AUTH_REFRESH_TOKEN_SECRET:
      process.env.AUTH_REFRESH_TOKEN_SECRET ?? 'e2e-refresh-token-secret',
    AUTH_REFRESH_TOKEN_TTL_SECONDS:
      process.env.AUTH_REFRESH_TOKEN_TTL_SECONDS ?? '604800',
    DATABASE_URL: dbUrl,
    GOOGLE_ALLOWED_NATIVE_REDIRECT_URIS:
      process.env.GOOGLE_ALLOWED_NATIVE_REDIRECT_URIS ??
      'cortex://auth/callback',
    GOOGLE_ALLOWED_WEB_REDIRECT_URIS:
      process.env.GOOGLE_ALLOWED_WEB_REDIRECT_URIS ??
      `http://${host}:${authApiPort}`,
    GOOGLE_CALLBACK_URL:
      process.env.GOOGLE_CALLBACK_URL ??
      `http://${host}:${authApiPort}/api/external-auth/google/callback`,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? 'e2e-google-client-id',
    GOOGLE_CLIENT_SECRET:
      process.env.GOOGLE_CLIENT_SECRET ?? 'e2e-google-client-secret',
    PASSKEY_ALLOWED_ORIGINS:
      process.env.PASSKEY_ALLOWED_ORIGINS ??
      `http://${host}:${authApiPort}`,
    PASSKEY_RP_ID: process.env.PASSKEY_RP_ID ?? host,
    PASSKEY_RP_NAME: process.env.PASSKEY_RP_NAME ?? 'Cortex E2E',
    PORT: String(authApiPort),
    REDIS_URL: redisUrl,
  };

  await runCommand(
    BUN_BINARY,
    [
      'x',
      'prisma',
      'migrate',
      'deploy',
      '--schema',
      'prisma/schema.prisma',
    ],
    {
      ...commandEnv,
      INIT_CWD: WORKSPACE_ROOT,
    },
    join(WORKSPACE_ROOT, 'apps', 'auth-api'),
  );

  const authApiProcess = spawn(
    process.execPath,
    [join(WORKSPACE_ROOT, 'apps', 'auth-api', 'dist', 'main.js')],
    {
      env: commandEnv,
      cwd: WORKSPACE_ROOT,
      stdio: 'inherit',
      detached: true,
    },
  );
  authApiProcess.unref();

  await waitForPortOpen(authApiPort, host);

  mkdirSync(join('apps', 'auth-api-e2e', '.tmp'), { recursive: true });
  writeFileSync(
    E2E_RUNTIME_PATH,
    JSON.stringify(
      {
        databaseUrl: dbUrl,
        authApiPid: authApiProcess.pid,
        postgresContainerId: postgres.getId(),
        redisContainerId: redis.getId(),
        redisUrl,
      },
      null,
      2,
    ),
  );

  process.env.DATABASE_URL = dbUrl;
  process.env.REDIS_URL = redisUrl;

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
