// End-to-end tests on the built offline file: build a tree by hand, rules checker, persistence, exports, import.
const { test, expect } = require('@playwright/test');
const path = require('path'), fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '../../Tripod Beta Investigator.html');

async function fresh(page) {
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(FILE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  return errs;
}
const issues = page => page.evaluate(() => TBApp.issues().map(i => i.sev + ':' + i.code));
const sel = async (page, id) => { await page.locator(`.node[data-id="${id}"]`).dispatchEvent('pointerdown', { button: 0, pointerId: 1, bubbles: true }); await page.locator('#cv').dispatchEvent('pointerup', { button: 0, pointerId: 1, bubbles: true }); };

test('worked example opens read only with every rule met', async ({ page }) => {
  const errs = await fresh(page);
  await page.click('[data-act=open][data-id=example-annex8]');
  await expect(page.locator('.node')).toHaveCount(45);
  await expect(page.locator('#issue-chip')).toContainText('Tree rules met');
  expect((await issues(page)).filter(s => !s.startsWith('tip'))).toEqual([]);
  await expect(page.locator('.banner.info')).toContainText('Worked example');
  await expect(page.locator('.pal-item').first()).toBeDisabled();
  expect(errs).toEqual([]);
});

test('build a trio and a full causation path by hand', async ({ page }) => {
  const errs = await fresh(page);
  await page.click('[data-act=newCase]');
  await page.fill('#f-newtitle', 'Hand caught in conveyor tail pulley');
  await page.click('#new-form button[type=submit]');
  await expect(page.locator('.node')).toHaveCount(3);
  const ids = await page.evaluate(() => { const n = TBApp.S.c.nodes; return { ev: n.find(x => x.type === 'event').id, ag: n.find(x => x.type === 'agent').id, ob: n.find(x => x.type === 'object').id }; });
  expect(await issues(page)).toContain('warning:Q2');   // trio with no barrier
  // event: barrier on the object side via the inspector
  await sel(page, ids.ev);
  await page.click('[data-act=quick][data-k=barrierObject]');
  await page.fill('#f-label', 'Tail pulley guard fitted and in place');
  expect(await issues(page)).toContain('error:B2');     // failed barrier without immediate cause
  await page.click('[data-act=quick][data-k=ic]');
  await page.fill('#f-label', 'Fitter removes guard to clean pulley while belt runs');
  await page.selectOption('#f-err', 'situational');
  await page.click('[data-act=quick][data-k=pc]');
  await page.fill('#f-label', 'Belief that the belt cannot be stopped during the shift');
  expect(await issues(page)).toContain('error:P2');     // organisational precondition without UC
  await page.click('[data-act=quick][data-k=uc]');
  await page.fill('#f-label', 'Production targets leave no planned cleaning stops');
  expect(await issues(page)).toContain('warning:U2');
  await page.selectOption('#f-brf', 'IG');
  const now = await issues(page);
  expect(now.filter(s => s.startsWith('error'))).toEqual([]);
  expect(now.filter(s => s === 'warning:R1')).toHaveLength(2);   // barrier + UC still need actions
  // actions from the inspector
  await page.click('[data-act=addActionFor]');
  await expect(page.locator('#a-text-0')).toBeFocused();
  await page.fill('#a-text-0', 'Plan weekly cleaning stops into the production schedule');
  await page.fill('#a-owner-0', 'Plant manager');
  await page.click('[data-act=tab][data-t=tree]');
  const bid = await page.evaluate(() => TBApp.S.c.nodes.find(n => n.type === 'failed').id);
  await sel(page, bid);
  await page.click('[data-act=addActionFor]');
  await page.fill('#a-text-1', 'Interlock the tail pulley guard with the conveyor drive');
  expect((await issues(page)).filter(s => !s.startsWith('tip'))).toEqual([]);
  await page.click('[data-act=tab][data-t=checks]');
  await expect(page.locator('.allclear')).toBeVisible();
  expect(errs).toEqual([]);
});

test('invalid links are refused with the reason, and drag-linking works', async ({ page }) => {
  await fresh(page);
  await page.click('[data-act=newCase]'); await page.fill('#f-newtitle', 'Link test'); await page.click('#new-form button[type=submit]');
  // add an underlying cause and try to link it straight to the event
  await page.click('.pal-item[data-pal=uc]');
  const r = await page.evaluate(() => { const c = TBApp.S.c, uc = c.nodes.find(n => n.type === 'uc'), ev = c.nodes.find(n => n.type === 'event'); return TBApp.link(uc.id, ev.id); });
  expect(r).toBe(false);
  await expect(page.locator('.toast')).toContainText('Underlying Cause links to');
  // drag the port of a new agent onto the event: refused, event already has an agent
  await page.click('.pal-item[data-pal=failed]');
  const ids = await page.evaluate(() => { const c = TBApp.S.c; return { b: c.nodes.find(n => n.type === 'failed').id, ag: c.nodes.find(n => n.type === 'agent').id }; });
  await page.evaluate(() => { const v = TBApp.S.view; v.k = 1; v.x = 20; v.y = 60; TBApp.render(); });
  await page.evaluate(i => { const c = TBApp.S.c, a = c.nodes.find(n => n.id === i.ag), b = c.nodes.find(n => n.id === i.b); a.x = 100; a.y = 400; b.x = 400; b.y = 420; TBApp.render(); }, ids);
  const port = await page.locator(`.node[data-id="${ids.ag}"] .port`).boundingBox();
  const tgt = await page.locator(`.node[data-id="${ids.b}"]`).boundingBox();
  await page.mouse.move(port.x + port.width / 2, port.y + port.height / 2);
  await page.mouse.down();
  await page.mouse.move(tgt.x + 40, tgt.y + 30, { steps: 8 });
  await page.mouse.up();
  const linked = await page.evaluate(i => TBApp.S.c.edges.some(e => e.from === i.ag && e.to === i.b), ids);
  expect(linked).toBe(true);
});

test('moving, undo, delete and persistence across reload', async ({ page }) => {
  await fresh(page);
  await page.click('[data-act=copyExample]');
  await expect(page.locator('.node')).toHaveCount(45);
  await page.evaluate(() => { TBApp.S.view.k = 1; TBApp.render(); TBApp.centreOn(['b5']); });
  const before = await page.evaluate(() => TBApp.S.c.nodes.find(n => n.id === 'b5').x);
  const box = await page.locator('.node[data-id=b5]').boundingBox();
  await page.mouse.move(box.x + 60, box.y + 40); await page.mouse.down(); await page.mouse.move(box.x + 160, box.y + 40, { steps: 6 }); await page.mouse.up();
  const after = await page.evaluate(() => TBApp.S.c.nodes.find(n => n.id === 'b5').x);
  expect(after - before).toBeGreaterThanOrEqual(90);
  await page.click('[data-act=undo]');
  expect(await page.evaluate(() => TBApp.S.c.nodes.find(n => n.id === 'b5').x)).toBe(before);
  // delete a barrier: the trajectory is rejoined and its IC is left dangling (error)
  await sel(page, 'b5');
  await page.keyboard.press('Delete');
  const st = await page.evaluate(() => ({ joined: TBApp.S.c.edges.some(e => e.from === 'o4' && e.to === 'eo4'), n: TBApp.S.c.nodes.length }));
  expect(st).toEqual({ joined: true, n: 44 });
  expect(await issues(page)).toContain('error:I1');
  await page.evaluate(() => TBApp.flushSave());
  await page.reload();
  await expect(page.locator('.case-card h3').first()).toContainText('practice copy');
  await page.locator('[data-act=open]').first().click();
  await expect(page.locator('.node')).toHaveCount(44);
});

test('exports: case file round trip, docx, draw.io, svg, report, casebook', async ({ page }, info) => {
  await fresh(page);
  await page.click('[data-act=copyExample]');
  await page.click('[data-act=tab][data-t=report]');
  await expect(page.locator('#rpt h1')).toContainText('Driver injured');
  const grab = async act => { const [d] = await Promise.all([page.waitForEvent('download'), page.click(`[data-act=${act}]`)]); const p = info.outputPath(d.suggestedFilename()); await d.saveAs(p); return { name: d.suggestedFilename(), buf: fs.readFileSync(p), p }; };
  const docx = await grab('exportDocx');
  expect(docx.name).toMatch(/\.docx$/); expect(docx.buf.slice(0, 2).toString()).toBe('PK');
  expect(docx.buf.toString('latin1')).toContain('word/media/tree.png');
  const dio = await grab('exportDrawio');
  expect(dio.name).toMatch(/\.drawio$/); expect(dio.buf.toString()).toContain('<mxfile');
  expect((dio.buf.toString().match(/tb_type=/g) || []).length).toBe(45);
  const svg = await grab('exportSVG'); expect(svg.buf.toString()).toMatch(/^<svg /);
  const png = await grab('exportPNG'); expect(png.buf.slice(1, 4).toString()).toBe('PNG');
  const rep = await grab('exportReport'); expect(rep.buf.toString()).toContain('Tripod causation paths');
  const cb = await grab('exportCasebook'); expect(JSON.parse(cb.buf.toString()).format).toBe('storyline-casebook-case');
  const cf = await grab('exportCase');
  // open the case file again (offline build: the file replaces the browser copy and is linked)
  await page.click('[data-act=closeCase]');
  await page.evaluate(t => TBApp.openLinkedFile(null, 'copy.tripod.json', t), cf.buf.toString());
  await expect(page.locator('.node')).toHaveCount(45);
  await page.click('[data-act=closeCase]');
  await expect(page.locator('.case-card:not(.example)')).toHaveCount(1);
  // registry entry for the dashboard, and the #case- deep link it uses
  const reg = await page.evaluate(() => JSON.parse(localStorage.getItem('iikit.registry')));
  const e = reg.find(r => r.tool === 'tripod');
  expect(e).toMatchObject({ toolFile: 'Tripod Beta Investigator.html', actions: { total: 17 } });
  await page.goto(FILE + '#case-' + e.id); await page.reload();
  await expect(page.locator('.node')).toHaveCount(45);
  await expect(page.locator('[data-act=linkFile]')).toBeVisible();
});

test("scroll wheel zooms around the pointer, Shift+scroll pans", async ({ page }) => {
  const errs = await fresh(page);
  await page.click('[data-act=open][data-id=example-annex8]'); await expect(page.locator('.node')).toHaveCount(45);
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
