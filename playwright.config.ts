import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config.
 * Boots the preview server on the runner-provided PORT (or 4173 by default).
 */
export default defineConfig({
  testDir: './src/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'line' : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://127.0.0.1:${process.env.PORT ?? 4173}`,
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI ? 'npm run preview' : 'npm run preview',
    url: `http://127.0.0.1:${process.env.PORT ?? 4173}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
