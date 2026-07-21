import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // This repo's pinned @playwright/test version doesn't match the browser build
        // pre-installed in this environment — point at it explicitly instead of
        // downloading a second copy (see environment notes: PLAYWRIGHT_BROWSERS_PATH).
        launchOptions: { executablePath: "/opt/pw-browsers/chromium" },
      },
    },
  ],
  webServer: {
    command: "pnpm build:astro-only && pnpm preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
