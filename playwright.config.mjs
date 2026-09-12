// Real-browser checks. The Node tests in tests/*.test.mjs assert the data and
// the generated HTML; these assert what a browser actually does with them.
//
//   npx playwright install chromium   (once)
//   npm run test:e2e
//
// PLAYWRIGHT_CHROMIUM_PATH points at an existing Chromium when the sandbox
// already carries one, so nothing has to be downloaded.
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.mjs",
  fullyParallel: true,
  reporter: process.env.CI ? "line" : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, launchOptions: executablePath ? { executablePath } : {} } },
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, launchOptions: executablePath ? { executablePath } : {} } },
  ],
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: true,
    stdout: "ignore",
  },
});
