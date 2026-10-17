/* RCA Fault Tree — application (offline, single file). Saves to the browser and to a linked .rcaft.json file on the USB stick. */
(function () {
'use strict';
const E = RCAE, X = RCAX, LIB = RCALIB, FL = KIT.FileLink({ tool: 'rcaft', ext: '.rcaft.json', label: 'RCA fault tree' });
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = p => (p || '') + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const clone = o => JSON.parse(JSON.stringify(o));
const nowISO = () => new Date().toISOString(), today = () => nowISO().slice(0, 10);
const slug = s => String(s || 'rca').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'rca';
let toastT;
function toast(m) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3600); }
const LS = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };

/* ---------- case model ---------- */
function mkNode(kind, code, label) {
  return { id: uid('n'), code, kind, label: label || '', gate: kind === 'gate' ? 'OR' : '', k: 2, children: [], status: 'unverified', evidence: '', test: '', testOwner: '', testDue: '', cause: '', category: '', why: '', notes: '', collapsed: false, prob: { src: kind === 'house' ? 'none' : 'none', item: '', value: null, unit: 'p', note: '', edited: false } };
}
function newCase() {
  const top = mkNode('gate', 'TOP', 'Top event: describe what happened (the incident being investigated)');
  top.status = 'confirmed';
  return { id: uid('rca-'), format: 'rca-fault-tree', version: 1, meta: { title: 'New RCA investigation', ref: 'RCA-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 900) + 100), date: today(), time: '', location: '', site: '', client: '', investigator: '', team: '', status: 'Draft', description: '', conclusion: '', lessons: '' },
    root: top.id, nodes: { [top.id]: top }, actions: [], libOverrides: {}, customLib: [], createdAt: nowISO(), updatedAt: nowISO() };
}
function normalise(c) {
  c.meta = Object.assign({ title: '', ref: '', date: '', time: '', location: '', site: '', client: '', investigator: '', team: '', status: 'Draft', description: '', conclusion: '', lessons: '' }, c.meta || {});
  c.nodes = c.nodes || {}; c.actions = c.actions || []; c.libOverrides = c.libOverrides || {}; c.customLib = c.customLib || [];
  Object.values(c.nodes).forEach(n => { n.children = n.children || []; n.prob = Object.assign({ src: 'none', item: '', value: null, unit: 'p', note: '', edited: false }, n.prob || {}); if (!n.status) n.status = 'unverified';
    const it = E.libItem(c, n.prob.item); if (it && n.prob.edited == null) n.prob.edited = n.prob.value != null && +n.prob.value !== it.value; if (it && n.prob.value != null && +n.prob.value !== it.value) n.prob.edited = true; });
  return c;
}
function exampleCase() { const c = normalise(clone(RCAEX)); return c; }

/* ---------- state ---------- */
const S = { c: null, tab: 'tree', sel: null, view: { x: 40, y: 60, k: 0.8 }, show: 'evidence', menu: false, link: { handle: null, name: '', perm: 'none' }, undo: [], redo: [], hFilter: 'all', confirm: null, handoff: null, fitPending: true, saving: false };
let issuesCache = null, postCache = null;
const issues = () => issuesCache || (issuesCache = E.check(S.c));
const post = () => postCache || (postCache = E.posteriors(S.c).out);
const invalidate = () => { issuesCache = null; postCache = null; };

function load(c, opts) {
  opts = opts || {};
  S.c = normalise(c); S.sel = S.c.root; S.undo = []; S.redo = []; S.confirm = null; invalidate(); S.fitPending = true;
  S.link = { handle: null, name: '', perm: 'none' };
  if (opts.handle) { S.link = { handle: opts.handle, name: opts.handle.name, perm: 'granted' }; FL.link(S.c.id, opts.handle); }
  else FL.handleFor(S.c.id).then(async h => { if (h && S.c && !S.link.handle) { const p = await KIT.permission(h, false); S.link = { handle: h, name: h.name, perm: p === 'granted' ? 'granted' : 'prompt' }; renderTop(); } });
  LS.set('rcaft.last', S.c.id); persist(true);
  render();
}

/* ---------- saving ---------- */
let lsT, fileT;
function changed(noRender) {
  if (!S.c) return;
  S.c.updatedAt = nowISO(); invalidate();
  clearTimeout(lsT); lsT = setTimeout(() => persist(false), 350);
  if (!noRender) renderTop();
}
function snapshot() { return JSON.stringify(S.c); }
function pushUndo() { if (!S.c) return; S.undo.push(snapshot()); if (S.undo.length > 80) S.undo.shift(); S.redo = []; }
function undo() { if (!S.undo.length) return; S.redo.push(snapshot()); S.c = JSON.parse(S.undo.pop()); if (!S.c.nodes[S.sel]) S.sel = S.c.root; changed(); render(); }
function redo() { if (!S.redo.length) return; S.undo.push(snapshot()); S.c = JSON.parse(S.redo.pop()); if (!S.c.nodes[S.sel]) S.sel = S.c.root; changed(); render(); }
function fileText() { return JSON.stringify(Object.assign({}, S.c, { format: 'rca-fault-tree', version: 1, savedAt: nowISO(), app: 'Istec Training RCA Fault Tree' }), null, 1); }
function persist(quiet) {
  if (!S.c) return;
  LS.set('rcaft.case.' + S.c.id, S.c);
  KIT.KitRegistry.upsert({ tool: 'rcaft', id: S.c.id, title: S.c.meta.title, ref: S.c.meta.ref, status: S.c.meta.status, date: S.c.meta.date, updatedAt: S.c.updatedAt, file: S.link.handle && S.link.perm === 'granted' ? S.link.name : '', toolFile: 'RCA Fault Tree.html', example: !!S.c.example,
    actions: KIT.actionStats(S.c.actions, a => a.status === 'Open' || a.status === 'In progress', a => a.due) });
  if (S.link.handle && S.link.perm === 'granted') { clearTimeout(fileT); fileT = setTimeout(writeFile, quiet ? 0 : 600); }
}
async function writeFile() {
  if (!S.link.handle || S.link.perm !== 'granted') return;
  S.saving = true; renderTop();
  try { await FL.write(S.link.handle, fileText()); S.link.savedAt = nowISO(); }
  catch (e) { S.link.perm = 'prompt'; toast('Could not write to ' + S.link.name + '. Click Reconnect file.'); }
  S.saving = false; renderTop();
}
async function saveAs() {
  try {
    const r = await FL.saveAs(S.c.id, slug((S.c.meta.ref ? S.c.meta.ref + '-' : '') + S.c.meta.title) + '.rcaft.json', fileText());
    if (!r) return;
    if (r.handle) { S.link = { handle: r.handle, name: r.name, perm: 'granted', savedAt: nowISO() }; delete S.c.example; persist(true); toast('Saved to ' + r.name + '. Later changes are written to this file automatically.'); }
    else toast('Downloaded ' + r.name + '. This browser cannot link files: download again after changes.');
    renderTop();
  } catch (e) { toast('Could not save: ' + (e.message || e)); }
}
async function reconnect() {
  if (!S.link.handle) return;
  const p = await KIT.permission(S.link.handle, true);
  if (p === 'granted') { S.link.perm = 'granted'; await writeFile(); toast('Reconnected to ' + S.link.name + '.'); } else toast('Permission was not given. Changes stay in this browser.');
  renderTop();
}
function parseCase(text, name) {
  let o; try { o = JSON.parse(text); } catch (e) { toast(name + ' is not a valid file (not JSON).'); return null; }
  if (!o || o.format !== 'rca-fault-tree' || !o.nodes || !o.root) { toast(name + ' is not an RCA fault tree file.'); return null; }
  return o;
}
async function openFile() {
  try { const r = await FL.open(); if (!r) return; const c = parseCase(r.text, r.name); if (!c) return; delete c.example; load(c, { handle: r.handle }); toast('Opened ' + r.name + (r.handle ? '. Changes are saved to this file.' : '.')); }
  catch (e) { toast('Could not open the file: ' + (e.message || e)); }
}
function recentCases() {
  const out = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('rcaft.case.')) { const c = LS.get(k); if (c && c.meta) out.push({ id: c.id, title: c.meta.title, ref: c.meta.ref, updatedAt: c.updatedAt, example: c.example }); } } } catch (e) {}
  return out.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

