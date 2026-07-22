import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required.');
const logDirectory = path.resolve('.wrangler', 'logs');
mkdirSync(logDirectory, { recursive: true });

const environment = {
  ...process.env,
  WRANGLER_LOG_PATH: path.join(logDirectory, 'wrangler-reset.log'),
};

for (const script of ['db:migrate:local', 'db:seed:local']) {
  const result = spawnSync(process.execPath, [npmCli, 'run', script], {
    env: environment,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
