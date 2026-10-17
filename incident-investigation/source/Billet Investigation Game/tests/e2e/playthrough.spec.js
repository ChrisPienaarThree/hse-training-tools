/* End-to-end playthrough of the built offline game (The Falling Billet.html).
   Plays a model investigation through all nine stages, then checks scores,
   the Casebook export, phone/dark layout and reload persistence.
   Run build.py first, then:  npx playwright test */
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const GAME_URL = pathToFileURL(path.join(__dirname, '..', '..', 'The Falling Billet.html')).href;

// collect page errors and console errors (Google Fonts fail offline; ignore)
function watchErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.stack));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push('console: ' + m.text()); });
  return errors;
}

const state = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__billet.S)));

// run one investigation action: ask the best questions, tick the true document observations
async function doAction(page, id) {
  const btn = page.locator(`[data-act=doAction][data-id=${id}]`);
  if (!(await btn.count())) return false;
  await btn.click();
  for (let k = 0; k < 8; k++) {
    const cards = page.locator('.modal .qcard');
    if (!(await cards.count())) break;
    // prefer open / probing questions over leading or closed ones
    const idx = await page.evaluate(() => {
      const w = window.__billet.S.activeInterview; if (!w) return 0;
      const qs = GAME.interviews[w].qs, good = q => q && (q.type === 'open' || q.type === 'probe');
      const i = [...document.querySelectorAll('.modal .qcard')].findIndex(c => good(qs[+c.dataset.i]));
      return Math.max(0, i);
    });
    await cards.nth(idx).click();
  }
  if (await page.locator('[data-act=recordObs]').count()) {
    await page.evaluate(() => {
      const d = GAME.docs[document.querySelector('[data-act=recordObs]').dataset.id];
      document.querySelectorAll('.modal input.obs:not([disabled])').forEach(cb => { cb.checked = !!d.obs[+cb.dataset.i].ok; });
    });
    await page.locator('[data-act=recordObs]').click();
  }
  if (await page.locator('.modal-bg').count()) await page.locator('.modal [data-act=closeModal]').first().click();
  return true;
}

