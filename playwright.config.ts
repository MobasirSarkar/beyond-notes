import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env["E2E_PORT"] ?? 3000);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  timeout: 45_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: process.env["PW_CHROMIUM_PATH"]
      ? { executablePath: process.env["PW_CHROMIUM_PATH"] }
      : {},
  },
  ...(process.env["E2E_NO_SERVER"]
    ? {}
    : {
        webServer: {
          command: `pnpm start --port ${PORT}`,
          url: `http://localhost:${PORT}`,
          reuseExistingServer: !process.env["CI"],
          timeout: 60_000,
        },
      }),
});
