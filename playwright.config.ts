import { defineConfig, devices } from "playwright/test";

/**
 * Playwright E2E Configuration
 *
 * Tests are split into two suites:
 *   - "mocked network" suite: no real backend required, network is intercepted
 *   - "real API" suite: requires a running backend + E2E_TEST_EMAIL / E2E_TEST_PASSWORD
 *
 * Load test credentials from .env.e2e using Node's --env-file-if-exists flag
 * (see npm scripts in package.json). Never commit .env.e2e — see .env.e2e.example.
 */

const isCI = !!process.env.CI;
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3002";

export default defineConfig({
  testDir: "./e2e",

  // Only pick up E2E specs — avoids colliding with vitest .spec.tsx unit tests
  testMatch: "**/*.spec.ts",

  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,

  timeout: 30_000,
  expect: { timeout: 8_000 },

  reporter: isCI
    ? [
        ["github"],
        ["junit", { outputFile: "test-results/junit.xml" }],
        ["html", { open: "never" }],
      ]
    : [["list"], ["html", { open: "on-failure" }]],

  use: {
    baseURL: BASE_URL,
    locale: "es",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
