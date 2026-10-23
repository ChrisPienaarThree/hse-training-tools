// Inspector linking: separate preceding / following pickers, and links that the rules route through the
// correct Tripod path (Precondition -> Failed Barrier via its Immediate Cause, Underlying Cause -> Immediate Cause via a Precondition).
const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../../Tripod Beta Investigator.html');

async function setup(page) {
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(FILE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('[data-act=newCase]'); await page.fill('#f-newtitle', 'Link test'); await page.click('#new-form button[type=submit]');
  return errs;
}
const sel = async (page, id) => { await page.locator(`.node[data-id="${id}"]`).dispatchEvent('pointerdown', { button: 0, pointerId: 1, bubbles: true }); await page.locator('#cv').dispatchEvent('pointerup', { button: 0, pointerId: 1, bubbles: true }); };
const edges = page => page.evaluate(() => TBApp.S.c.edges.map(e => { const t = id => TBApp.S.c.nodes.find(n => n.id === id).type; return t(e.from) + '>' + t(e.to); }).sort());

test('preceding and following pickers, and Precondition to Failed Barrier routed through an Immediate Cause', async ({ page }) => {
  const errs = await setup(page);
  const ids = await page.evaluate(() => {
    const ev = TBApp.S.c.nodes.find(n => n.type === 'event'), ag = TBApp.S.c.nodes.find(n => n.type === 'agent');
    const e = TBApp.S.c.edges.find(x => x.from === ag.id && x.to === ev.id);
    TBApp.insertBarrier(e.id, 'failed');
    const fb = TBApp.S.c.nodes.find(n => n.type === 'failed');
    const pc = TBApp.addNode('pc', 100, 500, 'Operator believes the guard is not needed');
    return { fb: fb.id, pc: pc.id, ev: ev.id };
  });
  // the Precondition can only follow into an Immediate Cause; the barrier is offered with the route it takes
  await sel(page, ids.pc);
  await expect(page.locator('#f-linkto option', { hasText: 'via a new Immediate Cause' })).toHaveCount(1);
  await expect(page.locator('#f-linkfrom option', { hasText: 'Underlying Cause' })).toHaveCount(0);   // no UC yet
  await page.selectOption('#f-linkto', ids.fb);
  await expect(page.locator('.toast')).toContainText('Added an Immediate Cause between them');
  expect(await edges(page)).toEqual(['agent>failed', 'failed>event', 'ic>failed', 'object>event', 'pc>ic']);
  expect(await page.evaluate(() => TBApp.S.c.nodes.find(n => n.id === [...TBApp.S.sel][0]).type)).toBe('ic');   // new IC selected to describe it
  // a second Precondition dragged onto the barrier goes to the existing Immediate Cause, no new element
  const pc2 = await page.evaluate(() => TBApp.addNode('pc', 400, 600, 'Production pressure on the shift').id);
  const n0 = await page.evaluate(() => TBApp.S.c.nodes.length);
  expect(await page.evaluate(i => TBApp.link(i.pc2, i.fb), { pc2, fb: ids.fb })).toBe(true);
  await expect(page.locator('.toast')).toContainText('Linked to the Immediate Cause of that barrier');
  expect(await page.evaluate(() => TBApp.S.c.nodes.length)).toBe(n0);
  // preceding picker: select the Immediate Cause and link an Underlying Cause in front of it, routed through a new Precondition
  const uc = await page.evaluate(() => TBApp.addNode('uc', 700, 700, 'No guarding standard for tail pulleys').id);
  const ic = await page.evaluate(() => TBApp.S.c.nodes.find(n => n.type === 'ic').id);
  await sel(page, ic);
  await expect(page.locator('#f-linkfrom option', { hasText: 'via a new Precondition' })).toHaveCount(1);
  await page.selectOption('#f-linkfrom', uc);
  await expect(page.locator('.toast')).toContainText('Added a Precondition between them');
  expect((await edges(page)).filter(e => e === 'uc>pc' || e === 'pc>ic')).toEqual(['pc>ic', 'pc>ic', 'pc>ic', 'uc>pc']);
  // a plain direct link in the following picker: the barrier's following element is the event (already linked, so not offered)
  await sel(page, ids.fb);
  await expect(page.locator(`#f-linkto option[value="${ids.ev}"]`)).toHaveCount(0);
  // undo removes a routed link and the element it added in one step
  await page.click('[data-act=undo]');
  expect((await edges(page)).includes('uc>pc')).toBe(false);
  // links that have no correct path are still refused with the reason
  expect(await page.evaluate(i => TBApp.linkDir(i.uc, i.ev), { uc, ev: ids.ev })).toBe(false);
  await expect(page.locator('.toast')).toContainText('Underlying Cause links to');
  expect(errs).toEqual([]);
});
