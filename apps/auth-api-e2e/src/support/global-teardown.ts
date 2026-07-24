import { spawn } from 'child_process';
import { config as loadEnv } from 'dotenv';
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

loadEnv({ path: 'apps/auth-api-e2e/.env' });

const E2E_RUNTIME_PATH = join('apps', 'auth-api-e2e', '.tmp', 'runtime.json');

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

module.exports = async function () {
  const port = process.env.AUTH_API_PORT
    ? Number(process.env.AUTH_API_PORT)
    : 3001;
  let authApiPid: number | undefined;
  let postgresContainerId: string | undefined;
  let redisContainerId: string | undefined;

  if (existsSync(E2E_RUNTIME_PATH)) {
    const runtime = JSON.parse(readFileSync(E2E_RUNTIME_PATH, 'utf8')) as {
      authApiPid?: number;
      postgresContainerId?: string;
      redisContainerId?: string;
    };
    authApiPid = runtime.authApiPid;
    postgresContainerId = runtime.postgresContainerId;
    redisContainerId = runtime.redisContainerId;
  }

  if (authApiPid) {
    try {
      process.kill(authApiPid, 'SIGTERM');
    } catch {
      console.warn(`Auth API process ${authApiPid} was already stopped`);
    }
  } else {
    console.warn(`No Auth API PID recorded for port ${port}`);
  }

  if (postgresContainerId) {
    await runCommand('docker', ['rm', '-f', postgresContainerId]);
  }

  if (redisContainerId) {
    await runCommand('docker', ['rm', '-f', redisContainerId]);
  }

  rmSync(E2E_RUNTIME_PATH, { force: true });
  console.log(globalThis.__TEARDOWN_MESSAGE__);
};
