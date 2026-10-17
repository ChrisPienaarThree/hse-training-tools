// Whole-kit tests: dashboard, registry, folder scan (directory input fallback) and dashboard -> tool hand-off with real file handles (OPFS).
const { test, expect } = require('@playwright/test');
const path = require('path'), fs = require('fs');
const KIT = path.resolve(__dirname, '../../../Incident Investigation Toolkit');
const url = p => 'file://' + path.join(KIT, p);
const ex = n => fs.readFileSync(path.join(KIT, 'Examples', n), 'utf8');

test('kit layout is complete', () => {
  ['START HERE.html', 'READ ME FIRST.txt', 'Start Toolkit - Mac.command', 'Start Toolkit - Windows.cmd', 'Tools/Storyline Casebook.html', 'Tools/Tripod Beta Investigator.html', 'Tools/RCA Fault Tree.html',
    'Guides/Incident Investigation Toolkit - Quick guide.pdf', 'Guides/RCA Fault Tree - User guide.pdf', 'My cases/README.txt'].forEach(f => expect(fs.existsSync(path.join(KIT, f)), f).toBe(true));
  expect(fs.readdirSync(path.join(KIT, 'Examples')).length).toBe(3);
  // no external resources: everything must run offline
  ['START HERE.html', 'Tools/Storyline Casebook.html', 'Tools/Tripod Beta Investigator.html', 'Tools/RCA Fault Tree.html'].forEach(f => expect(fs.readFileSync(path.join(KIT, f), 'utf8')).not.toMatch(/<script[^>]+src=["']https?:/));
});

test('dashboard: links work, registry shows browser-only cases, tools open from it', async ({ page }) => {
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url('START HERE.html')); await page.evaluate(() => localStorage.clear());
  for (const f of ['Tools/Storyline Casebook.html', 'Tools/Tripod Beta Investigator.html', 'Tools/RCA Fault Tree.html', 'Guides/RCA Fault Tree - User guide.pdf']) expect(await page.locator(`a[href="${f}"]`).count()).toBeGreaterThan(0);
  // make a case in each of Tripod and the RCA tool (same file:// storage as the dashboard)
  await page.goto(url('Tools/Tripod Beta Investigator.html')); await page.click('[data-act=copyExample]'); await expect(page.locator('.node')).toHaveCount(45); await page.evaluate(() => TBApp.flushSave());
  await page.goto(url('Tools/RCA Fault Tree.html')); await page.click('[data-act=menu]'); await page.click('[data-act=new]'); await page.fill('#m-title', 'Pump P-12 seal fire'); await page.waitForTimeout(500);
  await page.goto(url('START HERE.html'));
  await expect(page.locator('#reg tbody tr')).toHaveCount(2);
  await expect(page.locator('#reg')).toContainText('Pump P-12 seal fire');
  await expect(page.locator('#reg')).toContainText('This computer only');
  await expect(page.locator('#stats')).toContainText('on this computer only');
  // open the browser-only Tripod case from the register (#case- deep link)
  await page.locator('#reg tr', { hasText: 'practice copy' }).locator('[data-open]').click();
  await expect(page).toHaveURL(/Tripod%20Beta%20Investigator\.html#case-/);
  await expect(page.locator('.node')).toHaveCount(45);
  expect(errs).toEqual([]);
});

test('dashboard: folder scan lists the case files (directory input fallback)', async ({ page }) => {
  await page.addInitScript(() => { delete window.showDirectoryPicker; window.showDirectoryPicker = undefined; });
  await page.goto(url('START HERE.html')); await page.evaluate(() => localStorage.clear()); await page.reload();
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#pick')]);
  await fc.setFiles(path.join(KIT, 'Examples'));
  await page.check('#fx');
  await expect(page.locator('#reg tbody tr')).toHaveCount(3);
  await expect(page.locator('#reg')).toContainText('Diesel overfill of tank T-101');
  await expect(page.locator('#reg')).toContainText('Storyline Casebook');
  await page.uncheck('#fx');
  await expect(page.locator('#reg tbody tr')).toHaveCount(1); // only the Casebook workspace case is not flagged as an example
});

// Hand-off tests need real FileSystemFileHandles. Chrome only offers OPFS handles on http(s) origins, so these run
// against a local static server; the code path (handle in IndexedDB -> tool #handoff -> permission -> read + link) is the same.
const { spawn } = require('child_process');
let srv; const PORT = 8737; const http = p => `http://127.0.0.1:${PORT}/` + p.split('/').map(encodeURIComponent).join('/');
test.beforeAll(async () => { srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: KIT, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 900)); });
test.afterAll(() => { if (srv) srv.kill(); });
for (const [tool, file, exName, check] of [
  ['rcaft', 'Tools/RCA Fault Tree.html', 'Example - Tank T-101 overfill.rcaft.json', async p => { await expect(p.locator('.ftn')).toHaveCount(18); await expect(p.locator('#top .pill.ok')).toContainText('Saved to t101.rcaft.json'); }],
  ['tripod', 'Tools/Tripod Beta Investigator.html', 'Example - Vehicle roll-over (Tripod Annex 8).tripod.json', async p => { await expect(p.locator('.node')).toHaveCount(45); await expect(p.locator('#top')).toContainText('Saved to t101.rcaft.json'.replace('t101.rcaft', 'case.tripod')); }],
  ['casebook', 'Tools/Storyline Casebook.html', 'Example - Vehicle roll-over (Tripod Annex 8).casebook-ws.json', async p => { await expect(p.locator('body')).toContainText('Driver injured in vehicle roll-over'); }]
]) {
  test('hand-off from the dashboard opens and links a real file: ' + tool, async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    const fname = tool === 'rcaft' ? 't101.rcaft.json' : tool === 'tripod' ? 'case.tripod.json' : 'ws.casebook-ws.json';
    await page.goto(http('START HERE.html')); await page.evaluate(() => localStorage.clear());
    await page.evaluate(async ([tool, name, text]) => {
      const root = await navigator.storage.getDirectory(); const h = await root.getFileHandle(name, { create: true });
      const w = await h.createWritable(); await w.write(text); await w.close(); await KIT.KitHandoff.put(tool, h, name);
    }, [tool, fname, ex(exName)]);
    await page.goto(http(file) + '#handoff');
    if (tool === 'casebook') {
      await expect(page.getByRole('dialog')).toContainText('Open ' + fname);
      await page.getByRole('dialog').getByRole('button', { name: 'Open', exact: true }).click();
      // the browser workspace is empty, so there is no second 'replace' step
      await page.waitForTimeout(1500); await page.waitForLoadState('load');
    } else {
      const btn = page.locator('button', { hasText: 'Open ' + fname }).first();
      await expect(btn).toBeVisible(); await btn.click();
    }
    await check(page);
    if (tool !== 'casebook') {
      // a change is written back to the linked file
      await page.evaluate(t => t === 'rcaft' ? (TBRCA.S.c.meta.title = 'Edited title', TBRCA.render()) : null, tool);
      if (tool === 'rcaft') { await page.click('[data-act=tab][data-t=incident]'); await page.fill('#m-title', 'Edited through the hand-off'); }
      else { await page.click('[data-act=tab][data-t=incident]'); await page.fill('#m-title', 'Edited through the hand-off'); }
      await page.waitForTimeout(2500);
      const txt = await page.evaluate(async n => { const root = await navigator.storage.getDirectory(); return await (await (await root.getFileHandle(n)).getFile()).text(); }, fname);
      expect(txt).toContain('Edited through the hand-off');
    }
    expect(errs).toEqual([]);
  });
}
