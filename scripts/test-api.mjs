import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const isWindows = process.platform === 'win32';
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required.');
const wranglerCli = path.resolve(
  'node_modules',
  'wrangler',
  'bin',
  'wrangler.js',
);
const logDirectory = path.resolve('.wrangler', 'logs');
mkdirSync(logDirectory, { recursive: true });

const environment = {
  ...process.env,
  WRANGLER_LOG_PATH: path.join(logDirectory, 'wrangler-api-test.log'),
};

function runNpm(args, extraEnvironment = {}) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    env: { ...environment, ...extraEnvironment },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Could not allocate an integration test port.'));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForHealth(baseUrl, processHandle) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`Pages dev exited with code ${processHandle.exitCode}.`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Pages dev is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Timed out waiting for Pages dev health.');
}

function stopProcess(processHandle) {
  if (processHandle.exitCode !== null) return;
  if (isWindows) {
    spawnSync('taskkill.exe', ['/pid', String(processHandle.pid), '/t', '/f'], {
      stdio: 'ignore',
    });
  } else {
    try {
      process.kill(-processHandle.pid, 'SIGTERM');
    } catch {
      processHandle.kill('SIGTERM');
    }
  }
}

runNpm(['run', 'build']);
runNpm(['run', 'db:reset:local']);

const port = await availablePort();
const baseUrl = `http://127.0.0.1:${port}`;
const pages = spawn(
  process.execPath,
  [wranglerCli, 'pages', 'dev', '--ip', '127.0.0.1', '--port', String(port)],
  {
    detached: !isWindows,
    env: environment,
    stdio: 'inherit',
  },
);

let exitCode;
try {
  await waitForHealth(baseUrl, pages);
  const result = spawnSync(
    process.execPath,
    [npmCli, 'exec', 'vitest', '--', 'run', '--config', 'vitest.api.config.ts'],
    {
      env: { ...environment, API_BASE_URL: baseUrl },
      stdio: 'inherit',
    },
  );
  exitCode = result.status ?? 1;
  if (exitCode === 0) {
    runNpm(['run', 'db:reset:local']);
    const baselineResponse = await fetch(
      `${baseUrl}/api/incidents/incident-notification-delay`,
    );
    if (!baselineResponse.ok) {
      throw new Error(
        `Seed reset verification failed: ${baselineResponse.status}`,
      );
    }
    const baseline = await baselineResponse.json();
    if (
      baseline.incident?.status !== 'investigating' ||
      baseline.incident?.owner !== null ||
      baseline.notes?.length !== 0
    ) {
      throw new Error('Seed reset did not restore the incident baseline.');
    }
    console.log('Deterministic seed reset verified against the running API.');
  }
} finally {
  stopProcess(pages);
}

process.exit(exitCode);
