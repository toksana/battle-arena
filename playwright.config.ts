import { defineConfig, devices } from '@playwright/test';

const PORT = 3200;
const BASE_URL = `http://localhost:${PORT}`;

/** Live tests call the real model and spend tokens: only `pnpm test:e2e:live` runs them. */
const RUN_LIVE = process.env.E2E_LIVE === '1';

/** Placeholder credential the AI Gateway rejects before any model runs. */
const DISABLED = 'e2e-disabled';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  grepInvert: RUN_LIVE ? undefined : /@live/,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  // The production build, as users get it. Without Redis env vars the rate limit is off,
  // so replay tests stub the 429 themselves and never depend on Upstash.
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: BASE_URL,
    // Always a fresh server: reusing one started elsewhere could carry model credentials.
    reuseExistingServer: false,
    timeout: 180_000,
    // Token guard: outside live runs the server gets invalid AI Gateway credentials, so even an
    // accidental live request fails authentication instead of spending tokens. Values must be
    // non-empty: Next.js treats an empty variable as unset and falls back to .env.local.
    env: RUN_LIVE ? {} : { AI_GATEWAY_API_KEY: DISABLED, VERCEL_OIDC_TOKEN: DISABLED },
  },
});
