import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "on",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "Desktop Chrome",
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
    {
      name: "Mobile Safari",
      testMatch: /.*mobile.*\.spec\.ts/,
      use: {
        ...devices["iPhone 14"],
        defaultBrowserType: "chromium",
        channel: "chrome",
      },
    },
    {
      name: "Mobile Chrome",
      testMatch: /.*mobile.*\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        channel: "chrome",
      },
    },
  ],
});