/* ---------- tree edits ---------- */
const node = id => S.c.nodes[id];
function nextCode(kind) {
  const pre = kind === 'gate' ? 'G-' : kind === 'house' ? 'H-' : 'E-';
  let mx = 0; Object.values(S.c.nodes).forEach(n => { const m = (n.code || '').match(/^([GEH])-(\d+)$/); if (m && m[1] + '-' === pre) mx = Math.max(mx, +m[2]); });
  return pre + String(mx + 1).padStart(2, '0');
}
function addChild(pid, kind) {
  const p = node(pid); if (!p || !E.isGate(p)) return;
  pushUndo();
  const n = mkNode(kind, nextCode(kind), '');
  if (kind === 'house') { n.prob.src = 'manual'; n.prob.value = 1; n.status = 'unverified'; }
  S.c.nodes[n.id] = n; p.children.push(n.id); p.collapsed = false; S.sel = n.id; changed(); render(); focusLabel();
}
function removeBranch(id) {
  if (id === S.c.root) return;
  pushUndo();
  const ids = [id].concat(E.descendants(S.c, id)), p = E.parentOf(S.c, id);
  if (p) p.children = p.children.filter(k => k !== id);
  ids.forEach(k => delete S.c.nodes[k]);
  const orphan = S.c.actions.filter(a => ids.indexOf(a.target) >= 0).length;
  S.sel = p ? p.id : S.c.root; S.confirm = null; changed(); render();
  toast('Deleted ' + ids.length + ' element' + (ids.length > 1 ? 's' : '') + '.' + (orphan ? ' ' + orphan + ' action(s) are no longer linked.' : '') + ' Undo is available.');
}
function moveSibling(id, dir) {
  const p = E.parentOf(S.c, id); if (!p) return;
  const i = p.children.indexOf(id), j = i + dir; if (j < 0 || j >= p.children.length) return;
  pushUndo(); p.children.splice(i, 1); p.children.splice(j, 0, id); changed(); render();
}
function moveBranch(id, newParent) {
  if (!newParent || id === S.c.root || newParent === id || E.descendants(S.c, id).indexOf(newParent) >= 0) return;
  const np = node(newParent); if (!E.isGate(np)) return;
  pushUndo(); const p = E.parentOf(S.c, id); if (p) p.children = p.children.filter(k => k !== id);
  np.children.push(id); np.collapsed = false; changed(); render();
}
function convert(id, to) {
  const n = node(id); if (!n) return; pushUndo();
  if (to === 'gate') { n.kind = 'gate'; n.gate = 'OR'; n.prob = { src: 'none', item: '', value: null, unit: 'p', note: '', edited: false }; if (/^[EH]-/.test(n.code)) n.code = nextCode('gate'); }
  else { if ((n.children || []).length) { toast('Remove the inputs first.'); S.undo.pop(); return; } n.kind = to; n.gate = ''; if (/^G-/.test(n.code)) n.code = nextCode(to); }
  changed(); render();
}
function setProbSource(n, src) {
  n.prob.src = src; n.prob.item = ''; n.prob.edited = false;
  if (src === 'none') { n.prob.value = null; }
  else if (src === 'freq') n.prob.unit = 'f';
  else if (src !== 'manual' && src !== 'site') n.prob.unit = 'p';
}
function pickItem(n, id) {
  const it = E.libItem(S.c, id); n.prob.item = id || '';
  if (it) { n.prob.value = it.value; n.prob.unit = it.unit; n.prob.edited = false; }
}
function focusLabel() { setTimeout(() => { const t = $('#f-label'); if (t) { t.focus(); t.select(); } }, 30); }

/* ---------- rendering ---------- */
const TABS = [['tree', 'Fault tree'], ['hyp', 'Hypotheses & evidence'], ['results', 'Results'], ['library', 'Data library'], ['actions', 'Actions'], ['incident', 'Incident'], ['report', 'Report'], ['guide', 'User guide']];
function render() {
  if (!S.c) return;
  $('#app').innerHTML = `<header class="top" id="top"></header><nav class="tabs" id="tabs"></nav><div id="banners"></div><main id="main"></main>`;
  renderTop(); renderTabs();
  const v = { tree: treeHTML, hyp: hypHTML, results: resultsHTML, library: libraryHTML, actions: actionsHTML, incident: incidentHTML, report: reportHTML, guide: () => `<div class="page guide">${RCAGUIDE}</div>` }[S.tab];
  $('#main').innerHTML = v();
  if (S.tab === 'tree') mountCanvas();
  if (S.tab === 'report') $('#rpt').innerHTML = `<style>${X.REPORT_CSS}</style>` + X.reportBody(S.c, E.treeSVG(S.c, { noTitle: true, post: post() }));
}
function renderTabs() {
  const t = $('#tabs'); if (!t) return;
  const is = issues(), e = is.filter(i => i.sev === 'error').length, w = is.filter(i => i.sev === 'warning').length;
  t.innerHTML = TABS.map(([k, l]) => `<button class="tab${S.tab === k ? ' on' : ''}" data-act="tab" data-t="${k}">${l}${k === 'results' ? (e ? `<span class="count err">${e}</span>` : w ? `<span class="count warn">${w}</span>` : '<span class="count ok">✓</span>') : ''}</button>`).join('');
}
function renderTop() {
  const top = $('#top'); if (!top) return;
  const L = S.link;
  const pill = S.saving ? '<span class="pill">Saving…</span>' : L.handle && L.perm === 'granted' ? `<span class="pill ok" title="Every change is written to this file">Saved to ${esc(L.name)}</span>` : L.handle ? `<button class="btn sm" data-act="reconnect">Reconnect file</button>` : `<span class="pill warn" title="Kept in this browser only. Use File ▸ Save as to keep it on the USB stick.">Not saved to a file</span>`;
  top.innerHTML = `<div class="brand"><span class="co">Istec Training</span><span class="app">RCA Fault Tree</span></div><div class="case-name">${esc((S.c.meta.ref ? S.c.meta.ref + ' · ' : '') + (S.c.meta.title || 'Untitled'))}</div>${pill}<button class="btn sm" data-act="menu" aria-haspopup="true" aria-expanded="${S.menu}">File ▾</button>${S.menu ? menuHTML() : ''}`;
  const b = $('#banners'); if (b) b.innerHTML = bannersHTML();
}
function menuHTML() {
  const rec = recentCases().filter(r => r.id !== S.c.id).slice(0, 6);
  return `<div class="menu" role="menu">
    <button data-act="new">New fault tree</button><button data-act="open">Open file…</button><button data-act="saveAs">Save as… (link a file on the stick)</button><button data-act="backup">Download backup copy</button>
    <hr><span class="lbl">Export</span><button data-act="print">Print or save report as PDF</button><button data-act="docx">Word report (.docx)</button><button data-act="html">Report as web page (.html)</button><button data-act="svg">Tree picture (.svg)</button><button data-act="png">Tree picture (.png)</button><button data-act="csv">Hypotheses table (.csv)</button><button data-act="casebook">Storyline Casebook package (.json)</button>
    <hr><button data-act="example">Load the worked example</button>
    ${rec.length ? `<span class="lbl">On this computer</span>${rec.map(r => `<button data-act="recent" data-id="${esc(r.id)}"><span>${esc(r.ref ? r.ref + ' ' : '')}${esc(r.title || 'Untitled')}</span><span class="muted small">${esc((r.updatedAt || '').slice(0, 10))}</span></button>`).join('')}` : ''}
  </div>`;
}
function bannersHTML() {
  let s = '';
  if (S.handoff) s += `<div class="banner info">The dashboard asked to open <b>${esc(S.handoff.name)}</b>.<button class="btn sm primary" data-act="takeHandoff">Open ${esc(S.handoff.name)}</button><button class="btn sm" data-act="dropHandoff">Not now</button></div>`;
  if (S.c.example) s += `<div class="banner info"><b>Worked example</b> (fictional tank overfill). Edits stay in this browser. Use File ▸ New fault tree to start your own, or File ▸ Save as to keep a copy.</div>`;
  if (S.link.handle && S.link.perm !== 'granted') s += `<div class="banner warn">This tree is linked to <b>${esc(S.link.name)}</b>, but the browser needs permission again before it can write to it.<button class="btn sm primary" data-act="reconnect">Reconnect file</button></div>`;
  return s;
}

