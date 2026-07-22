import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

const host = '127.0.0.1';
const port = 4173;
const playwrightCli = fileURLToPath(
  new URL('../node_modules/@playwright/test/cli.js', import.meta.url),
);

process.env.VITE_ENABLE_MSW = 'true';

const server = await createServer({
  server: {
    host,
    port,
    strictPort: true,
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**'],
    },
  },
});

await server.listen();

const playwright = spawn(
  process.execPath,
  [playwrightCli, 'test', ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PLAYWRIGHT_EXTERNAL_SERVER: 'true',
    },
    stdio: 'inherit',
    windowsHide: true,
  },
);

const exitCode = await new Promise((resolve, reject) => {
  playwright.once('error', reject);
  playwright.once('exit', (code, signal) => {
    resolve(code ?? (signal ? 1 : 0));
  });
});

await server.close();
process.exitCode = exitCode;
