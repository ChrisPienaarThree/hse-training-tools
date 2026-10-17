/* Content integrity tests for The Falling Billet.
   Run:  node --test tests/
   Covers src/content.js (the answer keys) and the photos/ folder, so a
   broken cross-reference or a de-anonymising slip fails before build.py. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const G = require(path.join(ROOT, 'src', 'content.js'));
const F = G.facts;

// every place a fact can be discovered, keyed by fact id
function factSources() {
  const src = {};
  const add = (f, s) => (src[f] = src[f] || []).push(s);
  for (const w in G.interviews) G.interviews[w].qs.forEach(q => (q.facts || []).forEach(f => add(f, 'iv:' + w)));
  for (const d in G.docs) G.docs[d].obs.forEach(o => o.fact && add(o.fact, 'doc:' + d));
  for (const k in G.site) {
    const s = G.site[k];
    [s, s.good, s.poor, s.ok, s.held, s.free, s.early].forEach(o => o && (o.facts || []).forEach(f => add(f, 'site:' + k)));
  }
  return src;
}

function sitePhotos() {
  const out = [];
  for (const k in G.site) {
    const s = G.site[k];
    [s, s.good, s.poor, s.ok, s.held, s.free, s.early].forEach(o => o && (o.photos || []).forEach(p => out.push([k, p])));
  }
  return out;
}

test('every fact referenced by interviews, documents and site actions exists', () => {
  const src = factSources();
  const unknown = Object.keys(src).filter(f => !F[f]).map(f => f + ' (' + src[f].join(', ') + ')');
  assert.deepEqual(unknown, []);
});

test('every key fact can be discovered somewhere in the game', () => {
  const src = factSources();
  const orphans = Object.keys(F).filter(f => F[f].key && !src[f]);
  assert.deepEqual(orphans, []);
});

test('facts are well formed: kind, ICAM codes and condition attachments', () => {
  const known = c => c === 'NONE' || Object.values(G.icamCodes).some(g => g.codes[c]);
  for (const [id, d] of Object.entries(F)) {
    assert.ok(['event', 'condition'].includes(d.kind), id + ' kind ' + d.kind);
    assert.ok(d.text && d.text.length > 0, id + ' has no text');
    d.icam.forEach(c => assert.ok(known(c), 'unknown ICAM code ' + c + ' on ' + id));
    if (d.kind === 'condition') (d.attach || []).forEach(a =>
      assert.ok(a === 'G' || F[a]?.kind === 'event', id + ' attaches to non-event ' + a));
  }
});

test('events have unique timeline order', () => {
  const orders = Object.values(F).filter(d => d.kind === 'event').map(d => d.order);
  assert.equal(new Set(orders).size, orders.length);
});

test('actions have unique ids, valid targets and sane day windows', () => {
  const ids = G.actions.map(a => a.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate action id');
  for (const a of G.actions) {
    if (a.kind === 'interview') assert.ok(G.interviews[a.who] && G.people[a.who], a.id + ' -> ' + a.who);
    if (a.kind === 'doc') assert.ok(G.docs[a.doc], a.id + ' -> ' + a.doc);
    if (a.kind === 'site') assert.ok(G.site[a.id], a.id + ' has no site outcome');
    assert.ok(a.cost > 0, a.id + ' cost');
    if (a.days) assert.ok(a.days[0] <= a.days[1], a.id + ' days ' + a.days);
  }
});

test('every why-tree level has at least one correct option and valid evidence', () => {
  for (const w of G.whys) w.levels.forEach((l, i) => {
    assert.ok(l.opts.some(o => o.ok), w.id + ' level ' + (i + 1) + ' has no correct option');
    l.opts.forEach(o => (o.needs || []).concat(o.contra || []).forEach(f =>
      assert.ok(F[f], w.id + ' level ' + (i + 1) + ' cites unknown fact ' + f)));
    l.opts.filter(o => !o.ok).forEach(o => assert.ok(o.fb, w.id + ' wrong option lacks feedback: ' + o.t));
  });
});

test('stage 1 callout has both good and poor choices, each with feedback', () => {
  assert.ok(G.callout.some(c => c.good) && G.callout.some(c => !c.good));
  G.callout.forEach(c => assert.ok(c.fb, c.id + ' lacks feedback'));
});

test('every photo used has a caption and a file in photos/', () => {
  for (const [k, p] of sitePhotos()) {
    assert.ok(G.photos[p], k + ' uses uncaptioned photo ' + p);
    assert.ok(fs.existsSync(path.join(ROOT, 'photos', p + '.jpg')), k + ' uses missing file ' + p + '.jpg');
  }
});

test('casualty photos stay excluded', () => {
  const excluded = ['p120', 'p122', 'p123', 'p130'];
  const content = fs.readFileSync(path.join(ROOT, 'src', 'content.js'), 'utf8');
  for (const p of excluded) {
    assert.ok(!fs.existsSync(path.join(ROOT, 'photos', p + '.jpg')), p + '.jpg is in photos/');
    assert.ok(!content.includes(p), p + ' is referenced in content.js');
  }
});

test('source files carry no real company names', () => {
  for (const f of ['content.js', 'app.js', 'template.html']) {
    const text = fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
    assert.doesNotMatch(text, /\bC[IS]{2}CO\b/i, f + ' mentions the real company');
  }
});
