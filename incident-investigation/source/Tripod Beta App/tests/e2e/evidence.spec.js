// Evidence plan and draft tree: offline starter plan + Excel, offline paste of Claude's answers,
// and the artifact path against a mocked `sample` capability (Claude) and shared database.
const { test, expect } = require('@playwright/test');
const path = require('path'), fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '../../Tripod Beta Investigator.html');

const NARRATIVE = 'At about 14:20 the LDV left the haul road on the bend near pit 3 and rolled over after the morning rain. ' +
  'I assume the driver was speeding because the tyre marks are long. The seat belt was probably not worn. ' +
  'It is unclear whether the pre-use inspection was done. Therefore the main cause was excessive speed for the wet conditions.';
const PLAN = { items: [{ cat: 'electronic', item: 'Vehicle tracking data for the LDV', source: 'Fleet office', purpose: 'Tests the speeding assumption', priority: 'Urgent', method: 'Download' },
  { cat: 'paper', item: 'Pre-use inspection checklist for the LDV', source: 'Fleet office', purpose: 'Was the inspection done?', priority: 'High', method: 'Request copy' }],
  photos: [{ subject: 'Final position of the LDV', position: 'From the road edge', view: 'Overview', purpose: 'Rest position' }],
  tests: [{ statement: 'The driver was speeding', kind: 'Assumption', evidence: 'Tracking data; tyre-mark length' }], notes: 'Secure the tracking data today.' };
const TREE = { trios: [
  { event: 'LDV leaves the haul road', agent: 'LDV travelling at speed on a wet bend', object: 'LDV and driver', barriers: [
    { side: 'agent', type: 'failed', label: 'Driver keeps to the 40 km/h haul-road limit', ic: { label: 'Driver drives at about 70 km/h', act: 'act', errorType: 'routine' },
      preconditions: [{ label: 'Speeding is common and not challenged', scope: 'org', ucs: [{ label: 'No speed monitoring on haul roads', brf: 'DF' }] }, { label: 'Road wet after rain', scope: 'external' }] },
    { side: 'object', type: 'missing', label: 'Berm on the outside of the bend', ucs: [{ label: 'Haul-road design standard not applied', brf: 'DE' }] }] },
  { event: 'LDV rolls over', agentFrom: 'previous', object: 'Driver', barriers: [
    { side: 'object', type: 'failed', label: 'Driver wears the seat belt', ic: { label: 'Seat belt not worn', act: 'act', errorType: 'routine' },
      preconditions: [{ label: 'Drivers see seat belts as unnecessary on site', scope: 'org', ucs: [{ label: 'Seat-belt use not enforced', brf: 'OR' }] }] }] },
  { event: 'Driver seriously injured', agentFrom: 'previous', object: 'Driver', barriers: [{ side: 'object', type: 'effective', label: 'Roll-over protection structure holds' }] }],
  notes: 'The speed estimate is the weakest part.' };