test('brief screen loads cleanly at phone width', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(GAME_URL);
  await expect(page.locator('[data-act=startSolo]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('model investigation plays through all stages', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(GAME_URL);

  await test.step('stage 1: call-out', async () => {
    await page.fill('#tname', 'Test Team');
    await page.locator('[data-act=startSolo]').click();
    const goods = await page.evaluate(() => GAME.callout.filter(c => c.good).map(c => c.id));
    for (const id of goods) await page.locator(`input[data-act=toggleCallout][data-id=${id}]`).click();
    await page.locator('[data-act=submitCallout]').click();
    await page.locator('[data-act=next]').click();
  });

  await test.step('stage 2: severity and team', async () => {
    await page.locator('[data-act=sev][data-k=A][data-n="4"]').click();
    await page.locator('[data-act=sev][data-k=P][data-n="5"]').click();
    for (const id of ['ops', 'sherq', 'despatch', 'operator', 'haulier', 'scribe'])
      await page.locator(`input[data-act=toggleTeam][data-id=${id}]`).click();
    await page.locator('[data-act=submitTeam]').click();
    await page.locator('[data-act=next]').click();
  });

  await test.step('stage 3: data-collection plan', async () => {
    const acts = await page.evaluate(() => GAME.actions.filter(a => a.essential).map(a => ({ id: a.id, per: !!a.perishable })));
    for (const a of acts) {
      await page.locator(`input[data-act=planInc][data-id=${a.id}]`).click();
      if (a.per) await page.locator(`.star[data-id=${a.id}]`).click();
    }
    await page.locator('[data-act=submitPlan]').click();
    await page.locator('[data-act=next]').click();
  });

  await test.step('stage 4: three days of investigation', async () => {
    // every essential action, perishable first, filling the 4 + 8 + 8 hour budget exactly
    const days = [
      ['s_scene', 'q_load', 'i_ndlovu', 'q_hyster'],
      ['i_visser', 'i_adams', 'q_fork', 's_observe', 'i_jansen', 'i_steyn', 'i_patel', 'p_wi'],
      ['i_mokoena', 'i_crew', 'q_recon', 'q_preshift', 'q_loadtest', 'p_licence', 'p_hira', 'p_rules', 'p_induct', 'p_contract', 'o_increg', 'o_rms']
    ];
    for (const [i, ids] of days.entries()) {
      for (const id of ids) expect(await doAction(page, id), id + ' unavailable on day ' + (i + 1)).toBe(true);
      if (i < days.length - 1) await page.locator('[data-act=endDay]').click();
    }
    const s = await state(page);
    const essential = await page.evaluate(() => GAME.actions.filter(a => a.essential).map(a => a.id));
    expect(essential.filter(id => !s.done.includes(id)), 'essential actions not done').toEqual([]);
    const key = await page.evaluate(() => Object.keys(GAME.facts).filter(f => GAME.facts[f].key));
    expect(key.filter(f => !s.facts[f]), 'key facts not discovered').toEqual([]);
    expect(s.photos.length).toBeGreaterThan(0);
  });

  await test.step('stage 4: 5-why trees', async () => {
    await page.locator('[data-act=tab][data-t=why]').click();
    for (let guard = 0; guard < 40; guard++) {
      const sel = await page.evaluate(() => {
        for (const w of GAME.whys) {
          const st = window.__billet.S.whys[w.id];
          if (st && st.level >= w.levels.length) continue;
          const i = w.levels[st ? st.level : 0].opts.findIndex(o => o.ok);
          return `[data-act=why][data-w=${w.id}][data-i="${i}"]`;
        }
        return null;
      });
      if (!sel) break;
      await page.locator(sel).click();
    }
    const s = await state(page);
    const levels = await page.evaluate(() => Object.fromEntries(GAME.whys.map(w => [w.id, w.levels.length])));
    for (const [id, n] of Object.entries(levels)) expect(s.whys[id]?.level, id).toBe(n);
    await page.locator('[data-act=closeInvest]').click();
  });

  await test.step('stage 5: storyline', async () => {
    await page.evaluate(() => {
      const S = window.__billet.S;
      Object.keys(S.facts).forEach(f => { const d = GAME.facts[f]; S.story.cls[f] = d.elim ? 'irrelevant' : d.kind; });
      S.story.order = Object.keys(S.facts).filter(f => GAME.facts[f].kind === 'event').sort((a, b) => GAME.facts[a].order - GAME.facts[b].order);
      Object.keys(S.facts).filter(f => S.story.cls[f] === 'condition').forEach(f => {
        const a = GAME.facts[f].attach.find(x => x === 'G' || S.facts[x]); if (a) S.story.attach[f] = a;
      });
      window.__billet.render();
    });
    await page.locator('[data-act=checkStory]').click();
    expect((await page.evaluate(() => window.__billet.storyEval())).score).toBeGreaterThanOrEqual(90);
    await page.locator('[data-act=next]').click();
  });

  await test.step('stage 6: ICAM coding', async () => {
    const selects = page.locator('select[data-act=icam]');
    expect(await selects.count()).toBeGreaterThan(0);
    const reset = page.locator('#hdr-reset');
    await expect(reset).toBeDisabled();
    // part-way through coding the header reset is live and clears just this stage
    await selects.first().selectOption(await selects.first().evaluate(el => GAME.facts[el.dataset.f].icam[0]));
    await expect(reset).toBeEnabled();
    await reset.click();
    await page.locator('[data-act=resetStageYes]').click();
    expect((await state(page)).icam).toEqual({});
    await expect(reset).toBeDisabled();
    for (const s of await selects.all()) {
      const code = await s.evaluate(el => GAME.facts[el.dataset.f].icam[0]);
      await s.selectOption(code);
    }
    await page.locator('[data-act=checkIcam]').click();
    expect((await page.evaluate(() => window.__billet.icamEval())).score).toBe(100);
    await page.locator('[data-act=next]').click();
  });

  await test.step('stage 7: root causes and actions', async () => {
    await expect(page.locator('#hdr-reset')).toBeDisabled();
    await page.fill('#rtext', 'draft');
    await expect(page.locator('#hdr-reset')).toBeEnabled();
    await page.locator('#hdr-reset').click();
    await page.locator('[data-act=resetStageYes]').click();
    await expect(page.locator('#rtext')).toHaveValue('');
    for (const id of ['r1', 'r2', 'r3']) await page.locator(`input[data-act=root][data-id=${id}]`).click();
    for (const id of ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'w1']) await page.locator(`input[data-act=actpick][data-id=${id}]`).click();
    await page.fill('#rtext', 'The risk management system was immature, so falling billets were never seen as a fatal risk; unreported falls normalised the hazard; contractor management did not control loads or drivers.');
    await page.locator('[data-act=checkRoot]').click();
    await page.locator('[data-act=next]').click();
  });

  await test.step('debrief: scores and Casebook export', async () => {
    const sc = await page.evaluate(() => window.__billet.scores());
    expect(sc.parts).toHaveLength(8);
    expect(sc.total, JSON.stringify(sc.parts)).toBeGreaterThanOrEqual(80);

    const pkg = await page.evaluate(() => window.__billet.casebookPackage());
    expect(pkg.events.length).toBeGreaterThan(0);
    expect(pkg.conditions.length).toBeGreaterThan(0);
    expect(pkg.conditions.filter(c => c.eventId).length).toBeGreaterThan(0);
    expect(pkg.icamFactors.length).toBeGreaterThan(0);
    // the written root-cause statement leads, then the three selected root causes
    expect(pkg.rootCauses.map(r => r.id)).toEqual(['rc0', 'rc1', 'rc2', 'rc3']);
    expect(pkg.correctiveActions.length).toBeGreaterThan(0);
    expect(pkg.evidence.length).toBeGreaterThan(0);
    expect(pkg.investigationTeam.length).toBeGreaterThan(0);
  });

  await test.step('phone width in dark mode has no sideways scroll', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.locator('[data-act=goto][data-i="4"]').click();
    await page.locator('[data-act=tab][data-t=actions]').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.locator('[data-act=goto][data-i="5"]').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  await test.step('progress survives a reload', async () => {
    const before = await state(page);
    await page.reload();
    const after = await state(page);
    expect(Object.keys(after.facts).length).toBe(Object.keys(before.facts).length);
    expect(after.roots).toEqual(before.roots);
  });

  await test.step('reset one stage: ICAM clears alone', async () => {
    await page.locator('[data-act=goto][data-i="6"]').click();
    await page.locator('[data-act=resetStageAsk]').click();
    await expect(page.locator('.modal')).not.toContainText('also clears');
    await page.locator('[data-act=resetStageYes]').click();
    const s = await state(page);
    expect(s.icam).toEqual({});
    expect(s.icamChecked).toBe(false);
    expect(Object.keys(s.story.cls).length).toBeGreaterThan(0);
    expect(s.maxStage).toBe(8);
    await expect(page.locator('#hdr-reset')).toBeDisabled();
  });

  await test.step('reset an early stage: call-out also clears the stages built on it', async () => {
    const before = await state(page);
    await page.locator('[data-act=goto][data-i="1"]').click();
    await page.locator('[data-act=resetStageAsk]').click();
    await expect(page.locator('.modal')).toContainText('also clears Investigate and Storyline');
    await page.locator('[data-act=resetStageYes]').click();
    const s = await state(page);
    expect(s.callout).toEqual([]);
    expect(s.flags).toEqual({});
    expect(s.done).toEqual([]);
    expect(s.facts).toEqual({});
    expect(s.story.cls).toEqual({});
    expect(s.maxStage).toBe(1);
    // independent stages keep their work
    expect(s.team).toEqual(before.team);
    expect(s.plan).toEqual(before.plan);
    expect(s.roots).toEqual(before.roots);
    expect(s.log.map(l => l.text)).toEqual(['Stage reset: Root cause & actions', 'Stage reset: ICAM analysis', 'Stage reset: Call-out (also Investigate, Storyline)']);
    await expect(page.locator('[data-act=goto][data-i="4"]')).toBeDisabled();
  });

  expect(errors).toEqual([]);
});

test('header reset: hidden on the briefing, live once a stage has work', async ({ page }) => {
  await page.goto(GAME_URL);
  const reset = page.locator('#hdr-reset');
  await expect(reset).toBeHidden();
  await page.fill('#tname', 'Test Team');
  await page.locator('[data-act=startSolo]').click();
  await expect(reset).toBeVisible();
  await expect(reset).toBeDisabled();
  await page.locator('input[data-act=toggleCallout][data-id=care]').click();
  await expect(reset).toBeEnabled();
  // still reachable after scrolling to the bottom of a long stage
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(reset).toBeInViewport();
  await reset.click();
  await page.locator('[data-act=resetStageYes]').click();
  await expect(page.locator('input[data-act=toggleCallout][data-id=care]')).not.toBeChecked();
});

test('guide: three tabs, debrief notes only in facilitator mode', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(GAME_URL);
  await page.locator('#hdr-guide').click();
  await expect(page.locator('.modal h3').first()).toHaveText('What you will practise');
  await page.locator('.guide-tabs [data-t=play]').click();
  await expect(page.locator('.modal .guide-tbl tr')).toHaveCount(9); // header + 8 stages
  await page.locator('.guide-tabs [data-t=fac]').click();
  await expect(page.locator('.modal')).toContainText('open in facilitator mode');
  await expect(page.locator('.modal')).not.toContainText('Ask the class');
  expect(await page.evaluate(() => document.querySelector('.modal-bg').scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.locator('.modal [data-act=openFac]').click();
  await page.fill('#faccode', 'icam');
  await page.locator('[data-act=facLogin]').click();
  await page.locator('.modal [data-act=closeModal]').last().click();
  await page.locator('[data-act=openGuide][data-t=fac]').click();
  await expect(page.locator('.modal')).toContainText('Ask the class');
  expect(errors).toEqual([]);
});
