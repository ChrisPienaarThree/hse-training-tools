// ICAM PEEPO evidence plan (Stage 2) and the CB-EX-02 dam drowning training case, in the offline Casebook.
const { test, expect } = require('@playwright/test');
const path = require('path'), fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '../Storyline Casebook.html');
const FAC = path.resolve(__dirname, '../../Storyline Casebook/facilitator/CB-EX-02 Dam drowning - facilitator answer.casebook-case.json');

async function fresh(page) {
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(FILE);
  await page.evaluate(async () => { localStorage.clear(); await KIT.KitStore.del('casebook:workspace'); await KIT.KitStore.del('handle:casebook:workspace'); });
  await page.reload();
  await page.waitForFunction(() => document.getElementById('cbo-bar'));
  await page.click('[data-nav-home=caselist]');
  return errs;
}
const plan = page => page.evaluate(() => { const W = window.CBO_WORKSPACE, c = W.cases()[0]; const d = W.sub(c.id, 'evidencePlan')[0]; return { c, d, ev: W.sub(c.id, 'evidence') }; });
async function newCaseOnPlan(page, title, account) {
  await page.click('#new-case');
  await page.fill('#f-caseTitle', title);
  await page.fill('#f-initialDescription', account.slice(0, 120));
  await page.locator('#f-initialDescription').blur();
  await page.waitForTimeout(700);   // Stage 1 saves after a 500 ms pause
  await page.click('.stepper button[data-stage=evidence]');
  await page.click('[data-evview=plan]');
  await page.fill('#pl-narrative', account);
}
const ACCOUNT = 'At about 10:20 the fitter was cleaning spillage at the tail pulley of conveyor CV-12 while it was running. I think he reached past the guard because the guard had been removed for maintenance last week. He probably assumed the belt was isolated. The supervisor says a toolbox talk was given, but I am not sure whether isolation was covered.';

test('training case CB-EX-02 opens read only on the evidence plan, with PEEPO groups, photos and tests', async ({ page }) => {
  const errs = await fresh(page);
  await expect(page.locator('#app')).toContainText('Training case CB-EX-02');
  await page.click('#open-sample-dam');
  await expect(page.locator('.case-header-bar')).toContainText('drowned at an overflowing return-water dam');
  await expect(page.locator('#app')).toContainText('Training case CB-EX-02');
  await page.click('#training-plan');
  await expect(page.locator('.seg button.on')).toContainText('Evidence plan (PEEPO)');
  await expect(page.locator('.readonly-block')).toContainText('I assume there was no warning from upstream');
  await expect(page.locator('#pl-narrative')).toHaveCount(0);
  await expect(page.locator('#pl-stats')).toContainText('0/29');
  await expect(page.locator('.pl-cat')).toHaveCount(5);
  await expect(page.locator('.pl-cat-head h4')).toHaveText([/^People/, /^Environment/, /^Equipment/, /^Procedures/, /^Organisation/]);
  await expect(page.locator('.pl-cat').first()).toContainText('Interview Worker B, the survivor');
  const rows = await page.locator('.pl-table').evaluateAll(ts => ts.map(t => t.tBodies[0].rows.length));
  expect(rows.slice(0, 5).reduce((a, b) => a + b, 0)).toBe(29);
  expect(rows[5]).toBe(16); expect(rows[6]).toBe(13);
  await expect(page.locator('[data-pl-log]')).toHaveCount(0);
  await page.click('[data-pl-filter=urgent]');
  await expect(page.locator('.pl-cat tbody tr')).toHaveCount(await page.evaluate(() => SAMPLES.dam.evidencePlan[0].items.filter(i => i.priority === 'Urgent').length));
  await page.click('[data-evview=register]');
  await expect(page.locator('#stage-panel')).toContainText('EV-004');
  await page.click('.stepper button[data-stage=chart]');
  await expect(page.locator('#stage-panel')).toContainText('Worker A goes under and drowns');
  expect(errs).toEqual([]);
});