async function fresh(page) {
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(FILE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  return errs;
}
async function newCase(page, title) {
  await page.click('[data-act=newCase]');
  await page.fill('#f-newtitle', title);
  await page.click('#new-form button[type=submit]');
  await page.click('[data-act=tab][data-t=evidence]');
}
// the .xlsx is a stored (uncompressed) zip: part names and XML text can be searched directly
const zipHas = (buf, s) => buf.includes(Buffer.from(s));

test('offline: starter plan from the account, edits, Excel export', async ({ page }, info) => {
  const errs = await fresh(page);
  await newCase(page, 'LDV roll-over on haul road');
  await expect(page.locator('[data-act=evClaude]')).toHaveCount(0);          // no Claude offline
  await expect(page.locator('[data-act=exportEvidence]')).toBeDisabled();
  await page.fill('#ev-narrative', NARRATIVE);
  await page.click('[data-act=evStarter]');
  await expect(page.locator('#ev-status')).toContainText('Plan ready');
  const n = await page.evaluate(() => { const E = TBApp.S.c.evidence; return { i: E.items.length, p: E.photos.length, t: E.tests.map(x => x.kind) }; });
  expect(n.i).toBeGreaterThan(20); expect(n.p).toBeGreaterThan(12);
  expect(n.t).toEqual(['Assumption', 'Assumption', 'Open question', 'Conclusion']);
  expect(await page.evaluate(() => TBApp.S.c.evidence.items.some(x => /tracking|telemetry/i.test(x.item)))).toBe(true);  // vehicle pack
  // edit: mark the first item collected, tick a photo, filter to urgent
  await page.selectOption('#ev-items-status-0', 'Collected');
  await page.check('#ev-photos-taken-0');
  await expect(page.locator('#ev-stats')).toContainText('1/');
  await page.click('[data-act=evFilter][data-f=urgent]');
  const urgentRows = await page.locator('tr[data-evrow]').count();
  expect(urgentRows).toBeGreaterThan(3);
  // building again asks before replacing
  await page.click('[data-act=evStarter]');
  await expect(page.locator('[data-act=evGo][data-mode=replace]')).toBeVisible();
  await page.click('[data-act=evCancelAsk]');
  // persisted to the browser
  await page.reload();
  await page.click('[data-act=open]');
  await page.click('[data-act=tab][data-t=evidence]');
  expect(await page.evaluate(() => TBApp.S.c.evidence.items[0].status)).toBe('Collected');
  // Excel
  const [d] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=exportEvidence]')]);
  expect(d.suggestedFilename()).toMatch(/-evidence-plan\.xlsx$/);
  const p = info.outputPath(d.suggestedFilename()); await d.saveAs(p);
  const buf = fs.readFileSync(p);
  expect(buf.slice(0, 2).toString()).toBe('PK');
  for (const s of ['xl/workbook.xml', 'xl/worksheets/sheet4.xml', 'Evidence checklist', 'Photography schedule', 'Assumptions to test', 'dataValidation', 'I assume the driver was speeding']) expect(zipHas(buf, s)).toBe(true);
  expect(errs).toEqual([]);
});

test('offline: paste Claude\'s plan and Claude\'s tree', async ({ page }) => {
  const errs = await fresh(page);
  await newCase(page, 'LDV roll-over on haul road');
  await page.fill('#ev-narrative', NARRATIVE);
  // a reply with chatter around the JSON is accepted
  await page.click('[data-act=evPaste]');
  await page.fill('#ev-paste', 'Here is the plan:\n```json\n' + JSON.stringify(PLAN) + '\n```\nGood luck.');
  await page.click('[data-act=evPasteUse]');
  await expect(page.locator('#ev-status')).toContainText('2 evidence items, 1 photos, 1 statements');
  await expect(page.locator('.coach', { hasText: 'Preserving the scene' })).toContainText('Secure the tracking data today.');
  // a bad paste is refused and keeps the text
  await page.click('[data-act=evTreePaste]');
  await page.fill('#ev-tpaste', 'not json at all');
  await page.click('[data-act=evTreePasteUse]');
  await expect(page.locator('.modal')).toContainText('not a tree this app can read');
  await expect(page.locator('#ev-tpaste')).toHaveValue('not json at all');
  await page.fill('#ev-tpaste', JSON.stringify(TREE));
  await page.click('[data-act=evTreePasteUse]');
  // starter tree is replaced without asking; the tree tab opens with the draft, all assumed, rules met
  await expect(page.locator('.tab.on')).toContainText('Tripod tree');
  await expect(page.locator('.node')).toHaveCount(19);
  const st = await page.evaluate(() => ({ assumed: TBApp.S.c.nodes.every(n => n.verified === false), main: TBApp.S.c.nodes.filter(n => n.mainEvent).length, errs: TBApp.issues().filter(i => i.sev === 'error').map(i => i.code) }));
  expect(st).toEqual({ assumed: true, main: 1, errs: [] });
  // undo brings the starter tree back
  await page.keyboard.press('Control+z');
  await expect(page.locator('.node')).toHaveCount(3);
  await page.keyboard.press('Control+Shift+z');
  await expect(page.locator('.node')).toHaveCount(19);
  // a second draft asks, then sits beside the first
  await page.click('[data-act=tab][data-t=evidence]');
  await page.click('[data-act=evTreePaste]');
  await page.fill('#ev-tpaste', JSON.stringify(TREE));
  await page.check('input[name=ev-tmode][value=add]');
  await page.click('[data-act=evTreePasteUse]');
  await expect(page.locator('.node')).toHaveCount(38);
  expect(await page.evaluate(() => TBApp.S.c.nodes.filter(n => n.mainEvent).length)).toBe(1);
  expect(errs).toEqual([]);
});

