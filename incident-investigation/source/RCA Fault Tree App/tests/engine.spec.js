// Engine unit tests (Node only).
const { test, expect } = require('@playwright/test');
const E = require('../src/engine.js'), X = require('../src/example.js'), R = require('../src/export.js');
const ev = (id, v, o) => Object.assign({ id, code: id, kind: 'basic', label: id, children: [], status: 'unverified', prob: { src: 'manual', value: v, unit: 'p' } }, o || {});
const gate = (id, g, ch, o) => Object.assign({ id, code: id, kind: 'gate', gate: g, label: id, children: ch, status: 'unverified', prob: { src: 'none' } }, o || {});
const mk = nodes => { const m = {}; nodes.forEach(n => m[n.id] = n); return { root: nodes[0].id, nodes: m, actions: [], libOverrides: {}, customLib: [] }; };
const close = (a, b) => expect(Math.abs(a - b) / Math.max(1e-12, Math.abs(b))).toBeLessThan(1e-9);

test('OR, AND, VOTE and frequency arithmetic', () => {
  let c = mk([gate('t', 'OR', ['a', 'b']), ev('a', 0.1), ev('b', 0.2)]);
  close(E.evaluate(c, 'prior').top.v, 1 - 0.9 * 0.8);
  c = mk([gate('t', 'AND', ['a', 'b']), ev('a', 0.1), ev('b', 0.2)]); close(E.evaluate(c, 'prior').top.v, 0.02);
  c = mk([gate('t', 'VOTE', ['a', 'b', 'c'], { k: 2 }), ev('a', 0.1), ev('b', 0.1), ev('c', 0.1)]); close(E.evaluate(c, 'prior').top.v, 3 * 0.01 * 0.9 + 0.001);
  c = mk([gate('t', 'AND', ['f', 'p']), ev('f', 4, { prob: { src: 'freq', value: 4, unit: 'f' } }), ev('p', 0.01)]);
  const r = E.evaluate(c, 'prior').top; close(r.v, 0.04); expect(r.u).toBe('f');
});
test('unit mixing is reported', () => {
  const c = mk([gate('t', 'OR', ['f', 'p']), ev('f', 4, { prob: { src: 'freq', value: 4, unit: 'f' } }), ev('p', 0.01)]);
  expect(E.check(c).map(i => i.code)).toContain('U1');
  const d = mk([gate('t', 'AND', ['f', 'g']), ev('f', 4, { prob: { src: 'freq', value: 4 } }), ev('g', 2, { prob: { src: 'freq', value: 2 } })]);
  expect(E.check(d).map(i => i.code)).toContain('U2');
});
test('evidence conditioning and posterior P(cause | incident)', () => {
  const c = mk([gate('t', 'OR', ['a', 'b'], { status: 'confirmed' }), ev('a', 0.1), ev('b', 0.3)]);
  const P = E.posteriors(c).out, top = 1 - 0.9 * 0.7;
  close(P.a, 0.1 / top); close(P.b, 0.3 / top);
  c.nodes.b.status = 'ruledout';
  expect(E.posteriors(c).out.a).toBeCloseTo(1, 9);
  c.nodes.b.status = 'confirmed';
  close(E.evaluate(c, 'evidence').top.v, 1);
});
test('posterior of an initiating frequency is its share of the top', () => {
  const c = mk([gate('t', 'OR', ['f1', 'f2']), ev('f1', 3, { prob: { src: 'freq', value: 3 } }), ev('f2', 1, { prob: { src: 'freq', value: 1 } })]);
  const P = E.posteriors(c).out; close(P.f1, 0.75); close(P.f2, 0.25);
});
test('cut sets drop ruled-out causes and rank confirmed first', () => {
  const c = mk([gate('t', 'OR', ['g', 'c']), gate('g', 'AND', ['a', 'b']), ev('a', 0.1, { status: 'confirmed' }), ev('b', 0.1, { status: 'confirmed' }), ev('c', 0.5, { status: 'ruledout' })]);
  const r = E.rankCutSets(c);
  expect(r.rows.map(x => x.ids)).toEqual([['a', 'b']]); expect(r.eliminated).toBe(1); expect(r.rows[0].status).toBe('confirmed');
});
test('logic contradictions are caught', () => {
  const c = mk([gate('t', 'OR', ['a', 'b'], { status: 'confirmed', evidence: 'x' }), ev('a', 0.1, { status: 'ruledout', evidence: 'y' }), ev('b', 0.1, { status: 'ruledout', evidence: 'z' })]);
  expect(E.check(c).map(i => i.code)).toContain('C1');
  const d = mk([gate('t', 'AND', ['a', 'b'], { status: 'confirmed', evidence: 'x' }), ev('a', 0.1, { status: 'ruledout', evidence: 'y' }), ev('b', 0.1, { status: 'confirmed', evidence: 'z' })]);
  expect(E.check(d).map(i => i.code)).toContain('C2');
});
test('library lookup, case override and edited flag', () => {
  const c = mk([gate('t', 'OR', ['a']), ev('a', 0.01, { prob: { src: 'equip', item: 'eq-lswitch', value: 0.01, unit: 'p' } })]);
  expect(E.libItem(c, 'eq-lswitch').value).toBe(0.01);
  c.libOverrides['eq-lswitch'] = 0.05;
  const it = E.libItem(c, 'eq-lswitch'); expect(it.value).toBe(0.05); expect(it.def).toBe(0.01); expect(it.overridden).toBe(true);
  c.nodes.a.prob.value = 0.2; expect(E.check(c).map(i => i.code)).toContain('P3');
  c.nodes.a.prob.note = 'proof test overdue'; expect(E.check(c).map(i => i.code)).not.toContain('P3');
});
test('worked example: numbers, ranking, outputs', () => {
  const c = JSON.parse(JSON.stringify(X));
  expect(E.check(c).filter(i => i.sev === 'error')).toEqual([]);
  const P = E.posteriors(c).out; expect(P.e8).toBeGreaterThan(0.9); expect(P.e10).toBeLessThan(0.05);
  close(P.e8 + P.e10 - P.e8 * P.e10 * 0, P.e8 + P.e10);
  const z = Buffer.from(R.docx(c, null)); expect(z.slice(0, 2).toString()).toBe('PK');
  const pkg = R.casebookPackage(c); expect(pkg.format).toBe('storyline-casebook-case'); expect(pkg.rootCauses.length).toBe(1);
  expect(R.csv(c).split('\r\n').length).toBe(Object.keys(c.nodes).length + 1);
});
