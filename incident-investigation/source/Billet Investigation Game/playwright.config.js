// Playwright config for The Falling Billet.
// Run:  npx playwright test      (uses the installed Google Chrome; run build.py first)
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'tests/e2e/results',
  timeout: 120000,
  reporter: [['list']],
  use: {
    channel: 'chrome',
    viewport: { width: 1280, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'off'
  }
});
