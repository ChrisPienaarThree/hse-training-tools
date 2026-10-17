// End-to-end tests on the built offline file.
const { test, expect } = require('@playwright/test');
const path = require('path'), fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '../RCA Fault Tree.html');
async function fresh(page) { const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); await page.goto(FILE); await page.evaluate(() => localStorage.clear()); await page.reload(); return errs; }
const sel = (page, id) => page.evaluate(i => { TBRCA.S.sel = i; TBRCA.render(); }, id);

test('opens the worked example with no errors', async ({ page }) => {
  const errs = await fresh(page);
  await expect(page.locator('.ftn')).toHaveCount(18);
  await expect(page.locator('.topcard')).toContainText('1.5E-03 /yr');
  await page.click('[data-act=tab][data-t=results]');
  await expect(page.locator('text=97 %').first()).toBeVisible();
  expect(errs).toEqual([]);
});

test('build a tree by hand, use and edit a library value, rule out a branch', async ({ page }) => {
  const errs = await fresh(page);
  await page.click('[data-act=menu]'); await page.click('[data-act=new]');
  await page.fill('#m-title', 'Conveyor guard injury');
  await page.click('[data-act=tab][data-t=tree]');
  await page.fill('#f-label', 'Fitter caught in conveyor tail pulley');
  await page.selectOption('#f-gate', 'OR');
  await page.click('[data-act=add][data-k=basic]');
  await page.fill('#f-label', 'Guard interlock failed to stop the conveyor');
  await page.selectOption('#f-src', 'equip');
  await page.selectOption('#f-item', 'eq-guard-interlock');
  await expect(page.locator('#f-val')).toHaveValue('0.001');
  await page.fill('#f-val', '0.01'); await page.locator('#f-val').dispatchEvent('change');
  await expect(page.locator('.libnote.edited')).toContainText('Edited for this event');
  await page.fill('#f-pnote', 'Interlock switch found bridged-capable; screening raised x10');
  const top = await page.evaluate(() => TBRCA.S.c.root);
  await sel(page, top);
  await page.click('[data-act=add][data-k=basic]');
  await page.fill('#f-label', 'Conveyor restarted remotely during cleaning');
  await page.selectOption('#f-src', 'hep'); await page.selectOption('#f-item', 'hep-isolation');
  await page.click('[data-act=status][data-v=ruledout]');
  await page.fill('#f-evidence', 'Isolation log and padlock found in place');
  const r = await page.evaluate(() => { const c = TBRCA.S.c; return { post: TBRCA.post(), cs: TBRCA.E.rankCutSets(c), kids: c.nodes[c.root].children }; });
  expect(r.cs.eliminated).toBe(1); expect(r.cs.rows).toHaveLength(1);
  expect(r.post[r.kids[0]]).toBeCloseTo(1, 6);
  // case-level override: events that were edited individually keep their value
  await page.click('[data-act=tab][data-t=library]');
  await page.fill('#lib-eq-guard-interlock', '0.002'); await page.locator('#lib-eq-guard-interlock').dispatchEvent('change');
  expect(await page.evaluate(k => TBRCA.S.c.nodes[k].prob.value, r.kids[0])).toBe(0.01);
  // persistence
  await page.reload();
  await expect(page.locator('.case-name')).toContainText('Conveyor guard injury');
  await expect(page.locator('.ftn')).toHaveCount(3);
  expect(errs).toEqual([]);
});

test('contradiction is flagged and shown on the tree', async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { const c = TBRCA.S.c; c.nodes.e3.status = 'ruledout'; c.nodes.e3.evidence = 'test'; TBRCA.S.c = c; TBRCA.render(); });
  await page.evaluate(() => { TBRCA.S.c.updatedAt = 'x'; });
  const codes = await page.evaluate(() => { TBRCA.render(); return TBRCA.E.check(TBRCA.S.c).map(i => i.code); });
  expect(codes).toContain('C2');
});

test('exports and file round trip', async ({ page }, info) => {
  await fresh(page);
  const grab = async act => { await page.click('[data-act=menu]'); const [d] = await Promise.all([page.waitForEvent('download'), page.click(`.menu [data-act=${act}]`)]); const p = info.outputPath(d.suggestedFilename()); await d.saveAs(p); return { name: d.suggestedFilename(), buf: fs.readFileSync(p) }; };
  const dx = await grab('docx'); expect(dx.buf.slice(0, 2).toString()).toBe('PK'); expect(dx.buf.toString('latin1')).toContain('word/media/tree.png');
  const csv = await grab('csv'); expect(csv.buf.toString()).toContain('P(contributed|incident)');
  const png = await grab('png'); expect(png.buf.slice(1, 4).toString()).toBe('PNG');
  const html = await grab('html'); expect(html.buf.toString()).toContain('Credible causal combinations');
  const cb = await grab('casebook'); expect(JSON.parse(cb.buf.toString()).format).toBe('storyline-casebook-case');
  const bk = await grab('backup'); const o = JSON.parse(bk.buf.toString()); expect(o.format).toBe('rca-fault-tree'); expect(Object.keys(o.nodes)).toHaveLength(18);
  // registry entry for the dashboard
  const reg = await page.evaluate(() => JSON.parse(localStorage.getItem('iikit.registry')));
  expect(reg.find(r => r.tool === 'rcaft')).toMatchObject({ ref: 'RCA-EX-01', actions: { total: 6 } });
});

test("scroll wheel zooms around the pointer, Shift+scroll pans", async ({ page }) => {
  const errs = await fresh(page);
  await expect(page.locator('.ftn')).toHaveCount(18);
  const view = () => page.evaluate(() => { const m = document.querySelector("#vp").getAttribute("transform").match(/translate\(([-\d.e]+),([-\d.e]+)\) scale\(([-\d.e]+)\)/); return { x: +m[1], y: +m[2], k: +m[3] }; });
  const b = await page.locator("#cv").boundingBox(); const px = b.x + b.width * 0.6, py = b.y + b.height * 0.5;
  await page.mouse.move(px, py);
  const v0 = await view(); const w0 = { x: (px - b.x - v0.x) / v0.k, y: (py - b.y - v0.y) / v0.k };
  await page.mouse.wheel(0, -100); await page.waitForTimeout(50);
  const v1 = await view(); expect(v1.k).toBeGreaterThan(v0.k);
  expect(Math.abs((px - b.x - v1.x) / v1.k - w0.x)).toBeLessThan(0.5);   // point under the pointer stays put
  expect(Math.abs((py - b.y - v1.y) / v1.k - w0.y)).toBeLessThan(0.5);
  await page.mouse.wheel(0, 100); await page.mouse.wheel(0, 100); await page.waitForTimeout(50);
  const v2 = await view(); expect(v2.k).toBeLessThan(v1.k); expect(v2.k).toBeLessThan(v0.k);
  await page.keyboard.down("Shift"); await page.mouse.wheel(0, 80); await page.keyboard.up("Shift"); await page.waitForTimeout(50);
  const v3 = await view(); expect(v3.k).toBe(v2.k); expect(v3.x !== v2.x || v3.y !== v2.y).toBe(true);
  expect(errs).toEqual([]);
});