/* ---------- tree tab ---------- */
function treeHTML() {
  const pr = E.evaluate(S.c, 'prior').top, ev = E.evaluate(S.c, 'evidence').top;
  return `<div class="bench"><div class="canvas-wrap"><svg id="cv" role="img" aria-label="Fault tree"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="var(--grid)"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)"/><g id="vp"></g></svg>
    <div class="toolbar"><div class="topcard">Top event · before evidence <b>${E.fmt(pr.v, pr.u)}</b> · given evidence <b>${E.fmt(ev.v, ev.u)}</b></div>
      <div class="grp"><button class="btn sm${S.show === 'evidence' ? ' on' : ''}" data-act="show" data-v="evidence" title="Ruled out = 0, confirmed = 1">Given evidence</button><button class="btn sm${S.show === 'prior' ? ' on' : ''}" data-act="show" data-v="prior" title="Screening values for every hypothesis">Before evidence</button><button class="btn sm${S.show === 'none' ? ' on' : ''}" data-act="show" data-v="none">No values</button></div>
      <span class="spacer"></span>
      <div class="grp"><button class="btn sm" data-act="undo"${S.undo.length ? '' : ' disabled'}>Undo</button><button class="btn sm" data-act="redo"${S.redo.length ? '' : ' disabled'}>Redo</button></div>
      <div class="grp"><button class="btn sm" data-act="zoom" data-f="0.833" aria-label="Zoom out">−</button><button class="btn sm" data-act="zoom" data-f="1.2" aria-label="Zoom in">+</button><button class="btn sm" data-act="fit">Fit</button></div></div>
    <div class="hint">Click a box to edit it · drag the background or Shift+scroll to pan · scroll wheel or pinch to zoom · the coloured stripe shows the hypothesis status</div></div>
    <aside class="inspector" id="insp"></aside></div>`;
}
function issueMap() { const m = {}; issues().forEach(i => i.ids.forEach(id => { m[id] = m[id] || { error: 0, warning: 0 }; if (i.sev !== 'tip') m[id][i.sev]++; })); Object.keys(m).forEach(k => { if (!m[k].error && !m[k].warning) delete m[k]; }); return m; }
function renderTree() {
  const vp = $('#vp'); if (!vp) return;
  const r = E.render(S.c, { interactive: true, sel: S.sel, issues: issueMap(), show: S.show, post: S.show === 'none' ? null : post() });
  vp.innerHTML = r.body; S.bbox = r.bbox; applyView();
}
function applyView() { const vp = $('#vp'); if (vp) vp.setAttribute('transform', `translate(${S.view.x},${S.view.y}) scale(${S.view.k})`); }
function fit() {
  const svg = $('#cv'); if (!svg || !S.bbox) return;
  const b = S.bbox, W = svg.clientWidth || 900, H = svg.clientHeight || 600;
  const k = Math.max(0.2, Math.min(1.2, (W - 40) / Math.max(1, b.w), (H - 110) / Math.max(1, b.h)));
  S.view = { k, x: (W - b.w * k) / 2 - b.x * k, y: 60 }; applyView();
}
function zoomAt(f, cx, cy) { const k = Math.max(0.15, Math.min(2.5, S.view.k * f)); S.view.x = cx - (cx - S.view.x) * (k / S.view.k); S.view.y = cy - (cy - S.view.y) * (k / S.view.k); S.view.k = k; applyView(); }
let drag = null;
function mountCanvas() {
  const svg = $('#cv');
  renderTree(); renderInspector();
  if (S.fitPending) { S.fitPending = false; requestAnimationFrame(fit); }
  svg.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    const g = ev.target.closest('.ftn');
    if (g) { S.sel = g.getAttribute('data-id'); S.confirm = null; renderTree(); renderInspector(); return; }
    drag = { sx: ev.clientX, sy: ev.clientY, vx: S.view.x, vy: S.view.y }; svg.classList.add('panning');
    try { svg.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  svg.addEventListener('pointermove', ev => { if (!drag) return; S.view.x = drag.vx + ev.clientX - drag.sx; S.view.y = drag.vy + ev.clientY - drag.sy; applyView(); });
  const end = () => { drag = null; svg.classList.remove('panning'); };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  svg.addEventListener('wheel', ev => { ev.preventDefault(); const r = svg.getBoundingClientRect(); if (ev.shiftKey) { S.view.x -= ev.deltaX; S.view.y -= ev.deltaY; applyView(); return; } const d = ev.deltaY * (ev.deltaMode === 1 ? 33 : ev.deltaMode === 2 ? 400 : 1); zoomAt(Math.exp(ev.ctrlKey ? -d * 0.01 : -Math.max(-100, Math.min(100, d)) * 0.0015), ev.clientX - r.left, ev.clientY - r.top); }, { passive: false }); // wheel zooms at the pointer, pinch = ctrl+wheel, Shift+scroll pans
  svg.addEventListener('dblclick', ev => { if (ev.target.closest('.ftn')) focusLabel(); });
}
function libOptions(n) {
  const src = n.prob.src;
  const items = src === 'site' ? S.c.customLib : LIB.ITEMS.filter(i => i.src === src);
  return `<option value="">Choose an item…</option>` + items.map(i => { const it = E.libItem(S.c, i.id); return `<option value="${esc(i.id)}"${n.prob.item === i.id ? ' selected' : ''}>${esc(i.name)} — ${E.fmt(it.value, it.unit)}</option>`; }).join('');
}
function renderInspector() {
  const el = $('#insp'); if (!el) return;
  const n = node(S.sel) || node(S.c.root); S.sel = n.id;
  const isG = E.isGate(n), p = E.parentOf(S.c, n.id), ks = E.kids(S.c, n);
  const evd = E.evaluate(S.c, 'evidence').val(n.id), pri = E.evaluate(S.c, 'prior').val(n.id), po = post()[n.id];
  const it = E.libItem(S.c, n.prob.item);
  const gates = Object.values(S.c.nodes).filter(m => E.isGate(m) && m.id !== n.id && E.descendants(S.c, n.id).indexOf(m.id) < 0 && (!p || m.id !== p.id));
  let prob = '';
  if (!isG) {
    const srcOpts = LIB.SOURCES.map(s => `<option value="${s.k}"${n.prob.src === s.k ? ' selected' : ''}${s.k === 'site' && !S.c.customLib.length ? ' disabled' : ''}>${esc(s.name)}</option>`).join('');
    const lib = n.prob.src !== 'none' && n.prob.src !== 'manual';
    prob = `<div class="box"><span class="lbl">Probability (optional)</span>
      <label class="field"><span>Source</span><select id="f-src" data-nf="src">${srcOpts}</select></label>
      ${lib ? `<label class="field"><span>Library item</span><select id="f-item" data-nf="item">${libOptions(n)}</select></label>` : ''}
      ${n.prob.src !== 'none' ? `<div class="row" style="align-items:flex-end"><label class="field" style="flex:1"><span>Value used${E.unitOf(S.c, n) === 'f' ? ' (per year)' : ' (probability)'}</span><input id="f-val" data-nf="value" type="text" inputmode="decimal" value="${n.prob.value == null ? '' : esc(n.prob.value)}" placeholder="e.g. 0.01 or 1e-3"></label>
        ${n.prob.src === 'manual' ? `<label class="field" style="width:130px"><span>Unit</span><select id="f-unit" data-nf="unit"><option value="p"${n.prob.unit !== 'f' ? ' selected' : ''}>Probability</option><option value="f"${n.prob.unit === 'f' ? ' selected' : ''}>Frequency /yr</option></select></label>` : ''}</div>` : ''}
      ${it ? `<div class="libnote${n.prob.edited ? ' edited' : ''}">Library value <b>${E.fmt(it.value, it.unit)}</b>${it.overridden ? ' (case override of ' + E.fmt(it.def, it.unit) + ')' : ''} · range ${esc(it.range || '–')} · ${esc(it.ref)}${it.note ? '<br>' + esc(it.note) : ''}${n.prob.edited ? `<br><b>Edited for this event.</b> <button class="btn sm" data-act="resetVal">Use library value</button>` : ''}</div>` : ''}
      ${n.prob.src !== 'none' ? `<label class="field"><span>Value note (source, why edited)</span><input id="f-pnote" data-nf="pnote" value="${esc(n.prob.note || '')}"></label>` : ''}
    </div>`;
  }
  el.innerHTML = `<h3>${esc(n.code)} · ${esc(isG ? (n.id === S.c.root ? 'Top event' : 'Intermediate event') : E.KINDS[n.kind])}</h3>
    <div class="row"><label class="field" style="width:110px"><span>Code</span><input id="f-code" data-nf="code" value="${esc(n.code)}"></label>
      ${isG ? `<label class="field" style="flex:1"><span>Gate</span><select id="f-gate" data-nf="gate">${Object.keys(E.GATES).map(g => `<option value="${g}"${n.gate === g ? ' selected' : ''}>${esc(E.GATES[g])}</option>`).join('')}</select></label>${n.gate === 'VOTE' ? `<label class="field" style="width:70px"><span>k</span><input id="f-k" data-nf="k" type="number" min="1" value="${esc(n.k || 2)}"></label>` : ''}`
        : `<label class="field" style="flex:1"><span>Event type</span><select id="f-kind" data-nf="kind">${['basic', 'undeveloped', 'house'].map(k => `<option value="${k}"${n.kind === k ? ' selected' : ''}>${esc(E.KINDS[k])}</option>`).join('')}</select></label>`}</div>
    <label class="field"><span>Description</span><textarea id="f-label" data-nf="label" rows="3">${esc(n.label)}</textarea></label>
    <div class="box"><span class="lbl">Hypothesis status</span>
      <div class="seg" role="group" aria-label="Status">${Object.keys(E.STATUS).map(k => `<button class="${k}${n.status === k ? ' on' : ''}" data-act="status" data-v="${k}" aria-pressed="${n.status === k}">${E.STATUS[k].name}</button>`).join('')}</div>
      <label class="field"><span>Evidence</span><textarea id="f-evidence" data-nf="evidence" rows="2" placeholder="What confirms or rules this out (records, photos, tests, interviews)">${esc(n.evidence)}</textarea></label>
      ${n.status === 'unverified' || n.status === 'likely' ? `<label class="field"><span>How to test it</span><textarea id="f-test" data-nf="test" rows="2">${esc(n.test)}</textarea></label><div class="row"><label class="field" style="flex:1"><span>Test owner</span><input id="f-towner" data-nf="testOwner" value="${esc(n.testOwner)}"></label><label class="field" style="width:150px"><span>Due</span><input id="f-tdue" data-nf="testDue" type="date" value="${esc(n.testDue)}"></label></div>` : ''}
    </div>
    ${n.id !== S.c.root ? `<div class="box"><span class="lbl">Cause classification</span><div class="row"><label class="field" style="flex:1"><span>Class</span><select id="f-cause" data-nf="cause">${Object.keys(E.CAUSE).map(k => `<option value="${k}"${(n.cause || '') === k ? ' selected' : ''}>${esc(E.CAUSE[k])}</option>`).join('')}</select></label><label class="field" style="flex:1"><span>Category</span><select id="f-cat" data-nf="category"><option value="">–</option>${E.CATEGORIES.map(k => `<option${n.category === k ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select></label></div>
      ${n.cause ? `<label class="field"><span>Why did it occur? (underlying reason)</span><textarea id="f-why" data-nf="why" rows="2">${esc(n.why)}</textarea></label>` : ''}</div>` : ''}
    ${prob}
    <div class="libnote">${isG || n.prob.src !== 'none' || n.kind === 'house' ? `Before evidence <b>${E.fmt(pri.v, pri.u)}</b> · given evidence <b>${E.fmt(evd.v, evd.u)}</b>` : 'Not quantified.'}${po != null && !isNaN(po) && n.id !== S.c.root && n.status !== 'ruledout' && n.status !== 'confirmed' ? ` · contributed, given the incident: <b>${Math.round(po * 100)} %</b>` : ''}</div>
    ${isG ? `<div class="box"><span class="lbl">Inputs (${ks.length})</span><div class="kids">${ks.map((k, i) => `<div class="kid"><span class="st st-${k.status}">${esc(E.STATUS[k.status].name)}</span><span>${esc(k.code)} ${esc(k.label || '(no description)')}</span><button class="xbtn" data-act="up" data-id="${esc(k.id)}" aria-label="Move left"${i ? '' : ' disabled'}>←</button><button class="xbtn" data-act="down" data-id="${esc(k.id)}" aria-label="Move right"${i < ks.length - 1 ? '' : ' disabled'}>→</button><button class="xbtn" data-act="go" data-id="${esc(k.id)}" aria-label="Select">↗</button></div>`).join('') || '<p class="small muted">No inputs yet.</p>'}</div>
      <div class="quick"><button class="btn sm primary" data-act="add" data-k="gate">+ Gate</button><button class="btn sm primary" data-act="add" data-k="basic">+ Basic event</button><button class="btn sm" data-act="add" data-k="undeveloped">+ Undeveloped</button><button class="btn sm" data-act="add" data-k="house">+ Condition</button></div>
      <div class="quick">${ks.length ? `<button class="btn sm" data-act="collapse">${n.collapsed ? 'Expand branch' : 'Collapse branch'}</button>` : `<button class="btn sm" data-act="convert" data-k="basic">Make it a basic event</button>`}</div></div>`
      : `<div class="quick"><button class="btn sm" data-act="convert" data-k="gate">Develop further (make it a gate)</button></div>`}
    ${n.id !== S.c.root ? `<div class="row">${gates.length ? `<label class="field" style="flex:1"><span>Move this branch under</span><select id="f-move" data-act-change="move"><option value="">Choose a gate…</option>${gates.map(g => `<option value="${esc(g.id)}">${esc(g.code)} ${esc((g.label || '').slice(0, 50))}</option>`).join('')}</select></label>` : ''}</div>
      ${S.confirm === n.id ? `<div class="confirm">Delete ${esc(n.code)}${ks.length ? ' and the ' + E.descendants(S.c, n.id).length + ' element(s) under it' : ''}? <button class="btn sm danger" data-act="delYes">Delete</button><button class="btn sm" data-act="delNo">Keep</button></div>` : `<div class="quick"><button class="btn sm danger" data-act="del">Delete${ks.length ? ' branch' : ''}</button></div>`}` : ''}
    <label class="field"><span>Notes</span><textarea id="f-notes" data-nf="notes" rows="2">${esc(n.notes)}</textarea></label>`;
}

/* ---------- hypotheses tab ---------- */
function hypHTML() {
  const rows = E.walk(S.c).filter(r => S.hFilter === 'all' || r.n.status === S.hFilter), P = post();
  const cnt = k => Object.values(S.c.nodes).filter(n => n.status === k).length;
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Evidence</span><h1>Hypotheses and evidence</h1><p class="muted">Every gate and event is a hypothesis. Confirm or rule it out with evidence; plan a test for those still open.</p></div>
    <div class="row">${[['all', 'All', Object.keys(S.c.nodes).length]].concat(Object.keys(E.STATUS).map(k => [k, E.STATUS[k].name, cnt(k)])).map(([k, l, n]) => `<button class="btn sm${S.hFilter === k ? ' primary' : ''}" data-act="hfilter" data-f="${k}">${l} ${n}</button>`).join('')}</div></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Code</th><th style="min-width:240px">Cause / event</th><th>Status</th><th style="min-width:220px">Evidence</th><th style="min-width:200px">Test (open items)</th><th>Owner</th><th>Due</th><th>Given incident</th></tr></thead><tbody>
    ${rows.map(({ n, depth }) => `<tr data-nid="${esc(n.id)}"><td class="mono">${esc(n.code)}</td><td style="padding-left:${8 + depth * 14}px">${esc(n.label)}<div class="small muted">${E.isGate(n) ? esc(n.gate) + ' gate' : esc(E.KINDS[n.kind])}${n.cause ? ' · ' + esc(E.CAUSE[n.cause]) : ''}</div></td>
      <td><select id="h-st-${esc(n.id)}" data-hf="status">${Object.keys(E.STATUS).map(k => `<option value="${k}"${n.status === k ? ' selected' : ''}>${E.STATUS[k].name}</option>`).join('')}</select></td>
      <td><textarea id="h-ev-${esc(n.id)}" data-hf="evidence" rows="2">${esc(n.evidence)}</textarea></td>
      <td><textarea id="h-te-${esc(n.id)}" data-hf="test" rows="2">${esc(n.test)}</textarea></td>
      <td><input id="h-ow-${esc(n.id)}" data-hf="testOwner" value="${esc(n.testOwner)}"></td><td><input id="h-du-${esc(n.id)}" data-hf="testDue" type="date" value="${esc(n.testDue)}"></td>
      <td class="mono">${P[n.id] != null && !isNaN(P[n.id]) && n.status !== 'confirmed' && n.status !== 'ruledout' ? Math.round(P[n.id] * 100) + ' %' : ''}</td></tr>`).join('')}
    </tbody></table></div></div>`;
}

/* ---------- results tab ---------- */
function resultsHTML() {
  const is = issues(), pr = E.evaluate(S.c, 'prior').top, ev = E.evaluate(S.c, 'evidence').top, P = post(), cs = E.rankCutSets(S.c);
  const all = Object.values(S.c.nodes), cnt = k => all.filter(n => n.status === k).length;
  const events = all.filter(n => !E.isGate(n)), quant = events.filter(n => n.kind === 'house' || (n.prob.src !== 'none' && !isNaN(E.rawValue(S.c, n))));
  const open = E.walk(S.c).map(r => r.n).filter(n => n.id !== S.c.root && (n.status === 'unverified' || n.status === 'likely')).sort((a, b) => (isNaN(P[b.id]) ? -1 : P[b.id] || 0) - (isNaN(P[a.id]) ? -1 : P[a.id] || 0));
  const mx = Math.max(0.0001, ...open.map(n => isNaN(P[n.id]) ? 0 : P[n.id] || 0));
  const label = id => { const n = node(id); return `<span class="st st-${n.status}">${E.STATUS[n.status].name}</span> <b>${esc(n.code)}</b> ${esc(n.label)}`; };
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Analysis</span><h1>Results</h1><p class="muted">Probabilities are optional. They rank the hypotheses still open; the evidence decides what happened.</p></div></div>
    <div class="stats"><div class="stat"><b>${E.fmt(pr.v, pr.u)}</b><span>top event before evidence</span></div><div class="stat"><b>${E.fmt(ev.v, ev.u)}</b><span>top event given evidence</span></div>
      ${Object.keys(E.STATUS).map(k => `<div class="stat"><b>${cnt(k)}</b><span>${E.STATUS[k].name.toLowerCase()}</span></div>`).join('')}<div class="stat"><b>${quant.length}/${events.length}</b><span>events quantified</span></div></div>
    <section class="panel"><h2>Consistency check</h2>${!is.filter(i => i.sev !== 'tip').length ? '<div class="allclear">No logic or evidence inconsistencies found.</div>' : ''}
      <div class="issues" style="margin-top:8px">${is.map(i => `<div class="issue ${i.sev}"><span class="sev">${i.sev}</span><span>${esc(i.msg)}</span>${i.ids.length ? `<button class="btn sm" data-act="showNode" data-id="${esc(i.ids[0])}">Show</button>` : '<span></span>'}</div>`).join('')}</div></section>
    <section class="panel"><h2>Open hypotheses ranked by likelihood, given the incident</h2><p class="small muted" style="margin-bottom:8px">P(this cause contributed | the top event happened and the evidence so far). Test the high ones first; a low value is not proof that something did not happen.</p>
      ${open.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Cause</th><th style="width:30%">Given the incident</th><th>Planned test</th></tr></thead><tbody>${open.map(n => `<tr><td>${label(n.id)}</td><td>${isNaN(P[n.id]) || P[n.id] == null ? '<span class="muted small">needs values in its branch</span>' : `<div class="row" style="flex-wrap:nowrap"><div class="bar" style="flex:1"><i style="width:${(P[n.id] / mx) * 100}%"></i></div><span class="mono">${Math.round(P[n.id] * 100)} %</span></div>`}</td><td class="small">${esc(n.test || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No open hypotheses.</p>'}</section>
    <section class="panel"><h2>Credible causal combinations (minimal cut sets)</h2><p class="small muted" style="margin-bottom:8px">Each combination of causes is enough on its own to produce the top event. ${cs.eliminated} combination(s) eliminated by ruled-out causes${cs.truncated ? '; the list was truncated' : ''}.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Causes</th><th>Status</th><th>Before evidence</th><th>Given evidence</th><th>Share</th></tr></thead><tbody>
      ${cs.rows.slice(0, 40).map((r, i) => `<tr><td class="mono">${i + 1}</td><td>${r.ids.map(label).join('<br>')}</td><td>${esc(r.status)}</td><td class="mono">${E.fmt(r.prior.v, r.prior.u)}</td><td class="mono">${E.fmt(r.evid.v, r.evid.u)}</td><td class="mono">${isNaN(r.share) ? '—' : Math.round(r.share * 100) + ' %'}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No credible combinations: every path is ruled out, or the tree is not developed.</td></tr>'}</tbody></table></div></section>
  </div>`;
}

/* ---------- library tab ---------- */
function libraryHTML() {
  const used = id => Object.values(S.c.nodes).filter(n => n.prob && n.prob.item === id).length;
  const sec = s => {
    const items = LIB.ITEMS.filter(i => i.src === s.k);
    return `<section class="panel"><h2>${esc(s.name)}</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th style="min-width:280px">Item</th><th>Default</th><th>Value for this case</th><th>Range</th><th>Source</th><th>Used</th></tr></thead><tbody>
      ${items.map(i => { const it = E.libItem(S.c, i.id); return `<tr><td>${esc(i.name)}${i.note ? `<div class="small muted">${esc(i.note)}</div>` : ''}</td><td class="mono">${E.fmt(i.value, i.unit)}</td><td><div class="row" style="flex-wrap:nowrap"><input id="lib-${esc(i.id)}" data-lib="${esc(i.id)}" value="${it.overridden ? esc(it.value) : ''}" placeholder="${esc(i.value)}" style="width:110px">${it.overridden ? `<button class="xbtn" data-act="libReset" data-id="${esc(i.id)}" title="Back to default">↺</button>` : ''}</div></td><td class="small mono">${esc(i.range)}</td><td class="small">${esc(i.ref)}</td><td class="mono">${used(i.id) || ''}</td></tr>`; }).join('')}</tbody></table></div></section>`;
  };
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Reference data</span><h1>Data library</h1><p class="muted">Typical generic screening values. Override a value for this case here (events that use the item and have not been edited individually follow the change), or edit the value on a single event in the tree. Record the reason in the event’s value note.</p></div></div>
    <section class="panel"><h2>Site data (custom items)</h2><p class="small muted" style="margin-bottom:8px">Add your own values, for example from the site’s CMMS failure history or proof-test records. Choose “Site data” as the source on an event to use them.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Item</th><th>Value</th><th>Unit</th><th>Source / reference</th><th></th></tr></thead><tbody>
      ${S.c.customLib.map((i, k) => `<tr data-ci="${k}"><td><input id="cl-n-${k}" data-cl="name" value="${esc(i.name)}"></td><td><input id="cl-v-${k}" data-cl="value" value="${esc(i.value)}" style="width:110px"></td><td><select id="cl-u-${k}" data-cl="unit"><option value="p"${i.unit !== 'f' ? ' selected' : ''}>Probability</option><option value="f"${i.unit === 'f' ? ' selected' : ''}>Frequency /yr</option></select></td><td><input id="cl-r-${k}" data-cl="ref" value="${esc(i.ref)}"></td><td><button class="xbtn" data-act="clDel" data-i="${k}" aria-label="Delete">×</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">No site items yet.</td></tr>'}
      </tbody></table></div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="clAdd">Add site item</button><button class="btn sm" data-act="clSave" title="Keep these items in this browser for new fault trees">Save as my default site items</button><button class="btn sm" data-act="clLoad">Add my default site items</button></div></section>
    ${LIB.SOURCES.filter(s => ['ipl', 'hep', 'equip', 'freq'].indexOf(s.k) >= 0).map(sec).join('')}
    <section class="panel"><h3>References</h3><ul class="small">${Object.keys(LIB.REFS).map(k => `<li><b>${esc(k)}</b>: ${esc(LIB.REFS[k])}</li>`).join('')}</ul><p class="small muted" style="margin-top:6px">These are order-of-magnitude values for ranking hypotheses in an investigation. They are not design data and do not replace site-specific reliability data.</p></section></div>`;
}

/* ---------- actions tab ---------- */
function actionsHTML() {
  const targets = E.walk(S.c).map(r => r.n).filter(n => n.id !== S.c.root && n.status !== 'ruledout');
  const roots = targets.filter(n => n.cause === 'root'), unc = roots.filter(n => !S.c.actions.some(a => a.target === n.id && a.status !== 'Cancelled'));
  const ctl = ['Elimination', 'Substitution', 'Engineering', 'Administrative', 'PPE'];
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Corrective actions</span><h1>Actions</h1><p class="muted">Link each action to the cause it removes. Prefer actions higher in the hierarchy of control.</p></div><button class="btn primary" data-act="addAction">Add action</button></div>
    ${unc.length ? `<section class="panel"><h3>Root causes without an action (${unc.length})</h3><div class="kids">${unc.map(n => `<div class="kid"><span>${esc(n.code)} ${esc(n.label)}</span><button class="btn sm" data-act="addActionFor" data-id="${esc(n.id)}">Add action</button></div>`).join('')}</div></section>` : roots.length ? '<div class="allclear">Every root cause has at least one action.</div>' : ''}
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th style="min-width:200px">Addresses</th><th style="min-width:260px">Action</th><th>Control</th><th>Owner</th><th>Due</th><th>Priority</th><th>Status</th><th></th></tr></thead><tbody>
    ${S.c.actions.map((a, i) => `<tr data-ai="${i}"><td class="mono">${i + 1}</td><td><select id="a-t-${i}" data-af="target"><option value="">Not linked</option>${targets.map(n => `<option value="${esc(n.id)}"${a.target === n.id ? ' selected' : ''}>${esc(n.code)} ${esc((n.label || '').slice(0, 60))}${n.cause === 'root' ? ' [root cause]' : ''}</option>`).join('')}</select></td>
      <td><textarea id="a-x-${i}" data-af="text" rows="2">${esc(a.text)}</textarea><input id="a-c-${i}" data-af="closeNote" placeholder="Close-out note / evidence" value="${esc(a.closeNote || '')}" style="margin-top:4px"></td>
      <td><select id="a-k-${i}" data-af="control">${ctl.map(k => `<option${a.control === k ? ' selected' : ''}>${k}</option>`).join('')}</select></td>
      <td><input id="a-o-${i}" data-af="owner" value="${esc(a.owner)}"></td><td><input id="a-d-${i}" data-af="due" type="date" value="${esc(a.due)}"></td>
      <td><select id="a-p-${i}" data-af="priority">${['High', 'Medium', 'Low'].map(k => `<option${a.priority === k ? ' selected' : ''}>${k}</option>`).join('')}</select></td>
      <td><select id="a-s-${i}" data-af="status">${['Open', 'In progress', 'Done', 'Cancelled'].map(k => `<option${a.status === k ? ' selected' : ''}>${k}</option>`).join('')}</select></td>
      <td><button class="xbtn" data-act="actDel" data-i="${i}" aria-label="Delete action">×</button></td></tr>`).join('') || '<tr><td colspan="9" class="muted">No actions yet.</td></tr>'}</tbody></table></div></div>`;
}

/* ---------- incident tab ---------- */
function incidentHTML() {
  const m = S.c.meta;
  const f = (k, l, t, wide) => `<label class="field${wide ? ' wide' : ''}"><span>${l}</span><input id="m-${k}" data-meta="${k}" type="${t || 'text'}" value="${esc(m[k] || '')}"></label>`;
  const a = (k, l, r, ph) => `<label class="field wide"><span>${l}</span><textarea id="m-${k}" data-meta="${k}" rows="${r || 4}" placeholder="${esc(ph || '')}">${esc(m[k] || '')}</textarea></label>`;
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Case details</span><h1>Incident</h1></div></div>
    <section class="panel"><div class="form">${f('title', 'Title', 'text', true)}${f('ref', 'Reference')}${f('date', 'Date', 'date')}${f('time', 'Time')}${f('location', 'Location')}${f('site', 'Site / business unit')}${f('client', 'Client / company')}${f('investigator', 'Lead investigator')}
      <label class="field"><span>Status</span><select id="m-status" data-meta="status">${['Draft', 'In review', 'Final'].map(s => `<option${m.status === s ? ' selected' : ''}>${s}</option>`).join('')}</select></label>
      ${f('team', 'Team (separate names with ;)', 'text', true)}${a('description', 'Description of the incident', 5)}${a('conclusion', 'Conclusion (what happened and why)', 5)}${a('lessons', 'Lessons learned (one per line)', 3)}</div></section></div>`;
}

/* ---------- report tab ---------- */
function reportHTML() {
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Output</span><h1>Report</h1><p class="muted">Built from the incident details, the tree, the evidence, the quantification and the actions.</p></div>
    <div class="row"><button class="btn primary" data-act="print">Print or save as PDF</button><button class="btn" data-act="docx">Word (.docx)</button><button class="btn" data-act="html">Web page (.html)</button><button class="btn" data-act="png">Tree (.png)</button><button class="btn" data-act="csv">Table (.csv)</button></div></div>
    <div class="rpt-frame" id="rpt"></div></div>`;
}

/* ---------- exports ---------- */
const base = () => slug((S.c.meta.ref ? S.c.meta.ref + '-' : '') + S.c.meta.title);
function svgToPng(svg) {
  return new Promise((res, rej) => {
    const m = svg.match(/width="(\d+)" height="(\d+)"/), w = +m[1], h = +m[2], k = Math.min(2, 9000 / w, 9000 / h), img = new Image();
    img.onload = () => { try { const cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k); const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height); cv.toBlob(b => b ? b.arrayBuffer().then(ab => res({ blob: b, bytes: new Uint8Array(ab), w: cv.width, h: cv.height })) : rej(new Error('png')), 'image/png'); } catch (e) { rej(e); } };
    img.onerror = () => rej(new Error('svg')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
const EXP = {
  backup: () => KIT.download(base() + '.rcaft.json', fileText(), 'application/json'),
  svg: () => KIT.download(base() + '-tree.svg', E.treeSVG(S.c, { post: post() }), 'image/svg+xml'),
  png: async () => { try { const p = await svgToPng(E.treeSVG(S.c, { post: post() })); KIT.download(base() + '-tree.png', p.blob); } catch (e) { toast('The PNG could not be drawn. Use the SVG.'); } },
  csv: () => KIT.download(base() + '-hypotheses.csv', X.csv(S.c), 'text/csv'),
  html: () => KIT.download(base() + '-report.html', X.reportHTML(S.c, E.treeSVG(S.c, { noTitle: true, post: post() })), 'text/html'),
  casebook: () => KIT.download(base() + '.casebook-case.json', JSON.stringify(X.casebookPackage(S.c), null, 1), 'application/json'),
  docx: async () => { toast('Building the Word document…'); let t = null; try { t = await svgToPng(E.treeSVG(S.c, { noTitle: true, post: post() })); } catch (e) {} KIT.download(base() + '-report.docx', new Blob([X.docx(S.c, t)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })); },
  print: () => { const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f); f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { toast('Printing is not available. Download the web page and print it.'); } setTimeout(() => f.remove(), 60000); }; f.srcdoc = X.reportHTML(S.c, E.treeSVG(S.c, { noTitle: true, post: post() })); }
};

/* ---------- events ---------- */
const A = Object.assign({
  tab: d => { S.tab = d.t; S.menu = false; render(); },
  menu: () => { S.menu = !S.menu; renderTop(); },
  new: () => { S.menu = false; load(newCase()); S.tab = 'incident'; render(); setTimeout(() => { const t = $('#m-title'); if (t) { t.focus(); t.select(); } }, 30); },
  open: () => { S.menu = false; renderTop(); openFile(); },
  saveAs: () => { S.menu = false; renderTop(); saveAs(); },
  reconnect: () => reconnect(),
  example: () => { S.menu = false; const c = exampleCase(); load(c); },
  recent: d => { S.menu = false; const c = LS.get('rcaft.case.' + d.id); if (c) load(c); },
  takeHandoff: async () => { const h = S.handoff; S.handoff = null; if (!h) return; const p = await KIT.permission(h.handle, true); if (p !== 'granted') { toast('Permission was not given.'); renderTop(); return; } try { const f = await h.handle.getFile(); const c = parseCase(await f.text(), f.name); if (c) { delete c.example; load(c, { handle: h.handle }); toast('Opened ' + f.name + '.'); } } catch (e) { toast('Could not read ' + h.name + '.'); } },
  dropHandoff: () => { S.handoff = null; renderTop(); },
  show: d => { S.show = d.v; render(); },
  undo, redo,
  zoom: d => { const s = $('#cv'); zoomAt(+d.f, s.clientWidth / 2, s.clientHeight / 2); },
  fit: () => fit(),
  status: d => { const n = node(S.sel); pushUndo(); n.status = d.v; changed(); renderTree(); renderInspector(); renderTabs(); refreshTopcard(); },
  add: d => addChild(S.sel, d.k),
  up: d => moveSibling(d.id, -1), down: d => moveSibling(d.id, 1),
  go: d => { S.sel = d.id; renderTree(); renderInspector(); },
  collapse: () => { const n = node(S.sel); n.collapsed = !n.collapsed; changed(); renderTree(); renderInspector(); },
  convert: d => convert(S.sel, d.k),
  del: () => { const n = node(S.sel); if ((n.children || []).length) { S.confirm = n.id; renderInspector(); } else removeBranch(n.id); },
  delYes: () => removeBranch(S.sel), delNo: () => { S.confirm = null; renderInspector(); },
  resetVal: () => { const n = node(S.sel); pushUndo(); pickItem(n, n.prob.item); changed(); renderTree(); renderInspector(); refreshTopcard(); },
  showNode: d => { S.sel = d.id; S.tab = 'tree'; render(); },
  hfilter: d => { S.hFilter = d.f; render(); },
  libReset: d => { pushUndo(); setOverride(d.id, null); render(); },
  clAdd: () => { pushUndo(); S.c.customLib.push({ src: 'site', id: uid('site-'), name: 'Site item', value: 0.01, unit: 'p', range: '', ref: 'Site data', note: '' }); changed(); render(); },
  clDel: d => { pushUndo(); const it = S.c.customLib[+d.i]; S.c.customLib.splice(+d.i, 1); Object.values(S.c.nodes).forEach(n => { if (n.prob.item === it.id) n.prob.item = ''; }); changed(); render(); },
  clSave: () => { LS.set('rcaft.siteLib', S.c.customLib); toast('Saved ' + S.c.customLib.length + ' site item(s) as your defaults in this browser.'); },
  clLoad: () => { const L = LS.get('rcaft.siteLib') || []; let n = 0; L.forEach(i => { if (!S.c.customLib.some(x => x.id === i.id)) { S.c.customLib.push(i); n++; } }); changed(); render(); toast(n + ' site item(s) added.'); },
  addAction: () => addAction(''), addActionFor: d => addAction(d.id),
  actDel: d => { pushUndo(); S.c.actions.splice(+d.i, 1); changed(); render(); }
}, EXP);
function addAction(target) { pushUndo(); S.c.actions.push({ id: uid('a'), target, text: '', owner: '', due: '', priority: 'Medium', control: 'Engineering', status: 'Open', closeNote: '' }); changed(); S.tab = 'actions'; render(); const t = $('#a-x-' + (S.c.actions.length - 1)); if (t) t.focus(); }
function setOverride(id, v) {
  const before = E.libItem(S.c, id);
  if (v == null || v === '' || isNaN(+v)) delete S.c.libOverrides[id]; else S.c.libOverrides[id] = +v;
  const after = E.libItem(S.c, id);
  Object.values(S.c.nodes).forEach(n => { if (n.prob.item === id && !n.prob.edited) n.prob.value = after.value; });
  changed();
  return before;
}
function refreshTopcard() {
  const tc = $('.topcard'); if (!tc) return;
  const pr = E.evaluate(S.c, 'prior').top, ev = E.evaluate(S.c, 'evidence').top;
  tc.innerHTML = `Top event · before evidence <b>${E.fmt(pr.v, pr.u)}</b> · given evidence <b>${E.fmt(ev.v, ev.u)}</b>`;
}
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]');
  if (!b) { if (S.menu && !ev.target.closest('.menu')) { S.menu = false; renderTop(); } return; }
  if (b.disabled) return; const f = A[b.dataset.act]; if (!f) return; ev.preventDefault(); f(b.dataset, b);
});
let armed = null;
document.addEventListener('focusin', ev => { const t = ev.target; if (t.matches('[data-nf],[data-hf],[data-af],[data-meta],[data-lib],[data-cl]') && armed !== t) { pushUndo(); armed = t; } });
document.addEventListener('focusout', () => { armed = null; });
function nodeField(n, k, v, live) {
  if (k === 'src') { setProbSource(n, v); return 'full'; }
  if (k === 'item') { pickItem(n, v); return 'full'; }
  if (k === 'value') { const num = v.trim() === '' ? null : +v.replace(',', '.'); n.prob.value = (num == null || isNaN(num)) ? (v.trim() === '' ? null : n.prob.value) : num; const it = E.libItem(S.c, n.prob.item); n.prob.edited = !!it && n.prob.value != null && +n.prob.value !== it.value; return live ? 'tree' : 'full'; }
  if (k === 'unit') { n.prob.unit = v; return 'full'; }
  if (k === 'pnote') { n.prob.note = v; return 'none'; }
  if (k === 'k') { n.k = Math.max(1, parseInt(v, 10) || 1); return 'full'; }
  if (k === 'kind' || k === 'gate' || k === 'cause') { n[k] = v; if (k === 'kind' && v === 'house' && n.prob.src === 'none') { n.prob.src = 'manual'; n.prob.value = 1; } return 'full'; }
  n[k] = v; return (k === 'label' || k === 'code') ? 'tree' : (k === 'category' ? 'tree' : 'none');
}
document.addEventListener('input', ev => {
  const t = ev.target; if (!S.c) return;
  if (t.dataset.nf && t.tagName !== 'SELECT') { const r = nodeField(node(S.sel), t.dataset.nf, t.value, true); changed(); if (r !== 'none') { renderTree(); refreshTopcard(); renderTabs(); } return; }
  if (t.dataset.meta && t.tagName !== 'SELECT') { S.c.meta[t.dataset.meta] = t.value; changed(); return; }
  const tr = t.closest('tr');
  if (t.dataset.hf && t.tagName !== 'SELECT') { node(tr.dataset.nid)[t.dataset.hf] = t.value; changed(); return; }
  if (t.dataset.af && t.tagName !== 'SELECT') { S.c.actions[+tr.dataset.ai][t.dataset.af] = t.value; changed(); return; }
  if (t.dataset.cl && t.tagName !== 'SELECT') { const it = S.c.customLib[+tr.dataset.ci]; it[t.dataset.cl] = t.dataset.cl === 'value' ? (isNaN(+t.value) ? it.value : +t.value) : t.value; if (t.dataset.cl === 'value') Object.values(S.c.nodes).forEach(n => { if (n.prob.item === it.id && !n.prob.edited) n.prob.value = it.value; }); changed(); return; }
});
document.addEventListener('change', ev => {
  const t = ev.target; if (!S.c) return;
  if (t.dataset.actChange === 'move') { if (t.value) moveBranch(S.sel, t.value); return; }
  if (t.dataset.nf) { const r = nodeField(node(S.sel), t.dataset.nf, t.value, false); changed(); if (r === 'full' || t.dataset.nf === 'value') { renderTree(); renderInspector(); refreshTopcard(); renderTabs(); } return; }
  if (t.dataset.meta) { S.c.meta[t.dataset.meta] = t.value; changed(); return; }
  const tr = t.closest('tr');
  if (t.dataset.hf) { node(tr.dataset.nid)[t.dataset.hf] = t.value; changed(); if (t.dataset.hf === 'status') render(); return; }
  if (t.dataset.af) { S.c.actions[+tr.dataset.ai][t.dataset.af] = t.value; changed(); if (t.dataset.af === 'target') render(); return; }
  if (t.dataset.lib) { setOverride(t.dataset.lib, t.value.trim() === '' ? null : t.value.replace(',', '.')); render(); return; }
  if (t.dataset.cl) { const it = S.c.customLib[+tr.dataset.ci]; if (t.dataset.cl === 'unit') { it.unit = t.value; changed(); } return; }
});
document.addEventListener('keydown', ev => {
  if (S.tab !== 'tree') return;
  const inField = ev.target.closest && ev.target.closest('input,textarea,select');
  const mod = ev.metaKey || ev.ctrlKey;
  if (mod && ev.key.toLowerCase() === 'z' && !inField) { ev.preventDefault(); ev.shiftKey ? redo() : undo(); }
  if (mod && ev.key.toLowerCase() === 's') { ev.preventDefault(); if (S.link.handle && S.link.perm === 'granted') writeFile(); else saveAs(); }
  if (!inField && (ev.key === 'Delete' || ev.key === 'Backspace') && S.sel && S.sel !== S.c.root) { ev.preventDefault(); A.del(); }
  if (ev.key === 'Escape' && S.menu) { S.menu = false; renderTop(); }
});
window.addEventListener('pagehide', () => { if (S.c) LS.set('rcaft.case.' + S.c.id, S.c); });
window.TBRCA = { S, E, X, load, newCase, exampleCase, addChild, removeBranch, issues: () => issues(), post: () => post(), render, setOverride, fileText };

/* ---------- boot ---------- */
(async function boot() {
  const hash = location.hash || '';
  let c = null;
  if (hash.startsWith('#case-')) c = LS.get('rcaft.case.' + hash.slice(6));
  if (!c) { const last = LS.get('rcaft.last'); if (last) c = LS.get('rcaft.case.' + last); }
  load(c || exampleCase());
  if (hash === '#handoff') { const h = await KIT.KitHandoff.take('rcaft'); if (h && h.handle) { S.handoff = h; renderTop(); } }
})();
})();
