// Shared-database mode against an in-memory mock of the artifact runtime (window.claude).
const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../../Tripod Beta Investigator.html');

const MOCK = () => {
  const docs = {}, subs = [];
  const snapOf = () => ({ docs: Object.keys(docs).map(id => ({ id, exists: true, data: () => docs[id] })) });
  const fire = () => setTimeout(() => subs.forEach(f => f(snapOf())), 5);
  const db = {
    collection: p => ({ onSnapshot: (next) => { subs.push(next); fire(); return () => {}; } }),
    doc: p => { const id = p.split('/')[1]; return { set: async b => { docs[id] = JSON.parse(JSON.stringify(b)); fire(); }, delete: async () => { delete docs[id]; fire(); } }; }
  };
  window.__mock = { docs, fire };
  const saved = [];
  window.__saved = saved;
  window.claude = { use: async n => n === 'db' ? db : n === 'user' ? { id: async () => 'u-me', can: async () => true, profiles: async ids => Object.fromEntries(ids.map(i => [i, { name: i === 'u-other' ? 'Thandi M' : '' }])) } : n === 'downloads' ? { save: async r => { saved.push(r.filename); return { status: 'saved' }; } } : null };
};

test('cases live in the shared database and remote edits arrive', async ({ page }) => {
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(MOCK);
  await page.goto(FILE);
  await expect(page.locator('.top .pill.live')).toContainText('Shared team cases');
  await page.click('[data-act=copyExample]');
  await expect(page.locator('.node')).toHaveCount(45);
  const id = await page.evaluate(() => TBApp.S.c.id);
  await expect.poll(() => page.evaluate(i => !!window.__mock.docs[i], id)).toBe(true);
  const doc = await page.evaluate(i => window.__mock.docs[i], id);
  expect(doc.data.nodes).toHaveLength(45); expect(doc.updatedBy).toBe('u-me');
  // another viewer saves a newer version: it loads silently because we have no unsaved edits
  await page.evaluate(i => { const d = JSON.parse(JSON.stringify(window.__mock.docs[i])); d.data.meta.title = 'Renamed by colleague'; d.rev = d.rev + 1; d.session = 'other'; d.updatedBy = 'u-other'; window.__mock.docs[i] = d; window.__mock.fire(); }, id);
  await expect(page.locator('.top .case-name')).toContainText('Renamed by colleague');
  await expect(page.locator('.toast')).toContainText('Thandi M');
  // with unsaved local edits, a remote save raises the conflict banner
  await page.evaluate(() => { TBApp.S.dirty = true; });
  await page.evaluate(i => { const d = JSON.parse(JSON.stringify(window.__mock.docs[i])); d.rev = d.rev + 1; d.session = 'other'; d.updatedBy = 'u-other'; window.__mock.docs[i] = d; window.__mock.fire(); }, id);
  await expect(page.locator('.banner.warn')).toContainText('saved a newer version');
  await page.click('[data-act=conflictTheirs]');
  await expect(page.locator('.banner.warn')).toHaveCount(0);
  // artifact mode: no print button; draw.io export goes out as .drawio.svg through the downloads capability
  await page.click('[data-act=tab][data-t=report]');
  await expect(page.locator('[data-act=print]')).toHaveCount(0);
  await page.click('[data-act=exportDrawio]');
  await expect.poll(() => page.evaluate(() => window.__saved.slice())).toEqual([expect.stringMatching(/\.drawio\.svg$/)]);
  expect(errs).toEqual([]);
});