test('practice copy of the training case is editable and keeps plan, register, storyline and people', async ({ page }) => {
  const errs = await fresh(page);
  await page.waitForFunction(() => state.dbHandle);
  await page.click('[data-nav-home=caselist]');
  await page.click('#copy-sample-dam');
  await page.waitForFunction(() => { const W = window.CBO_WORKSPACE, c = W.cases()[0]; return c && W.sub(c.id, 'evidencePlan').length === 1 && W.sub(c.id, 'events').length === 10 && W.sub(c.id, 'involvedPersons').length === 7; }, null, { timeout: 20000 });
  const { c, d, ev } = await plan(page);
  expect(c.caseTitle).toBe('Contractor worker drowned at an overflowing return-water dam (practice copy)');
  expect([d.items.length, d.photos.length, d.tests.length, ev.length]).toEqual([29, 16, 13, 4]);
  await page.click('.stepper button[data-stage=evidence]');
  await expect(page.locator('#pl-narrative')).toHaveValue(/Worker B made it to the bank/);
  // log the first People item into the register
  await page.locator('[data-pl-log]').first().click();
  await page.waitForFunction(() => { const W = window.CBO_WORKSPACE, c = W.cases()[0]; return W.sub(c.id, 'evidence').length === 5; });
  await expect(page.locator('#pl-stats')).toContainText('1/29');
  const after = await plan(page);
  const logged = after.ev.find(e => e.id === 'EV-005');
  expect(logged).toMatchObject({ type: 'Witness Statement', status: 'Collected' });
  expect(after.d.items.find(i => i.ref === 'EV-005').status).toBe('Collected');
  expect(errs).toEqual([]);
});

test('new case: starter plan from the account, edit, status, photo, delete with undo, persists', async ({ page }) => {
  const errs = await fresh(page);
  await newCaseOnPlan(page, 'Conveyor tail pulley entanglement', ACCOUNT);
  await page.click('#pl-starter');
  await expect(page.locator('#pl-status')).toContainText('Plan ready');
  const st = await page.evaluate(() => planOf(activeCase()));
  expect(st.items.some(i => /Machine guards/.test(i.item))).toBe(true);        // machinery pack
  expect(st.items.some(i => /boat|water body/i.test(i.item))).toBe(false);     // no water pack
  expect(st.tests.length).toBeGreaterThanOrEqual(3);
  expect(new Set(st.items.map(i => i.cat))).toEqual(new Set(['people', 'environment', 'equipment', 'procedures', 'organisation']));
  // add an item through the edit dialog
  await page.click('[data-pl-edit="item:"]');
  await page.selectOption('#pe-cat', 'procedures');
  await page.fill('#pe-item', 'Lock register for CV-12 isolator');
  await page.click('#edit-save');
  await expect(page.locator('.pl-cat').nth(3)).toContainText('Lock register for CV-12 isolator');
  // status change
  const firstSel = page.locator('[data-pl-st]').first();
  await firstSel.selectOption('Not available');
  await expect(page.locator('[data-pl-st]').first()).toHaveValue('Not available');
  // photo taken
  await page.locator('[data-pl-taken]').first().check();
  // delete a test, then undo
  const nTests = st.tests.length;
  await page.locator('[data-pl-del^="test:"]').first().click();
  await expect(page.locator('.toast')).toContainText('Statement removed');
  await page.click('.toast-undo');
  await page.waitForTimeout(300);
  await page.waitForTimeout(900); await page.evaluate(() => window.CBO_FILEBAR.flush());
  const saved = (await plan(page)).d;
  expect(saved.tests.length).toBe(nTests);
  expect(saved.items.find(i => i.item === 'Lock register for CV-12 isolator').cat).toBe('procedures');
  expect(saved.photos.filter(p => p.taken).length).toBe(1);
  expect(saved.narrative).toBe(ACCOUNT);
  // persists over a reload
  await page.reload();
  await page.waitForFunction(() => window.CBO_WORKSPACE && window.CBO_WORKSPACE.cases().length === 1);
  const again = (await plan(page)).d;
  expect(again.items.length).toBe(saved.items.length);
  expect(errs).toEqual([]);
});

