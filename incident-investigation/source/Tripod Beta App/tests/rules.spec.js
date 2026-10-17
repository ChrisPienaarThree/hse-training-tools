// Rules engine unit tests (pure Node, no browser).
const { test, expect } = require('@playwright/test');
const C = require('../src/content.js'), R = require('../src/rules.js');
R.setNames(t => C.TYPES[t].name);
const X = require('../src/export.js');
const N = (id, type, extra) => Object.assign({ id, type, label: id + ' label text', x: 0, y: 0 }, extra || {});
const E = (from, to) => ({ id: from + '>' + to, from, to });
const codes = c => R.check(c).filter(i => i.sev !== 'tip').map(i => i.code);
const base = () => ({ nodes: [N('a', 'agent'), N('o', 'object'), N('e', 'event'), N('b', 'failed'), N('ic', 'ic', { act: 'act', errorType: 'slip' }), N('pc', 'pc', { scope: 'org' }), N('uc', 'uc', { brf: 'TR' })],
  edges: [E('a', 'b'), E('b', 'e'), E('o', 'e'), E('ic', 'b'), E('pc', 'ic'), E('uc', 'pc')], actions: [{ target: 'b', text: 'x', smart: {} }, { target: 'uc', text: 'y', smart: {} }] });

test('worked example has no rule errors or warnings', () => {
  const ex = JSON.parse(JSON.stringify(C.EXAMPLE));
  expect(codes(ex)).toEqual([]);
  expect(R.trios(ex)).toHaveLength(5);
  expect(ex.nodes.filter(n => n.type === 'failed')).toHaveLength(7);
});
test('a complete minimal trio passes', () => { expect(codes(base())).toEqual([]); });
test('event needs one agent and one object', () => {
  const c = base(); c.edges = c.edges.filter(e => e.id !== 'o>e');
  expect(codes(c)).toContain('E2');
  c.nodes.push(N('a2', 'agent')); c.edges.push(E('a2', 'e'));
  expect(codes(c)).toContain('E1');
});
test('failed barrier needs exactly one immediate cause', () => {
  const c = base(); c.edges = c.edges.filter(e => e.id !== 'ic>b');
  expect(codes(c)).toContain('B2');
  const d = base(); d.nodes.push(N('ic2', 'ic', { errorType: 'lapse' }), N('pc2', 'pc'), N('uc2', 'uc', { brf: 'PR' })); d.edges.push(E('ic2', 'b'), E('pc2', 'ic2'), E('uc2', 'pc2')); d.actions.push({ target: 'uc2', text: 'z' });
  expect(codes(d)).toContain('B3');
});
test('missing barrier links only to underlying causes', () => {
  expect(R.canConnect('ic', 'missing').ok).toBe(false);
  expect(R.canConnect('pc', 'missing').ok).toBe(false);
  expect(R.canConnect('uc', 'missing').ok).toBe(true);
  const c = base(); c.nodes.find(n => n.id === 'b').type = 'missing';
  expect(codes(c)).toEqual(expect.arrayContaining(['L1', 'B4']));
});
test('effective barrier has no causation path and makes a potential event', () => {
  expect(R.canConnect('ic', 'effective').ok).toBe(false);
  const c = base(); c.nodes.find(n => n.id === 'b').type = 'effective';
  c.edges = c.edges.filter(e => e.id !== 'ic>b');
  expect(R.trios(c)[0].potential).toBe(true);
  expect(X.potentialMap(c)).toEqual({ e: 1 });
});
test('organisational precondition needs an underlying cause; external may be an end node', () => {
  const c = base(); c.edges = c.edges.filter(e => e.id !== 'uc>pc'); c.actions = [{ target: 'b', text: 'x' }];
  c.nodes = c.nodes.filter(n => n.id !== 'uc');
  expect(codes(c)).toContain('P2');
  c.nodes.find(n => n.id === 'pc').scope = 'external';
  expect(codes(c)).not.toContain('P2');
});
test('immediate cause without precondition warns unless justified', () => {
  const c = base(); c.edges = c.edges.filter(e => e.id !== 'pc>ic');
  expect(codes(c)).toContain('I2');
  c.nodes.find(n => n.id === 'ic').justification = 'Third-party driver, outside company control';
  expect(codes(c)).not.toContain('I2');
});
test('underlying causes are end nodes and need a BRF', () => {
  expect(R.canConnect('pc', 'uc').ok).toBe(false);
  const c = base(); delete c.nodes.find(n => n.id === 'uc').brf;
  expect(codes(c)).toContain('U2');
});
test('every failed barrier and underlying cause needs an action', () => {
  const c = base(); c.actions = [];
  expect(codes(c).filter(x => x === 'R1')).toHaveLength(2);
});
test('orient reverses a drag made backwards', () => {
  const o = R.orient({ id: 'b', type: 'failed' }, { id: 'ic', type: 'ic' });
  expect(o).toMatchObject({ ok: true, from: 'ic', to: 'b' });
  expect(R.orient({ id: 'a', type: 'agent' }, { id: 'o', type: 'object' }).ok).toBe(false);
});
test('loops are reported', () => {
  const c = base(); c.nodes.push(N('b2', 'failed')); c.edges.push(E('b', 'b2'), E('b2', 'b'));
  expect(codes(c)).toContain('T1');
});
test('docx is a valid zip with the expected parts', () => {
  const ex = JSON.parse(JSON.stringify(C.EXAMPLE)); X.tidy(ex);
  const z = Buffer.from(X.docx(ex, [{ id: 'tree', bytes: new Uint8Array([137, 80, 78, 71]), w: 1000, h: 500 }]));
  expect(z.slice(0, 2).toString()).toBe('PK');
  const s = z.toString('latin1');
  ['[Content_Types].xml', 'word/document.xml', 'word/styles.xml', 'word/media/tree.png'].forEach(n => expect(s).toContain(n));
});
test('casebook package matches the Casebook import format', () => {
  const ex = JSON.parse(JSON.stringify(C.EXAMPLE)); X.tidy(ex);
  const p = X.casebookPackage(ex);
  expect(p.format).toBe('storyline-casebook-case');
  expect(p.events).toHaveLength(5); expect(p.conditions).toHaveLength(9); expect(p.rootCauses).toHaveLength(10);
  expect(p.correctiveActions.filter(a => a.linkedCauseType === 'root')).toHaveLength(10);
  p.correctiveActions.filter(a => a.linkedCauseId).forEach(a => expect(p.rootCauses.map(r => r.id)).toContain(a.linkedCauseId));
});
