import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Desktop WebKit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Viewport (375x667)',
      use: {
        viewport: { width: 375, height: 667 },
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        isMobile: true,
      },
    },
  ],
  webServer: [
    {
      command: 'npm run start --workspace=@esushrut/api',
      url: 'http://localhost:4000/api/hospitals',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'npm run dev --workspace=@esushrut/web',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