test('copy prompt / paste answer round trip, replace or add, and Excel export', async ({ page }) => {
  const errs = await fresh(page);
  await newCaseOnPlan(page, 'Paste test', ACCOUNT);
  const prompt = await page.evaluate(() => CBP.prompt(activeCase(), planOf(activeCase()), planCtx(activeCase())));
  expect(prompt).toMatch(/PEEPO/); expect(prompt).toMatch(/people\|environment\|equipment\|procedures\|organisation/); expect(prompt).toContain('tail pulley');
  const answer = '```json\n' + JSON.stringify({
    items: [{ cat: 'People', item: 'Interview the fitter', source: 'Fitter', purpose: 'Why he reached in', icam: 'actions', priority: 'Urgent', method: 'Interview' },
      { cat: 'paper', item: 'Guard removal work order', source: 'Maintenance', purpose: 'Why the guard was off', icam: 'organisational', priority: 'High', method: 'Request copy' }],
    photos: [{ subject: 'Tail pulley', position: 'Walkway', view: 'Overview', purpose: 'Guard gap' }],
    tests: [{ statement: 'The guard was removed last week', kind: 'Assumption', evidence: 'Work order', node: 'event:nope' }],
    notes: 'Secure the lock register first.' }) + '\n```';
  await page.click('#pl-paste-open');
  await page.fill('#pl-paste', answer);
  await page.click('#pl-paste-use');
  await expect(page.locator('#pl-status')).toContainText('Plan ready: 2 evidence items');
  let d = await page.evaluate(() => planOf(activeCase()));
  expect(d.items.map(i => [i.cat, i.icam])).toEqual([['people', 'actions'], ['procedures', 'organizational']]);
  expect(d.tests[0].node).toBe('');
  // a second (starter) plan asks replace or add; add keeps the pasted items
  await page.click('#pl-starter');
  await expect(page.locator('[data-pl-mode=add]')).toBeVisible();
  await page.click('[data-pl-mode=add]');
  d = await page.evaluate(() => planOf(activeCase()));
  expect(d.items.some(i => i.item === 'Interview the fitter')).toBe(true);
  expect(d.items.length).toBeGreaterThan(20);
  // Excel
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#pl-xlsx')]);
  expect(dl.suggestedFilename()).toBe('paste-test-evidence-plan.xlsx');
  const buf = fs.readFileSync(await dl.path());
  expect(buf.slice(0, 2).toString()).toBe('PK');
  const txt = buf.toString('latin1');
  ['xl/worksheets/sheet4.xml', 'Evidence checklist', 'PEEPO category', 'Photography schedule', 'Statements to test', 'Interview the fitter', 'Individual / Team Actions'].forEach(s => expect(txt).toContain(s));
  expect(errs).toEqual([]);
});

test('Claude (sample capability) writes the plan; unavailable Claude falls back cleanly', async ({ page }) => {
  const errs = await fresh(page);
  await newCaseOnPlan(page, 'Claude test', ACCOUNT);
  await expect(page.locator('#pl-claude')).toHaveCount(0);   // offline: no Claude button
  await page.evaluate(() => {
    const ans = { items: [{ cat: 'equipment', item: 'CV-12 pull-wire test record', source: 'Maintenance', purpose: 'Did the pull-wire work?', icam: 'defences', priority: 'High', method: 'Request copy' }], photos: [], tests: [], notes: 'n' };
    const f = async () => ({ text: JSON.stringify(ans) }); f.json = async (input, o) => { window.__prompt = input; o.onText({ text: '{"items":', delta: '' }); return ans; };
    state.sampleHandle = f; renderStagePanel();
  });
  await page.click('#pl-claude');
  await expect(page.locator('#pl-status')).toContainText('Written by Claude');
  expect(await page.evaluate(() => /ICAM/.test(window.__prompt) && planOf(activeCase()).items[0].item)).toBe('CV-12 pull-wire test record');
  await page.evaluate(() => { const f = async () => { throw { code: 'not_granted' }; }; f.json = f; state.sampleHandle = f; state.plan.ask = null; renderStagePanel(); });
  await page.click('#pl-claude');
  await expect(page.locator('#pl-status')).toContainText('not available to this page');
  await expect(page.locator('#pl-claude')).toHaveCount(0);
  expect(errs).toEqual([]);
});

test('facilitator answer imports as a complete ICAM case', async ({ page }) => {
  const errs = await fresh(page);
  await page.setInputFiles('#import-case-input', FAC);
  await page.waitForFunction(() => { const W = window.CBO_WORKSPACE, c = W.cases()[0]; return c && W.sub(c.id, 'correctiveActions').length === 14 && W.sub(c.id, 'evidencePlan').length === 1; }, null, { timeout: 20000 });
  const n = await page.evaluate(() => { const W = window.CBO_WORKSPACE, c = W.cases()[0], s = k => W.sub(c.id, k).length; return [s('events'), s('conditions'), s('icamFactors'), s('rootCauses'), s('contributingFactors')]; });
  expect(n).toEqual([13, 22, 35, 8, 8]);
  await page.click('.stepper button[data-stage=icam]');
  await expect(page.locator('#stage-panel')).toContainText('Contractor management process so slow');
  await page.click('.stepper button[data-stage=report]');
  await expect(page.locator('#report-doc')).toContainText('Worker A, who could not swim');
  expect(errs).toEqual([]);
});
