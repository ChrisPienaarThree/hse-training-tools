// TB-EX-09 training case: built-in reference case (core diagram + evidence plan), practice copy, facilitator answer imports clean.
const { test, expect } = require('@playwright/test');
const path = require('path'), fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '../../Tripod Beta Investigator.html');
const FAC = path.resolve(__dirname, '../../facilitator/TB-EX-09 Dam drowning - facilitator answer.tripod.json');

async function fresh(page) {
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(FILE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  return errs;
}

test('training case opens read only with the core diagram and a pre-filled evidence plan', async ({ page }) => {
  const errs = await fresh(page);
  await expect(page.locator('.case-card.example')).toHaveCount(2);
  await page.click('[data-act=open][data-id=example-dam-drowning]');
  await expect(page.locator('.node')).toHaveCount(10);
  await expect(page.locator('.banner.info')).toContainText('Training case');
  const st = await page.evaluate(() => ({ trios: TBApp.R.trios(TBApp.S.c).length, errs: TBApp.issues().filter(i => i.sev === 'error').length, q2: TBApp.issues().filter(i => i.code === 'Q2').length }));
  expect(st).toEqual({ trios: 4, errs: 0, q2: 4 });
  await page.click('[data-act=tab][data-t=evidence]');
  await expect(page.locator('#ev-narrative')).toHaveValue(/I assume there was no warning from upstream/);
  await expect(page.locator('#ev-stats')).toContainText('0/27');
  await expect(page.locator('[data-act=evStarter]')).toHaveCount(0);          // read only
  // practice copy is editable and keeps the evidence plan
  await page.click('.banner [data-act=copyExample]');
  await expect(page.locator('.top .case-name')).toContainText('(practice copy)');
  const c = await page.evaluate(() => ({ ex: !!TBApp.S.c.example, ro: TBApp.S.readonly, items: TBApp.S.c.evidence.items.length, nodes: TBApp.S.c.nodes.length }));
  expect(c).toEqual({ ex: false, ro: false, items: 27, nodes: 10 });
  // the Annex 8 card still copies the Annex 8 case
  await page.click('[data-act=closeCase]');
  await page.click('[data-act=copyExample][data-id=example-annex8]');
  await expect(page.locator('.node')).toHaveCount(45);
  expect(errs).toEqual([]);
});

test('facilitator answer opens from file with every rule met', async ({ page }) => {
  const errs = await fresh(page);
  await page.evaluate(t => TBApp.openLinkedFile(null, 'facilitator.tripod.json', t), fs.readFileSync(FAC, 'utf8'));
  await expect(page.locator('.node')).toHaveCount(51);
  await expect(page.locator('#issue-chip')).toContainText('Tree rules met');
  const st = await page.evaluate(() => ({ actions: TBApp.S.c.actions.length, ex: TBApp.S.c.nodes.filter(n => n.type === 'ic' && n.errorType === 'exceptional').length, routine: TBApp.S.c.nodes.filter(n => n.type === 'ic' && n.errorType === 'routine').length }));
  expect(st).toEqual({ actions: 26, ex: 1, routine: 2 });
  expect(errs).toEqual([]);
});
