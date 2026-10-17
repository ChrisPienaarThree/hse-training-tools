// Offline Storyline Casebook: local db shim, IndexedDB persistence, import, backup, registry, sample case.
const { test, expect } = require('@playwright/test');
const path = require('path'), fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '../Storyline Casebook.html');
const PKG = path.resolve(__dirname, '../examples/Example - Vehicle roll-over (Tripod Annex 8).casebook-case.json');
const WSF = path.resolve(__dirname, '../examples/Example - Vehicle roll-over (Tripod Annex 8).casebook-ws.json');

async function fresh(page) {
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(FILE);
  await page.evaluate(async () => { localStorage.clear(); await KIT.KitStore.del('casebook:workspace'); await KIT.KitStore.del('handle:casebook:workspace'); });
  await page.reload();
  await page.waitForFunction(() => document.getElementById('cbo-bar'));
  return errs;
}
const settle = page => page.evaluate(() => window.CBO_FILEBAR.flush());

test('loads offline with no errors and no claude.ai / no-connection wording', async ({ page }) => {
  const errs = await fresh(page);
  await page.click('[data-nav-home=caselist]');
  const txt = await page.locator('#app').innerText();
  expect(txt).not.toMatch(/claude\.ai|No data connection|shared case store|Connection lost/i);
  await expect(page.locator('.conn-pill')).toContainText('Offline workspace');
  await expect(page.locator('#cbo-status')).toHaveText('Not saved to a file');
  expect(await page.evaluate(() => typeof pako)).toBe('object');
  expect(errs).toEqual([]);
});

test('create a case, add evidence and an event, data survives a reload', async ({ page }) => {
  const errs = await fresh(page);
  await page.click('[data-nav-home=caselist]');
  await page.click('#new-case');
  await page.fill('#f-caseTitle', 'Offline test case');
  await page.locator('#f-caseTitle').blur();
  await page.click('.stepper button[data-stage=evidence]');
  await page.fill('#ev-desc', 'Photo of the guard lying on the floor');
  await page.click('#add-evidence');
  await expect(page.locator('#stage-panel')).toContainText('Photo of the guard');
  await page.click('.stepper button[data-stage=chart]');
  await page.fill('#new-ev-text', 'fitter removes the guard');
  await page.click('#add-event');
  await expect(page.locator('#stage-panel')).toContainText('fitter removes the guard');
  await page.waitForTimeout(400); await settle(page);
  await page.reload();
  await page.waitForFunction(() => window.CBO_WORKSPACE && window.CBO_WORKSPACE.cases().length === 1);
  const st = await page.evaluate(() => { const W = window.CBO_WORKSPACE, c = W.cases()[0]; return { title: c.caseTitle, ev: W.sub(c.id, 'evidence').length, events: W.sub(c.id, 'events').map(e => e.text) }; });
  expect(st).toEqual({ title: 'Offline test case', ev: 1, events: ['fitter removes the guard'] });
  await page.click('[data-nav-home=caselist]');
  await expect(page.locator('#app')).toContainText('Offline test case');
  expect(errs).toEqual([]);
});

test('import the example case package, registry entry has the right action counts', async ({ page }) => {
  await fresh(page);
  await page.click('[data-nav-home=caselist]');
  await page.setInputFiles('#import-case-input', PKG);
  await page.waitForFunction(() => window.CBO_WORKSPACE.cases().length === 1 && window.CBO_WORKSPACE.sub(window.CBO_WORKSPACE.cases()[0].id, 'correctiveActions').length === 17, null, { timeout: 20000 });
  await page.waitForTimeout(300); await settle(page);
  const pkg = JSON.parse(fs.readFileSync(PKG, 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  const overdue = pkg.correctiveActions.filter(a => a.targetDate && a.targetDate < today).length;
  const reg = await page.evaluate(() => KIT.KitRegistry.list().filter(x => x.tool === 'casebook'));
  expect(reg).toHaveLength(1);
  expect(reg[0]).toMatchObject({ tool: 'casebook', title: pkg.case.caseTitle, status: pkg.case.status, date: pkg.case.dateOccurred, file: '', toolFile: 'Storyline Casebook.html', actions: { total: 17, open: 17, overdue } });
});

test('Download backup gives a valid workspace file, and opening it restores the cases', async ({ page }, info) => {
  await fresh(page);
  await page.click('[data-nav-home=caselist]');
  await page.setInputFiles('#import-case-input', PKG);
  await page.waitForFunction(() => window.CBO_WORKSPACE.cases().length === 1, null, { timeout: 20000 });
  await page.waitForTimeout(800);
  const [d] = await Promise.all([page.waitForEvent('download'), page.click('#cbo-backup')]);
  expect(d.suggestedFilename()).toMatch(/\.casebook-ws\.json$/);
  const p = info.outputPath(d.suggestedFilename()); await d.saveAs(p);
  const ws = JSON.parse(fs.readFileSync(p, 'utf8'));
  expect(ws.format).toBe('storyline-casebook-workspace'); expect(ws.version).toBe(1);
  const caseKeys = Object.keys(ws.docs).filter(k => k.split('/').length === 2);
  expect(caseKeys).toHaveLength(1);
  expect(Object.keys(ws.docs).filter(k => k.includes('/correctiveActions/'))).toHaveLength(17);
  // wipe, then drop the backup back in through the file bar route
  await page.evaluate(async () => { await KIT.KitStore.del('casebook:workspace'); });
  await page.reload(); await page.waitForFunction(() => document.getElementById('cbo-bar'));
  expect(await page.evaluate(() => window.CBO_WORKSPACE.cases().length)).toBe(0);
  const raw = fs.readFileSync(WSF, 'utf8');
  await page.evaluate(r => { window.CBO_FILEBAR.routeFile('example.casebook-ws.json', r, null); }, raw);
  // the browser workspace is empty, so it opens without the 'replace' confirmation
  await page.waitForFunction(() => window.CBO_WORKSPACE && window.CBO_WORKSPACE.cases().length === 1, null, { timeout: 15000 });
  await page.click('[data-nav-home=caselist]');
  await expect(page.locator('#app')).toContainText('Driver injured');
});

test('the built-in sample case still opens', async ({ page }) => {
  const errs = await fresh(page);
  await page.click('[data-nav-home=caselist]');
  await page.click('#open-sample');
  await expect(page.locator('#app')).toContainText('Pump Maintenance');
  await page.click('.stepper button[data-stage=chart]');
  await expect(page.locator('#stage-panel')).toBeVisible();
  expect(errs).toEqual([]);
});
