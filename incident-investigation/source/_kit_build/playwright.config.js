const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({ testDir: 'tests', outputDir: 'tests/results', timeout: 90000, reporter: [['list']],
  use: { channel: 'chrome', viewport: { width: 1400, height: 900 }, screenshot: 'only-on-failure', trace: 'off', acceptDownloads: true } });