const MOCK = mode => {
  const docs = {}, subs = [], calls = [];
  const fire = () => setTimeout(() => subs.forEach(f => f({ docs: Object.keys(docs).map(id => ({ id, exists: true, data: () => docs[id] })) })), 5);
  const db = {
    collection: () => ({ onSnapshot: next => { subs.push(next); fire(); return () => {}; } }),
    doc: p => { const id = p.split('/')[1]; return { set: async b => { docs[id] = JSON.parse(JSON.stringify(b)); fire(); }, delete: async () => { delete docs[id]; fire(); } }; }
  };
  const answer = async (input, opts) => {
    calls.push(input);
    if (mode === 'deny') throw { code: 'not_granted', message: 'no' };
    await new Promise(r => setTimeout(r, 50));
    const out = /TRIPOD BETA RULES/.test(input) ? window.__TREE : window.__PLAN;
    if (opts && opts.onText) opts.onText({ text: JSON.stringify(out), delta: JSON.stringify(out) });
    return out;
  };
  const sample = async (input, opts) => ({ text: JSON.stringify(await answer(input, opts)), truncated: false });
  sample.json = answer;
  const saved = [];
  window.__mock = { docs, calls, saved };
  window.claude = { use: async n => n === 'db' ? db : n === 'user' ? { id: async () => 'u-me', can: async () => true, profiles: async () => ({}) }
    : n === 'downloads' ? { save: async r => { saved.push(r.filename); return { status: 'saved' }; } } : n === 'sample' ? sample : null };
};

test('artifact: Claude writes the plan and drafts the tree; both save to the shared case', async ({ page }) => {
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(([p, t]) => { window.__PLAN = p; window.__TREE = t; }, [PLAN, TREE]);
  await page.addInitScript(MOCK, 'ok');
  await page.goto(FILE);
  await expect(page.locator('.top .pill.live')).toContainText('Shared team cases');
  await newCase(page, 'LDV roll-over on haul road');
  await expect(page.locator('[data-act=evClaude]')).toBeVisible();
  // too short an account is refused before anything is sent
  await page.fill('#ev-narrative', 'LDV rolled.');
  await page.click('[data-act=evClaude]');
  await expect(page.locator('#ev-status')).toContainText('Write a few sentences');
  expect(await page.evaluate(() => window.__mock.calls.length)).toBe(0);
  await page.fill('#ev-narrative', NARRATIVE);
  await page.click('[data-act=evClaude]');
  await expect(page.locator('#ev-status')).toContainText('Written by Claude');
  const prompt = await page.evaluate(() => window.__mock.calls[0]);
  expect(prompt).toContain('I assume the driver was speeding'); expect(prompt).toContain('Reply with only this JSON object');
  await page.click('[data-act=evTreeClaude]');
  await expect(page.locator('.node')).toHaveCount(19);
  const id = await page.evaluate(() => TBApp.S.c.id);
  await expect.poll(() => page.evaluate(i => { const d = window.__mock.docs[i]; return d && d.data.nodes.length === 19 && d.data.evidence.items.length; }, id)).toBe(2);
  // Excel goes out through the downloads capability
  await page.click('[data-act=tab][data-t=evidence]');
  await page.click('[data-act=exportEvidence]');
  await expect.poll(() => page.evaluate(() => window.__mock.saved.slice())).toEqual([expect.stringMatching(/-evidence-plan\.xlsx$/)]);
  expect(errs).toEqual([]);
});

test('artifact: when the viewer declines Claude, the page falls back to the starter plan', async ({ page }) => {
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(MOCK, 'deny');
  await page.goto(FILE);
  await expect(page.locator('.top .pill.live')).toContainText('Shared team cases');
  await newCase(page, 'LDV roll-over on haul road');
  await page.fill('#ev-narrative', NARRATIVE);
  await page.click('[data-act=evClaude]');
  await expect(page.locator('#ev-status')).toContainText('Claude is not available');
  await expect(page.locator('[data-act=evClaude]')).toHaveCount(0);
  await expect(page.locator('[data-act=evTreeClaude]')).toHaveCount(0);
  await page.click('[data-act=evStarter]');
  await expect(page.locator('#ev-status')).toContainText('Plan ready');
  expect(errs).toEqual([]);
});
