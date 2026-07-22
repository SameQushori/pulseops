import { defineConfig } from '@playwright/test';

const port = 4173;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER
    ? undefined
    : {
        command: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port}`,
        url: `http://127.0.0.1:${port}`,
        reuseExistingServer: false,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'desktop-chromium',
      testIgnore: /responsive\.spec\.ts/,
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-360',
      testMatch: /responsive\.spec\.ts/,
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 800 },
      },
    },
    {
      name: 'tablet-768',
      testMatch: /responsive\.spec\.ts/,
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 900 },
      },
    },
  ],
});
