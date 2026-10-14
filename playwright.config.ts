import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5191/',
    headless: true,
    // v0.2 meta layer: skip the first-launch how-to card and level-1 coach in legacy flows
    storageState: {
      cookies: [],
      origins: [{ origin: 'http://127.0.0.1:5191', localStorage: [
        { name: 'slidejam.meta.v1.howto', value: '1' },
        { name: 'slidejam.meta.v1.coach', value: '1' },
      ] }],
    },
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5191 --strictPort',
    url: 'http://127.0.0.1:5191/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
