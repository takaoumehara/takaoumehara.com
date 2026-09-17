// Real-browser checks. The Node tests in tests/*.test.mjs assert the data and
// the built HTML; these assert what a browser actually does with them.
//
//   npm run test:e2e
//
// The web server is the Astro dev server: it serves every static page at its
// real URL (/about.html, /lens/creative/) and also runs the on-demand routes
// the Studio needs (/lens/preview, /api/*).
//
// PLAYWRIGHT_CHROMIUM_PATH points at an existing Chromium when the sandbox
// already carries one, so nothing has to be downloaded.
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
const launchOptions = executablePath ? { executablePath } : {};

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.mjs",
  fullyParallel: true,
  reporter: process.env.CI ? "line" : [["list"]],
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    launchOptions,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, launchOptions } },
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, launchOptions } },
  ],
  // --ignore-lock: Astro 7 backgrounds `astro dev` when it detects an AI agent
  // (AI_AGENT / CLAUDECODE in the environment) and the launcher exits at once,
  // which Playwright reads as the server dying. The flag keeps it in the
  // foreground; it is harmless for a person or CI.
  webServer: {
    command: `npx astro dev --port ${PORT} --host 127.0.0.1 --ignore-lock`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "ignore",
  },
});
