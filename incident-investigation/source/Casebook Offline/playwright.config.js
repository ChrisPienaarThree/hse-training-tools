// Playwright config for the offline Storyline Casebook.
// Run:  python3 build.py && npx playwright test      (uses the installed Google Chrome)
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: 'tests', testMatch: /.*\.spec\.js/, outputDir: 'tests/results', timeout: 60000, reporter: [['list']],
  use: { channel: 'chrome', viewport: { width: 1400, height: 900 }, screenshot: 'only-on-failure', trace: 'off', acceptDownloads: true }
});
