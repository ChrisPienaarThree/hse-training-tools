/* Tripod Beta Investigator — application. Runs offline from a single HTML file (browser storage + JSON files)
   or as a claude.ai artifact (shared `db` collection "cases", one document per investigation). */
(function () {
'use strict';
const C = TBC, R = TBR, X = TBX, EV = TBE, TY = C.TYPES;
R.setNames(t => (TY[t] || {}).name || t);
const HAS_RUNTIME = !!(window.claude && typeof window.claude.use === 'function');

/* ---------- small helpers ---------------------------------------------- */
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = p => (p || '') + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const clone = o => JSON.parse(JSON.stringify(o));
const nowISO = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, n) => { const d = new Date((iso || today()) + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmtWhen = iso => { if (!iso) return ''; const d = new Date(iso); return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); };
const slug = s => String(s || 'case').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'case';
let toastT;
function toast(msg) {
  let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3400);
}
const prefs = (() => { let p = {}; try { p = JSON.parse(localStorage.getItem('tbi.prefs') || '{}'); } catch (e) {} return p; })();
const savePrefs = () => { try { localStorage.setItem('tbi.prefs', JSON.stringify(prefs)); } catch (e) {} };
if (prefs.coach == null) prefs.coach = true;

/* ---------- case model --------------------------------------------------- */
function blankMeta() {
  return { title: '', ref: '', date: today(), time: '', location: '', site: '', client: '', incidentType: 'People', actualSeverity: '', potentialSeverity: '', status: 'Draft', practitioner: '', description: '', summary: '', lessons: '', reviewer: '', reviewDate: '', logo: '' };
}
function newCase(title) {
  const c = { id: uid('tb-'), version: 1, meta: blankMeta(), team: [], nodes: [], edges: [], actions: [], log: [], createdAt: nowISO(), updatedAt: nowISO() };
  c.meta.title = title || 'New investigation';
  c.meta.ref = 'TB-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 900) + 100);
  // starting point: the main event trio, so the canvas never opens blank
  const ev = mkNode('event', 'Main event: describe the damage, injury or loss', 560, 200); ev.mainEvent = true;
  const ag = mkNode('agent', 'Agent of Change that acted on the Object', 160, 110);
  const ob = mkNode('object', 'Object that was changed or harmed', 160, 300);
  c.nodes.push(ev, ag, ob);
  c.edges.push({ id: uid('x'), from: ag.id, to: ev.id }, { id: uid('x'), from: ob.id, to: ev.id });
  return c;
}
function mkNode(type, label, x, y) {
  const n = { id: uid('n'), type, label: label || '', notes: '', evidence: '', verified: true, x: Math.round(x || 0), y: Math.round(y || 0) };
  if (type === 'ic') { n.act = 'act'; n.errorType = ''; n.justification = ''; }
  if (type === 'pc') n.scope = 'org';
  if (type === 'uc') n.brf = '';
  return n;
}
function normalise(c) {
  c.meta = Object.assign(blankMeta(), c.meta || {});
  c.team = Array.isArray(c.team) ? c.team : [];
  c.nodes = (c.nodes || []).filter(n => n && TY[n.type]);
  const ids = {}; c.nodes.forEach(n => { ids[n.id] = 1; if (n.x == null) n.x = 0; if (n.y == null) n.y = 0; });
  c.edges = (c.edges || []).filter(e => e && ids[e.from] && ids[e.to]);
  c.actions = (c.actions || []).map(a => Object.assign({ id: uid('act'), target: '', text: '', owner: '', due: '', priority: 'Medium', status: 'Open', smart: {}, agreed: false, closeNote: '' }, a));
  c.actions.forEach(a => { if (/^\+\d+$/.test(a.due || '')) a.due = addDays(c.meta.date, +a.due.slice(1)); });
  c.log = Array.isArray(c.log) ? c.log.slice(-200) : [];
  c.evidence = EV.normalise(c.evidence);
  if (c.nodes.some(n => !n.x && !n.y)) X.tidy(c);
  return c;
}
const exampleOf = id => C.EXAMPLES.find(e => e.id === id) || C.EXAMPLE;
function exampleCase(id) { const c = normalise(clone(exampleOf(id))); X.tidy(c); return c; }

/* ---------- storage ------------------------------------------------------- */
const Store = {
  mode: HAS_RUNTIME ? 'connecting' : 'local',   // 'connecting' | 'db' | 'local'
  db: null, user: null, dl: null, sample: null, me: null, canWrite: true, session: uid('s'), err: '',
  list: [],          // [{id,title,ref,status,date,updatedAt,updatedBy}]
  remote: {},        // db mode: id -> doc body
  names: {}          // user id -> display name
};
const LS_PREFIX = 'tbi.case.';
function localList() {
  const out = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(LS_PREFIX)) { try { const c = JSON.parse(localStorage.getItem(k)); out.push(summary(c)); } catch (e) {} } } } catch (e) {}
  return out.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}
function summary(c) { const m = c.meta || {}; return { id: c.id, title: m.title, ref: m.ref, status: m.status, date: m.date, updatedAt: c.updatedAt, updatedBy: c.updatedBy || '', nodes: (c.nodes || []).length, actions: (c.actions || []).length }; }
function localGet(id) { try { const s = localStorage.getItem(LS_PREFIX + id); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function localPut(c) {
  try { localStorage.setItem(LS_PREFIX + c.id, JSON.stringify(c)); } catch (e) { toast('This browser would not store the case (storage full or blocked). Save it as a file from the Cases tab.'); return false; }
  if (OFF) { register(c); if (S.c && S.c.id === c.id && LINK.handle && LINK.perm === 'granted') { clearTimeout(LINK.t); LINK.t = setTimeout(writeLinked, 500); } }
  return true;
}
function localDel(id) { try { localStorage.removeItem(LS_PREFIX + id); } catch (e) {} if (OFF) { KIT.KitRegistry.remove('tripod', id); FL.unlink(id); } }
/* ---------- offline: linked file on the USB stick + dashboard registry ---------- */
const OFF = !HAS_RUNTIME && typeof KIT !== 'undefined';
const FL = OFF ? KIT.FileLink({ tool: 'tripod', ext: '.tripod.json', label: 'Tripod Beta case' }) : null;
const LINK = { handle: null, name: '', perm: 'none', id: null, t: 0, saving: false };
function register(c) {
  KIT.KitRegistry.upsert({ tool: 'tripod', id: c.id, title: c.meta.title, ref: c.meta.ref, status: c.meta.status, date: c.meta.date, updatedAt: c.updatedAt, toolFile: 'Tripod Beta Investigator.html',
    file: LINK.id === c.id && LINK.handle && LINK.perm === 'granted' ? LINK.name : (KIT.KitRegistry.list().find(x => x.tool === 'tripod' && x.id === c.id) || {}).file || '',
    actions: KIT.actionStats(c.actions, a => a.status === 'Open' || a.status === 'In progress', a => a.due) });
}
async function writeLinked() {
  if (!S.c || !LINK.handle || LINK.perm !== 'granted' || LINK.id !== S.c.id) return;
  LINK.saving = true; renderTop();
  try { await FL.write(LINK.handle, caseFile(S.c)); } catch (e) { LINK.perm = 'prompt'; toast('Could not write to ' + LINK.name + '. Click Reconnect file.'); }
  LINK.saving = false; renderTop();
}
async function attachLink(c) {
  LINK.handle = null; LINK.name = ''; LINK.perm = 'none'; LINK.id = c.id;
  if (!OFF || c.example) return;
  const h = await FL.handleFor(c.id);
  if (h && S.c && S.c.id === c.id) { const p = await KIT.permission(h, false); LINK.handle = h; LINK.name = h.name; LINK.perm = p === 'granted' ? 'granted' : 'prompt'; renderTop(); }
}
async function linkFile() {
  if (!S.c || S.c.example) return;
  flushSave();
  try {
    const r = await FL.saveAs(S.c.id, fileBase() + '.tripod.json', caseFile(S.c));
    if (!r) return;
    if (r.handle) { LINK.handle = r.handle; LINK.name = r.name; LINK.perm = 'granted'; LINK.id = S.c.id; register(S.c); toast('Saved to ' + r.name + '. Later changes are written to this file automatically.'); }
    else toast('Downloaded ' + r.name + '. This browser cannot link files: save again after changes.');
    renderTop();
  } catch (e) { toast('Could not save: ' + (e.message || e)); }
}
async function reconnectFile() {
  if (!LINK.handle) return;
  const p = await KIT.permission(LINK.handle, true);
  if (p === 'granted') { LINK.perm = 'granted'; await writeLinked(); register(S.c); toast('Reconnected to ' + LINK.name + '.'); } else toast('Permission was not given. Changes stay in this browser.');
  renderTop();
}
function caseFromFileText(t, name) {
  let o; try { o = JSON.parse(t); } catch (e) { toast(name + ' is not a valid case file (it is not JSON).'); return null; }
  const c = o && o.format === 'tripod-beta-case' ? o.case : (o && o.nodes && o.meta ? o : null);
  if (!c) toast(name + ' is not a Tripod Beta case file.');
  return c;
}
async function openLinkedFile(handle, name, text) {
  const c = caseFromFileText(text, name); if (!c) return;
  if (c.example) { c.id = uid('tb-'); delete c.example; }
  normalise(c); localPut(c); Store.list = localList();
  if (handle) await FL.link(c.id, handle);
  openCase(c);
  toast('Opened ' + name + (handle ? '. Changes are saved to this file.' : '.'));
}

async function initRuntime() {
  if (!HAS_RUNTIME) { Store.list = localList(); return; }
  let db = null, user = null, dl = null, smp = null;
  try { [db, user, dl, smp] = await Promise.all([window.claude.use('db'), window.claude.use('user'), window.claude.use('downloads'), window.claude.use('sample').catch(() => null)]); } catch (e) {}
  Store.user = user; Store.dl = dl; Store.sample = typeof smp === 'function' ? smp : null;
  if (S.tab === 'evidence' && S.c) render();
  if (!db) { Store.mode = 'local'; Store.err = 'no-db'; Store.list = localList(); render(); return; }
  Store.db = db; Store.mode = 'db';
  try { Store.me = user ? await user.id() : null; } catch (e) {}
  try { const w = user ? await user.can('data.write') : null; Store.canWrite = w !== false; } catch (e) {}
  db.collection('cases').onSnapshot(snap => {
    const map = {}; snap.docs.forEach(d => { const b = d.data(); if (b) map[d.id] = b; });
    Store.remote = map;
    Store.list = Object.keys(map).map(id => ({ id, title: map[id].title, ref: map[id].ref, status: map[id].status, date: map[id].date, updatedAt: map[id].updatedAt, updatedBy: map[id].updatedBy, nodes: map[id].nodes || 0, actions: map[id].actions || 0 }))
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    resolveNames(Store.list.map(x => x.updatedBy));
    onRemote();
    if (S.tab === 'cases') render(); else renderTop();
  }, err => { Store.err = err && err.code || 'unavailable'; Store.mode = 'db-lost'; render(); });
  render();
}
async function resolveNames(ids) {
  if (!Store.user || !Store.user.profiles) return;
  const need = Array.from(new Set(ids.filter(x => x && !x.startsWith('local:') && !(x in Store.names))));
  if (!need.length) return;
  try { const ps = await Store.user.profiles(need); need.forEach(id => { Store.names[id] = (ps && ps[id] && ps[id].name) || ''; }); if (S.tab === 'cases' || S.tab === 'incident') render(); } catch (e) {}
}
const who = () => Store.mode === 'db' ? (Store.me || 'someone') : 'local:' + (prefs.name || 'This device');
const whoName = id => { if (!id) return ''; if (id.startsWith('local:')) return id.slice(6); if (id === Store.me) return 'you'; return Store.names[id] || 'a team member'; };

/* ---------- app state ------------------------------------------------------ */
const S = {
  tab: 'cases', c: null, readonly: false, dirty: false, baseRev: 0, saving: false, again: false, conflict: null,
  sel: new Set(), selEdge: null, view: { x: 40, y: 70, k: 0.8 }, undo: [], redo: [], hl: new Set(),
  confirmDel: null, issueFilter: 'all', actFilter: 'all', grid: prefs.grid !== false,
  ev: { busy: false, ctl: null, msg: '', err: '', ask: null, askTree: null, modal: null, aiOff: false, filter: 'all', pasteErr: '' }
};
let issuesCache = null;
const issues = () => issuesCache || (issuesCache = S.c ? R.check(S.c) : []);
const invalidate = () => { issuesCache = null; };

function openCase(c, opts) {
  opts = opts || {};
  S.c = normalise(c); S.readonly = !!opts.readonly || (Store.mode === 'db' && !Store.canWrite);
  S.baseRev = opts.rev || 0; S.dirty = false; S.conflict = null;
  S.sel.clear(); S.selEdge = null; S.undo = []; S.redo = []; invalidate();
  S.tab = opts.tab || 'tree'; S.fitPending = true;
  if (OFF) attachLink(S.c);
  render();
}
function closeCase() { flushSave(); S.c = null; S.tab = 'cases'; render(); }

/* change tracking + save */
let saveT;
function changed(logText, logKey) {
  if (!S.c || S.readonly) return;
  invalidate();
  S.c.updatedAt = nowISO(); S.c.updatedBy = who();
  if (logText) addLog(logText, logKey);
  S.dirty = true; clearTimeout(saveT); saveT = setTimeout(save, 1100);
  renderTop();
}
function addLog(text, key) {
  const L = S.c.log, last = L[L.length - 1], me = who(), t = nowISO();
  if (key && last && last.key === key && last.who === me && (Date.parse(t) - Date.parse(last.t)) < 10 * 60000) { last.t = t; return; }
  L.push({ t, who: me, what: text, key: key || '' });
  if (L.length > 200) L.splice(0, L.length - 200);
}
function flushSave() { if (S.dirty) { clearTimeout(saveT); save(); } }
async function save() {
  if (!S.c || S.readonly || !S.dirty) return;
  if (Store.mode !== 'db') { if (localPut(S.c)) { S.dirty = false; Store.list = localList(); renderTop(); } return; }
  if (S.saving) { S.again = true; return; }
  S.saving = true; S.dirty = false;
  const rev = Math.max(S.baseRev, (Store.remote[S.c.id] && Store.remote[S.c.id].rev) || 0) + 1;
  const body = { title: S.c.meta.title || '', ref: S.c.meta.ref || '', status: S.c.meta.status || 'Draft', date: S.c.meta.date || '', updatedAt: S.c.updatedAt, updatedBy: who(), session: Store.session, rev, nodes: S.c.nodes.length, actions: S.c.actions.length, data: clone(S.c) };
  const size = JSON.stringify(body).length;
  if (size > 250000) { S.saving = false; S.dirty = true; toast('This case is too large for the shared database (' + Math.round(size / 1024) + ' KB of 250 KB). Remove the client logo or long notes.'); return; }
  try { await Store.db.doc('cases/' + S.c.id).set(body); S.baseRev = rev; }
  catch (e) {
    S.dirty = true;
    if (e && e.code === 'invalid_argument' && !Store.canWrite) { S.readonly = true; render(); }
    toast('Not saved: ' + ((e && e.message) || 'the shared database refused the change') + '.');
  }
  S.saving = false; renderTop();
  if (S.again) { S.again = false; if (S.dirty) save(); }
}
function onRemote() {
  if (!S.c || S.c.example) return;
  const d = Store.remote[S.c.id];
  if (!d) { if (S.baseRev > 0) { toast('This case was deleted by another user.'); S.c = null; S.tab = 'cases'; render(); } return; }
  if (d.session === Store.session || (d.rev || 0) <= S.baseRev) return;
  if (!S.dirty && !S.saving) {
    const keepSel = Array.from(S.sel);
    S.c = normalise(clone(d.data)); S.baseRev = d.rev; invalidate();
    S.sel = new Set(keepSel.filter(id => S.c.nodes.some(n => n.id === id)));
    resolveNames([d.updatedBy]).then(() => toast('Updated with changes by ' + whoName(d.updatedBy) + '.'));
    render();
  } else { S.conflict = { rev: d.rev, who: d.updatedBy }; renderTop(); }
}
function resolveConflict(keepMine) {
  const d = Store.remote[S.c.id];
  if (!keepMine && d) { S.c = normalise(clone(d.data)); S.baseRev = d.rev; S.dirty = false; invalidate(); }
  else if (d) { S.baseRev = d.rev; S.dirty = true; save(); }
  S.conflict = null; render();
}

async function createCase(c, how) {
  c.updatedAt = nowISO(); c.updatedBy = who(); c.createdAt = c.createdAt || nowISO();
  c.log = c.log || []; S.c = c; addLog(how || 'Created the investigation');
  if (Store.mode === 'db') {
    if (!Store.canWrite) { toast('You can view these investigations but not create them. Ask the owner for edit access.'); return; }
    openCase(c, { rev: 0 }); S.dirty = true; await save();
  } else { localPut(c); Store.list = localList(); openCase(c); }
}
async function deleteCase(id) {
  if (Store.mode === 'db') { try { await Store.db.doc('cases/' + id).delete(); } catch (e) { toast('Could not delete: ' + ((e && e.message) || 'refused') + '.'); return; } }
  else { localDel(id); Store.list = localList(); }
  if (S.c && S.c.id === id) S.c = null;
  S.confirmDel = null; toast('Investigation deleted.'); render();
}
function loadCase(id) {
  if (C.EXAMPLES.some(e => e.id === id)) return openCase(exampleCase(id), { readonly: true });
  if (Store.mode === 'db') { const d = Store.remote[id]; if (d && d.data) openCase(clone(d.data), { rev: d.rev || 0 }); return; }
  const c = localGet(id); if (c) openCase(c); else toast('That case could not be read from this browser.');
}
function copyExample(id) {
  const src = exampleOf(id || (S.c && S.c.example ? S.c.id : C.EXAMPLE.id));
  const c = exampleCase(src.id); c.id = uid('tb-'); delete c.example; delete c.exampleNote; c.meta.title = c.meta.title + ' (practice copy)'; c.meta.status = 'Draft'; c.log = [];
  createCase(c, 'Created a practice copy of the ' + (src.meta.ref || 'worked') + ' example');
}

/* ---------- undo -------------------------------------------------------- */
function snap() { return JSON.stringify({ nodes: S.c.nodes, edges: S.c.edges, actions: S.c.actions }); }
function pushUndo() { if (!S.c || S.readonly) return; S.undo.push(snap()); if (S.undo.length > 80) S.undo.shift(); S.redo = []; }
function restore(s) { const o = JSON.parse(s); S.c.nodes = o.nodes; S.c.edges = o.edges; S.c.actions = o.actions; S.sel = new Set(Array.from(S.sel).filter(id => S.c.nodes.some(n => n.id === id))); S.selEdge = null; changed(); renderTree(); renderInspector(); }
function undo() { if (!S.undo.length) return; S.redo.push(snap()); restore(S.undo.pop()); }
function redo() { if (!S.redo.length) return; S.undo.push(snap()); restore(S.redo.pop()); }

/* ---------- graph edits ------------------------------------------------- */
const node = id => S.c.nodes.find(n => n.id === id);
function findSpot(x, y, w, h) {
  const hit = (x, y) => S.c.nodes.some(n => { const g = X.geom(n); return x < n.x + g.w + 12 && n.x < x + w + 12 && y < n.y + g.h + 12 && n.y < y + h + 12; });
  for (let i = 0; i < 40; i++) { if (!hit(x, y)) return { x, y }; if (i % 2) x += w + 20; else y += 30; }
  return { x, y };
}
function addNode(type, x, y, label) {
  pushUndo();
  const n = mkNode(type, label != null ? label : '', 0, 0);
  const g = X.geom(n); const p = findSpot(Math.round(x / 10) * 10, Math.round(y / 10) * 10, g.w, g.h);
  n.x = p.x; n.y = p.y; S.c.nodes.push(n);
  S.sel = new Set([n.id]); S.selEdge = null;
  changed('Added ' + TY[type].name, 'add-' + type);
  renderTree(); renderInspector(); focusLabel();
  return n;
}
/* Links the tree rules do not allow directly but that have one correct Tripod path:
   Precondition -> Failed Barrier goes through the barrier's Immediate Cause (added if missing),
   Underlying Cause -> Immediate Cause through a new Precondition, Underlying Cause -> Failed Barrier through both. */
function routePlan(a, b) {
  const ix = R.index(S.c), icOf = fb => ix.inN(fb.id, m => m.type === 'ic')[0];
  const mk = (type, near) => { const n = mkNode(type, '', 0, 0), g = X.geom(n), p = findSpot(Math.round(near.x / 10) * 10, Math.round((near.y + 120) / 10) * 10, g.w, g.h); n.x = p.x; n.y = p.y; S.c.nodes.push(n); return n; };
  const edge = (f, t) => { if (!S.c.edges.some(e => e.from === f.id && e.to === t.id)) S.c.edges.push({ id: uid('x'), from: f.id, to: t.id }); };
  if (a.type === 'pc' && b.type === 'failed') {
    const ic = icOf(b);
    if (ic) return { label: 'via its Immediate Cause', apply: () => { edge(a, ic); return { msg: 'Linked to the Immediate Cause of that barrier. In Tripod Beta a Precondition acts on a Failed Barrier through its Immediate Cause.' }; } };
    return { label: 'via a new Immediate Cause', apply: () => { const n = mk('ic', b); edge(n, b); edge(a, n); return { msg: 'Added an Immediate Cause between them: a Precondition acts on a Failed Barrier through the Immediate Cause. Describe the act or condition that defeated the barrier.', focus: n.id }; } };
  }
  if (a.type === 'uc' && b.type === 'ic') return { label: 'via a new Precondition', apply: () => { const n = mk('pc', b); edge(n, b); edge(a, n); return { msg: 'Added a Precondition between them: an Underlying Cause acts on an Immediate Cause through a Precondition. Describe it.', focus: n.id }; } };
  if (a.type === 'uc' && b.type === 'failed') {
    const ic = icOf(b);
    return { label: ic ? 'via a new Precondition on its Immediate Cause' : 'via a new Immediate Cause and Precondition', apply: () => {
      let i = ic; if (!i) { i = mk('ic', b); edge(i, b); }
      const p = mk('pc', i); edge(p, i); edge(a, p);
      return { msg: 'Linked through ' + (ic ? 'a new Precondition on the barrier’s Immediate Cause' : 'a new Immediate Cause and Precondition') + '. If nobody could have prevented the failure, make it a Missing or Inadequate Barrier instead.', focus: p.id };
    } };
  }
  return null;
}
function applyRoute(r, a, b, quiet) {
  const res = r.apply();
  changed('Linked ' + TY[a.type].name + ' to ' + TY[b.type].name + ' ' + r.label, 'link');
  if (res.focus) { S.sel = new Set([res.focus]); S.selEdge = null; }
  if (!quiet) toast(res.msg);
  return true;
}
/* Link with an explicit direction: fromId is the preceding element, toId the following one. */
function linkDir(fromId, toId, quiet) {
  const a = node(fromId), b = node(toId); if (!a || !b || a === b) return false;
  const ok = R.canConnect(a.type, b.type);
  if (!ok.ok) { const r = routePlan(a, b); if (r) return applyRoute(r, a, b, quiet); if (!quiet) toast(ok.reason); return false; }
  if (S.c.edges.some(e => (e.from === a.id && e.to === b.id) || (e.from === b.id && e.to === a.id))) { if (!quiet) toast('Those two are already linked.'); return false; }
  S.c.edges.push({ id: uid('x'), from: a.id, to: b.id });
  changed('Linked ' + TY[a.type].name + ' to ' + TY[b.type].name, 'link');
  return true;
}
function link(aId, bId, quiet) {
  const a = node(aId), b = node(bId); if (!a || !b) return false;
  const o = R.orient(a, b);
  if (!o.ok) {
    const r = routePlan(a, b) ? [a, b] : routePlan(b, a) ? [b, a] : null;
    if (r) return applyRoute(routePlan(r[0], r[1]), r[0], r[1], quiet);
    if (!quiet) toast(o.reason); return false;
  }
  if (S.c.edges.some(e => (e.from === o.from && e.to === o.to) || (e.from === o.to && e.to === o.from))) { if (!quiet) toast('Those two are already linked.'); return false; }
  S.c.edges.push({ id: uid('x'), from: o.from, to: o.to });
  changed('Linked ' + TY[node(o.from).type].name + ' to ' + TY[node(o.to).type].name, 'link');
  return true;
}
function unlink(eid) { pushUndo(); S.c.edges = S.c.edges.filter(e => e.id !== eid); if (S.selEdge === eid) S.selEdge = null; changed('Removed a link', 'unlink'); renderTree(); renderInspector(); }
function deleteSelection() {
  if (S.readonly) return;
  if (S.selEdge) return unlink(S.selEdge);
  if (!S.sel.size) return;
  pushUndo();
  const ids = S.sel, n = ids.size;
  // keep trajectories whole: when a barrier is deleted, join its neighbours
  Array.from(ids).forEach(id => {
    const nd = node(id); if (!nd || !R.BARRIERS[nd.type]) return;
    const ins = S.c.edges.filter(e => e.to === id && R.isTraj(node(e.from).type)), outs = S.c.edges.filter(e => e.from === id && (R.isTraj(node(e.to).type) || R.EVENTS[node(e.to).type]));
    if (ins.length === 1 && outs.length === 1 && !ids.has(ins[0].from) && !ids.has(outs[0].to)) S.c.edges.push({ id: uid('x'), from: ins[0].from, to: outs[0].to });
  });
  S.c.nodes = S.c.nodes.filter(x => !ids.has(x.id));
  S.c.edges = S.c.edges.filter(e => !ids.has(e.from) && !ids.has(e.to));
  const orphan = S.c.actions.filter(a => ids.has(a.target)).length;
  S.sel = new Set();
  changed('Deleted ' + n + ' element' + (n > 1 ? 's' : ''));
  renderTree(); renderInspector();
  if (orphan) toast(orphan + ' action' + (orphan > 1 ? 's are' : ' is') + ' no longer linked to the tree. Re-link ' + (orphan > 1 ? 'them' : 'it') + ' on the Actions tab, or undo.');
}
/* Insert a barrier on a trajectory line, splitting it. */
function insertBarrier(eid, type) {
  const e = S.c.edges.find(x => x.id === eid); if (!e) return;
  const a = node(e.from), b = node(e.to);
  if (!(R.isTraj(a.type) && (R.isTraj(b.type) || R.EVENTS[b.type]))) { toast('Barriers go on a trajectory line between an Agent or Object and an Event.'); return; }
  pushUndo();
  const n = mkNode(type || 'failed', '', 0, 0), ga = X.geom(a), gb = X.geom(b);
  n.x = Math.round(((a.x + ga.w + b.x) / 2 - 80) / 10) * 10; n.y = Math.round(((a.y + ga.ay + b.y + gb.ay) / 2 - 11) / 10) * 10;
  S.c.nodes.push(n);
  S.c.edges = S.c.edges.filter(x => x.id !== eid);
  S.c.edges.push({ id: uid('x'), from: a.id, to: n.id }, { id: uid('x'), from: n.id, to: b.id });
  S.sel = new Set([n.id]); S.selEdge = null;
  changed('Added ' + TY[n.type].name + ' on a trajectory', 'add-barrier');
  renderTree(); renderInspector(); focusLabel();
}
/* Quick-add: create a related node next to the selected one and link it. */
function quickAdd(fromId, kind) {
  const f = node(fromId); if (!f) return;
  const g = X.geom(f);
  if (kind === 'barrierAgent' || kind === 'barrierObject') {
    const ix = R.index(S.c), t = R.trios(S.c, ix).find(x => x.event.id === f.id);
    const inp = t && (kind === 'barrierAgent' ? t.agents[0] : t.objects[0]);
    if (!inp) { toast('Add the ' + (kind === 'barrierAgent' ? 'Agent' : 'Object') + ' input first.'); return; }
    const last = inp.barriers.length ? inp.barriers[inp.barriers.length - 1] : inp.origin;
    const e = S.c.edges.find(x => x.from === last.id && x.to === f.id);
    if (e) insertBarrier(e.id, 'failed');
    return;
  }
  const spec = {
    agent: ['agent', -230, -110], object: ['object', -230, 110], ic: ['ic', 0, 130], pc: ['pc', 0, 130], uc: ['uc', 0, 130],
    priorAgent: ['eventAgent', -260, 0], priorObject: ['eventObject', -260, 0], next: ['event', 260, 60]
  }[kind];
  if (!spec) return;
  pushUndo();
  const n = mkNode(spec[0], '', 0, 0), gn = X.geom(n);
  const p = findSpot(Math.round((f.x + spec[1]) / 10) * 10, Math.round((f.y + spec[2] + (spec[2] > 0 ? g.h - 64 : 0)) / 10) * 10, gn.w, gn.h);
  n.x = p.x; n.y = p.y; S.c.nodes.push(n);
  if (kind === 'priorAgent' || kind === 'priorObject') {
    // the selected Agent/Object becomes the output of a prior trio: replace it with an Event-Agent / Event-Object
    S.c.nodes = S.c.nodes.filter(x => x !== n);
    f.type = kind === 'priorAgent' ? 'eventAgent' : 'eventObject';
    const a = mkNode('agent', '', f.x - 230, f.y - 110), o = mkNode('object', '', f.x - 230, f.y + 110);
    [a, o].forEach(m => { const q = findSpot(m.x, m.y, 150, 64); m.x = q.x; m.y = q.y; S.c.nodes.push(m); S.c.edges.push({ id: uid('x'), from: m.id, to: f.id }); });
    S.sel = new Set([a.id]); changed('Added a prior trio before ' + (f.label || 'an event'));
    renderTree(); renderInspector(); focusLabel(); return;
  }
  if (kind === 'next') {
    S.c.edges.push({ id: uid('x'), from: f.id, to: n.id });
    if (f.type === 'event') f.type = 'eventObject';
  } else {
    const o = R.orient(n, f);
    if (o.ok) S.c.edges.push({ id: uid('x'), from: o.from, to: o.to });
  }
  S.sel = new Set([n.id]); S.selEdge = null;
  changed('Added ' + TY[n.type].name, 'add-' + n.type);
  renderTree(); renderInspector(); focusLabel();
}
function setType(id, type) {
  const n = node(id); if (!n || n.type === type) return;
  pushUndo(); n.type = type;
  if (type === 'ic' && !n.act) n.act = 'act'; if (type === 'pc' && !n.scope) n.scope = 'org';
  changed('Changed an element to ' + TY[type].name);
  renderTree(); renderInspector();
}
function focusLabel() { setTimeout(() => { const t = $('#f-label'); if (t) { editUndoArmed = t; t.focus(); t.select(); } }, 30); }   // the change that created the element already holds the undo step

/* ---------- rendering: shell -------------------------------------------- */
const TABS = [
  ['cases', 'Cases'], ['incident', 'Incident'], ['evidence', 'Evidence plan'], ['tree', 'Tripod tree'], ['checks', 'Rules check'], ['actions', 'Actions'], ['brf', 'BRF profile'], ['report', 'Report'], ['guide', 'Method guide']
];
function render() {
  const app = $('#app');
  if (!S.c && S.tab !== 'cases' && S.tab !== 'guide') S.tab = 'cases';
  app.innerHTML = `<div id="hidden-defs" aria-hidden="true"><svg width="0" height="0" style="position:absolute">${X.defs('tb')}</svg></div><header class="top" id="top"></header>${tabsHTML()}<div id="banners"></div><main id="main"></main>`;
  renderTop();
  const main = $('#main');
  const view = { cases: casesHTML, incident: incidentHTML, evidence: evidenceHTML, tree: benchHTML, checks: checksHTML, actions: actionsHTML, brf: brfHTML, report: reportHTML, guide: guideHTML }[S.tab];
  main.innerHTML = view();
  if (S.tab === 'tree') mountCanvas();
  if (S.tab === 'report') mountReport();
  try { prefs.tab = S.tab; savePrefs(); } catch (e) {}
}
function badgeHTML() {
  if (!S.c) return '';
  const is = issues(), e = is.filter(i => i.sev === 'error').length, w = is.filter(i => i.sev === 'warning').length;
  return e ? `<span class="count err">${e}</span>` : w ? `<span class="count warn">${w}</span>` : `<span class="count ok">\u2713</span>`;
}
function updateBadge() { const t = document.querySelector('.tab[data-t=checks]'); if (!t) return; const b = t.querySelector('.count'); if (b) b.remove(); if (S.c) t.insertAdjacentHTML('beforeend', badgeHTML()); }
function tabsHTML() {
  return `<nav class="tabs" role="tablist" id="tabs">${TABS.map(([k, l]) => {
    const dis = !S.c && k !== 'cases' && k !== 'guide';
    const badge = k === 'checks' ? badgeHTML() : '';
    return `<button class="tab${S.tab === k ? ' on' : ''}" role="tab" aria-selected="${S.tab === k}" data-act="tab" data-t="${k}" ${dis ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}>${l}${badge}</button>`;
  }).join('')}</nav>`;
}
function renderTop() {
  const top = $('#top'); if (!top) return;
  const mode = Store.mode === 'db' ? `<span class="pill live" title="Cases are stored in this artifact's shared database"><span class="dot"></span>Shared team cases</span>`
    : Store.mode === 'connecting' ? `<span class="pill"><span class="dot"></span>Connecting…</span>`
    : Store.mode === 'db-lost' ? `<span class="pill off" title="${esc(Store.err)}"><span class="dot"></span>Connection lost</span>`
    : `<span class="pill off" title="Cases are kept in this browser. Save them as files to share or back up."><span class="dot"></span>This browser only</span>`;
  const st = S.c ? (S.readonly ? 'Read only' : S.saving ? 'Saving…' : S.dirty ? 'Unsaved changes' : 'Saved') : '';
  top.innerHTML = `<div class="brand"><span class="co">Istec Training</span><span class="app">Tripod Beta Investigator</span></div>
    <div class="case-name">${S.c ? esc((S.c.meta.ref ? S.c.meta.ref + ' · ' : '') + (S.c.meta.title || 'Untitled')) : ''}</div>
    ${S.c ? `<span class="pill" id="save-state">${st}</span>` : ''}${OFF && S.c && !S.c.example ? (LINK.saving ? '<span class="pill">Writing file\u2026</span>' : LINK.handle && LINK.perm === 'granted' ? `<span class="pill live" title="Every change is written to this file"><span class="dot"></span>Saved to ${esc(LINK.name)}</span>` : LINK.handle ? '<button class="btn ghost sm" data-act="reconnectFile">Reconnect file</button>' : '<button class="btn ghost sm" data-act="linkFile" title="Save this case to a file on the USB stick; later changes are written to it">Save to file\u2026</button>') : ''}${OFF ? '' : mode}
    ${S.c ? `<button class="btn ghost sm" data-act="closeCase">All cases</button>` : ''}`;
  updateBadge();
  const bn = $('#banners'); if (bn) bn.innerHTML = bannersHTML();
}
function bannersHTML() {
  let s = '';
  if (S.c && S.c.example) s += `<div class="banner info"><b>${exampleOf(S.c.id).exampleNote && /^Training/.test(exampleOf(S.c.id).exampleNote) ? 'Training case.' : 'Worked example.'}</b> ${esc(exampleOf(S.c.id).exampleNote || 'Read only.')} <button class="btn sm primary" data-act="copyExample" data-id="${esc(S.c.id)}">Make a practice copy</button></div>`;
  else if (S.c && S.readonly) s += `<div class="banner warn">You can view this investigation but not change it. Ask the artifact owner for edit access.</div>`;
  if (S.handoff) s += `<div class="banner info">The dashboard asked to open <b>${esc(S.handoff.name)}</b>.<button class="btn sm primary" data-act="takeHandoff">Open ${esc(S.handoff.name)}</button><button class="btn sm" data-act="dropHandoff">Not now</button></div>`;
  if (OFF && S.c && !S.c.example && LINK.handle && LINK.perm !== 'granted') s += `<div class="banner warn">This case is linked to <b>${esc(LINK.name)}</b>, but the browser needs permission again before it can write to it.<button class="btn sm primary" data-act="reconnectFile">Reconnect file</button></div>`;
  if (S.conflict) s += `<div class="banner warn"><b>${esc(whoName(S.conflict.who))} saved a newer version while you were editing.</b><span class="spacer"></span><button class="btn sm" data-act="conflictTheirs">Load their version</button><button class="btn sm danger" data-act="conflictMine">Keep mine and overwrite</button></div>`;
  if (HAS_RUNTIME && Store.mode === 'local' && Store.err === 'no-db') s += `<div class="banner warn">The shared team database is not available in this view, so cases are kept in this browser only. Open the artifact from its claude.ai link to work on shared cases.</div>`;
  if (Store.mode === 'db-lost') s += `<div class="banner err">The connection to the shared cases was lost (${esc(Store.err)}). Your open case stays on screen; reload the page to reconnect.</div>`;
  return s;
}

/* ---------- Cases tab ---------------------------------------------------- */
function casesHTML() {
  const L = Store.list;
  const card = x => {
    const del = S.confirmDel === x.id ? `<div class="confirm">Delete “${esc(x.title || 'Untitled')}” for everyone? <button class="btn sm danger" data-act="delYes" data-id="${esc(x.id)}">Delete</button><button class="btn sm" data-act="delNo">Keep</button></div>` : '';
    return `<article class="case-card"><div class="row"><span class="eyebrow mono">${esc(x.ref || '')}</span><span class="spacer"></span><span class="pill st-${esc((x.status || 'Draft').replace(/\s/g, '-'))}">${esc(x.status || 'Draft')}</span></div>
      <h3>${esc(x.title || 'Untitled investigation')}</h3>
      <div class="meta"><span>Incident ${esc(x.date || '–')}</span><span>${x.nodes} tree elements</span><span>${x.actions} actions</span></div>
      <div class="meta">Updated ${esc(fmtWhen(x.updatedAt))}${x.updatedBy ? ' by ' + esc(whoName(x.updatedBy)) : ''}</div>${del}
      <div class="row"><button class="btn primary sm" data-act="open" data-id="${esc(x.id)}">Open</button><button class="btn sm" data-act="dupCase" data-id="${esc(x.id)}">Duplicate</button><button class="btn sm" data-act="exportCaseId" data-id="${esc(x.id)}">Save as file</button>${Store.mode !== 'db' || Store.canWrite ? `<span class="spacer"></span><button class="btn sm ghost" data-act="delAsk" data-id="${esc(x.id)}" aria-label="Delete">Delete</button>` : ''}</div></article>`;
  };
  const list = Store.mode === 'connecting' ? `<div class="empty">Connecting to the shared team cases…</div>`
    : L.length ? `<div class="cases">${L.map(card).join('')}</div>`
    : `<div class="empty">No investigations yet${Store.mode === 'db' ? ' in the shared team database' : ' in this browser'}. Start a new one, or make a practice copy of the worked example below.</div>`;
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Investigations</span><h1>Tripod Beta cases</h1><p class="muted">Model what happened, how the barriers failed and why, then report the findings and SMART actions.</p></div>
      <div class="row">${Store.mode === 'local' ? `<label class="field" style="min-width:180px"><span>Your name (for the activity log)</span><input id="f-myname" type="text" value="${esc(prefs.name || '')}" placeholder="e.g. J. Smith"></label>` : ''}
      <button class="btn" data-act="importCase">Open case file…</button><button class="btn primary" data-act="newCase">New investigation</button></div></div>
    <form class="row" data-form="new" id="new-form" hidden><input id="f-newtitle" type="text" placeholder="Short title of the incident, e.g. Hand injury at conveyor tail pulley" style="flex:1 1 320px"><button class="btn primary" type="submit">Create</button><button class="btn" type="button" data-act="newCancel">Cancel</button></form>
    ${list}
    <section><span class="eyebrow">Reference cases</span>
      <div class="cases" style="margin-top:8px">${C.EXAMPLES.map(e => { const ex = e.meta, exercise = e.id !== C.EXAMPLE.id;
        return `<article class="case-card example"><div class="row"><span class="eyebrow mono">${esc(ex.ref)}</span><span class="spacer"></span><span class="pill">${exercise ? 'Training case' : 'Worked example'}</span></div>
      <h3>${esc(ex.title)}</h3><p class="small muted">${exercise ? 'Anonymised training case. The core diagram and a pre-filled evidence plan (sparse evidence, assumptions to test) are given; learners add the barriers, causation paths and actions in a practice copy.' : esc(ex.client) + '. Five trios, seven failed barriers, ten underlying causes classified by BRF, with a full action plan. Use it to see a finished tree or to practise.'}</p>
      <div class="row"><button class="btn primary sm" data-act="open" data-id="${esc(e.id)}">Open read only</button><button class="btn sm" data-act="copyExample" data-id="${esc(e.id)}">Make a practice copy</button></div></article>`; }).join('')}</div></section>
  </div>`;
}

/* ---------- Incident tab ------------------------------------------------- */
const fieldDis = () => S.readonly ? ' readonly' : '';
const selDis = () => S.readonly ? ' disabled' : '';
function incidentHTML() {
  const m = S.c.meta, ro = fieldDis();
  const inp = (k, label, type, extra) => `<label class="field${extra && extra.wide ? ' wide' : ''}"><span>${label}</span><input id="m-${k}" data-meta="${k}" type="${type || 'text'}" value="${esc(m[k] || '')}"${ro}${extra && extra.ph ? ` placeholder="${esc(extra.ph)}"` : ''}></label>`;
  const area = (k, label, ph, rows) => `<label class="field wide"><span>${label}</span><textarea id="m-${k}" data-meta="${k}" rows="${rows || 4}" placeholder="${esc(ph || '')}"${ro}>${esc(m[k] || '')}</textarea></label>`;
  const sel = (k, label, opts) => `<label class="field"><span>${label}</span><select id="m-${k}" data-meta="${k}"${selDis()}>${opts.map(o => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return `<option value="${esc(v)}"${String(m[k]) === String(v) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select></label>`;
  const sevs = [['', '–'], ['1', '1 Minor'], ['2', '2 Moderate'], ['3', '3 Serious'], ['4', '4 Major'], ['5', '5 Catastrophic']];
  const log = S.c.log.slice().reverse().slice(0, 40);
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Step 1 · Initial findings</span><h1>Incident details</h1></div></div>
    <section class="panel"><h2>Incident</h2><div class="form">
      ${inp('title', 'Title', 'text', { wide: true })}${inp('ref', 'Reference')}${inp('date', 'Date of incident', 'date')}${inp('time', 'Time', 'text', { ph: 'e.g. 14:20' })}
      ${inp('location', 'Location')}${inp('site', 'Site / business unit')}${inp('client', 'Client / company')}
      ${sel('incidentType', 'Loss category (main Object harmed)', C.OBJECT_KINDS)}${sel('actualSeverity', 'Actual severity', sevs)}${sel('potentialSeverity', 'Potential severity', sevs)}
      ${area('description', 'What happened (initial findings)', 'Facts from the initial incident report: who, what, where, when, consequences.', 5)}
    </div></section>
    <section class="panel"><h2>Investigation team</h2>
      <div class="form">${inp('practitioner', 'Tripod Beta practitioner / facilitator')}</div>
      <div class="tbl-wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Name</th><th>Role in the team</th><th></th></tr></thead><tbody>
      ${S.c.team.map((t, i) => `<tr><td><input id="t-name-${i}" data-team="${i}" data-k="name" value="${esc(t.name)}"${ro}></td><td><input id="t-role-${i}" data-team="${i}" data-k="role" value="${esc(t.role)}"${ro}></td><td>${S.readonly ? '' : `<button class="xbtn" data-act="teamDel" data-i="${i}" aria-label="Remove">×</button>`}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">No team members yet.</td></tr>'}
      </tbody></table></div>${S.readonly ? '' : '<div class="row" style="margin-top:8px"><button class="btn sm" data-act="teamAdd">Add team member</button></div>'}
    </section>
    <section class="panel"><h2>Findings and review</h2><div class="form">
      ${area('summary', 'Summary of findings (report section 1)', 'A short summary of the main event, the key failed barriers and the main underlying causes.', 4)}
      ${area('lessons', 'Lessons learned (one per line)', '', 3)}
      ${sel('status', 'Report status', ['Draft', 'In review', 'Final'])}${inp('reviewer', 'Reviewed by (management)')}${inp('reviewDate', 'Review date', 'date')}
      <div class="field"><span>Client logo for the report</span><div class="row">${m.logo ? `<img src="${esc(m.logo)}" alt="Client logo" style="max-height:44px;max-width:140px;background:#fff;border:1px solid var(--line);padding:2px">` : '<span class="muted small">None</span>'}
        ${S.readonly ? '' : `<button class="btn sm" data-act="logoPick">${m.logo ? 'Replace' : 'Add logo'}…</button>${m.logo ? '<button class="btn sm ghost" data-act="logoDel">Remove</button>' : ''}`}</div></div>
    </div></section>
    <section class="panel"><h2>Activity</h2>${log.length ? `<div class="tbl-wrap"><table class="tbl"><tbody>${log.map(l => `<tr><td class="mono small" style="white-space:nowrap">${esc(fmtWhen(l.t))}</td><td>${esc(whoName(l.who))}</td><td>${esc(l.what)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No activity recorded yet.</p>'}</section>
  </div>`;
}

/* ---------- Evidence plan tab ------------------------------------------- */
/* The investigator writes an account (assumptions and early conclusions included); Claude (artifact) or the
   starter lists (offline) turn it into an evidence checklist, a photography schedule and statements to test. */
const evNames = t => (TY[t] || {}).name || t;
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const evAI = () => !!Store.sample && !S.ev.aiOff;
const evOpt = (list, v, labels) => list.map((o, j) => `<option value="${esc(o)}"${o === v ? ' selected' : ''}>${esc(labels ? labels[j] : o)}</option>`).join('');
function evStatsHTML() {
  const E = S.c.evidence, got = E.items.filter(x => x.status === 'Collected').length, urg = E.items.filter(x => x.priority === 'Urgent' && x.status === 'To collect').length;
  return `<div class="stats" id="ev-stats"><div class="stat"><b>${got}/${E.items.length}</b><span>evidence items collected</span></div><div class="stat"><b style="${urg ? 'color:var(--err)' : ''}">${urg}</b><span>urgent items still to collect</span></div><div class="stat"><b>${E.photos.filter(p => p.taken).length}/${E.photos.length}</b><span>photos taken</span></div><div class="stat"><b>${E.tests.filter(t => t.status !== 'Untested').length}/${E.tests.length}</b><span>statements tested</span></div></div>`;
}
function evStatusHTML() {
  const v = S.ev;
  if (v.busy) return `<span class="spin" aria-hidden="true"></span><span>${esc(v.msg)}</span><button class="btn sm" data-act="evStop">Stop</button>`;
  return esc(v.err || v.msg || '');
}
function renderEvStatus() { const el = $('#ev-status'); if (!el) return; el.className = 'ev-status ' + (S.ev.busy ? 'busy' : S.ev.err ? 'err' : S.ev.msg ? 'ok' : ''); el.innerHTML = evStatusHTML(); }
function evidenceHTML() {
  const E = S.c.evidence, ro = fieldDis(), sd = selDis(), v = S.ev, edit = !S.readonly && !S.c.example;
  const has = E.items.length + E.photos.length + E.tests.length > 0;
  const del = (list, i) => edit ? `<button class="xbtn" data-act="evDel" data-list="${list}" data-i="${i}" aria-label="Delete row">×</button>` : '';
  const f = v.filter;
  const items = E.items.map((r, i) => ({ r, i })).filter(x => f === 'all' || (f === 'todo' ? x.r.status === 'To collect' : f === 'urgent' ? x.r.priority === 'Urgent' && x.r.status === 'To collect' : x.r.cat === f));
  const nodeOpts = r => `<option value="">—</option>${S.c.nodes.filter(n => n.label).map(n => `<option value="${esc(n.id)}"${r.node === n.id ? ' selected' : ''}>${esc((TY[n.type].short || TY[n.type].name) + ': ' + n.label.slice(0, 60))}</option>`).join('')}`;
  const ask = v.ask ? `<div class="confirm" style="background:var(--warn-soft)">This case already has an evidence plan.<button class="btn sm primary" data-act="evGo" data-mode="add">Add the new suggestions</button><button class="btn sm" data-act="evGo" data-mode="replace">Replace the plan</button><button class="btn sm ghost" data-act="evCancelAsk">Cancel</button></div>` : '';
  const modal = v.modal === 'prompt' ? `<div class="modal-bg" role="dialog" aria-modal="true" aria-label="Prompt for Claude"><div class="modal"><h3>Prompt for Claude</h3><p class="small muted">Copy all of this text into a chat with Claude (claude.ai or the Claude app). Then copy Claude's whole reply and use <b>Paste Claude's answer</b>.</p><textarea id="ev-prompt" rows="14" readonly>${esc(EV.prompt(S.c, E.narrative, evNames))}</textarea><div class="row"><span class="spacer"></span><button class="btn primary" data-act="evModalClose">Done</button></div></div></div>`
    : v.modal === 'paste' ? `<div class="modal-bg" role="dialog" aria-modal="true" aria-label="Paste Claude's answer"><div class="modal"><h3>Paste Claude's answer</h3><p class="small muted">Paste Claude's complete reply (the JSON plan). Anything before or after the plan is ignored.</p><textarea id="ev-paste" rows="12" placeholder='{"items":[...], "photos":[...], "tests":[...], "notes":"..."}'></textarea>${v.pasteErr ? `<p class="small" style="color:var(--err)">${esc(v.pasteErr)}</p>` : ''}${has ? `<div class="row small"><label class="check"><input type="radio" name="ev-pmode" value="add" checked> Add to the current plan</label><label class="check"><input type="radio" name="ev-pmode" value="replace"> Replace the current plan</label></div>` : ''}<div class="row"><span class="spacer"></span><button class="btn" data-act="evModalClose">Cancel</button><button class="btn primary" data-act="evPasteUse">Use this answer</button></div></div></div>` : '';
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Step 1 · Collect the evidence</span><h1>Evidence plan</h1><p class="muted">Write down everything you know or believe about the incident, including your assumptions and early conclusions. ${evAI() ? 'Claude turns it into' : 'The app turns it into'} an evidence checklist, a photography schedule and a list of statements to test.</p></div>
      <div class="row"><button class="btn" data-act="exportEvidence"${has ? '' : ' disabled'}>Export to Excel</button></div></div>
    <section class="panel"><h2>Investigator's account</h2>
      <label class="field wide"><span>What happened, as far as you know: sequence, people, equipment, conditions, what you think caused it and what you are not sure about. Write "I assume…" or "probably…" for anything not yet confirmed.</span>
      <textarea id="ev-narrative" data-ev="narrative" rows="10" placeholder="e.g. At about 14:20 the operator went to clear spillage at the tail pulley of conveyor CV-07. I assume the conveyor was not isolated because no lock was found on the isolator afterwards. The guard on the tail end was probably removed during the night shift…"${ro}>${esc(E.narrative)}</textarea></label>
      <div class="row" style="margin-top:8px"><label class="check small"><input type="checkbox" data-ev="useTree"${E.useTree ? ' checked' : ''}${sd}> Include the Tripod tree (${S.c.nodes.filter(n => n.label).length} elements; assumed elements become statements to test)</label></div>
      ${edit ? `<div class="ev-actions" style="margin-top:12px">
        ${evAI() ? `<button class="btn primary" data-act="evClaude"${v.busy ? ' disabled' : ''}>Write the plan with Claude</button>` : ''}
        <button class="btn${evAI() ? '' : ' primary'}" data-act="evStarter"${v.busy ? ' disabled' : ''}>Build starter plan</button>
        <button class="btn ghost" data-act="evCopyPrompt"${v.busy ? ' disabled' : ''}>Copy prompt for Claude</button>
        <button class="btn ghost" data-act="evPaste"${v.busy ? ' disabled' : ''}>Paste Claude's answer…</button></div>
        <p class="small muted" style="margin-top:6px">${evAI() ? 'Claude uses your own Claude account; the first time, claude.ai asks you to allow it. ' : HAS_RUNTIME ? '' : 'Offline: the starter plan uses standard evidence lists plus incident-specific packs found in your text. For a plan written by Claude, copy the prompt into Claude and paste the answer back. '}Everything stays editable.</p>` : ''}
      ${ask}<div id="ev-status" class="ev-status ${v.busy ? 'busy' : v.err ? 'err' : v.msg ? 'ok' : ''}" role="status">${evStatusHTML()}</div>
      ${E.notes ? `<div class="coach" style="margin-top:12px"><b>Preserving the scene and order of collection</b><p class="ev-note">${esc(E.notes)}</p>${E.generatedAt ? `<span class="ref">Plan built ${esc(fmtWhen(E.generatedAt))}${E.source ? ' · ' + esc(E.source) : ''}</span>` : ''}</div>` : ''}
    </section>
    ${edit ? `<section class="panel"><h2>Draft Tripod tree</h2><p class="muted small" style="margin-bottom:10px">Turn the account into a first Tripod tree: trios, barriers and the causation paths, including plausible theoretical causes where the facts are not known yet. Every drafted element is marked <b>assumed</b>, so it shows up as something to test. Check the Rules check tab afterwards.</p>
      <div class="ev-actions">${evAI() ? `<button class="btn primary" data-act="evTreeClaude"${v.busy ? ' disabled' : ''}>Draft the tree with Claude</button>` : ''}
        <button class="btn${evAI() ? ' ghost' : ''}" data-act="evTreeCopy"${v.busy ? ' disabled' : ''}>Copy tree prompt for Claude</button>
        <button class="btn ghost" data-act="evTreePaste"${v.busy ? ' disabled' : ''}>Paste Claude's tree\u2026</button></div>
      ${v.askTree ? `<div class="confirm" style="background:var(--warn-soft);margin-top:10px">This case already has a tree (${S.c.nodes.length} elements).<button class="btn sm primary" data-act="evTreeGo" data-mode="add">Put the draft beside it</button><button class="btn sm" data-act="evTreeGo" data-mode="replace">Replace the tree (you can undo)</button><button class="btn sm ghost" data-act="evTreeCancel">Cancel</button></div>` : ''}
    </section>` : ''}
    ${has ? evStatsHTML() : ''}
    <section class="panel"><div class="row" style="margin-bottom:10px"><h2>Evidence checklist</h2><span class="spacer"></span>
      ${[['all', 'All'], ['urgent', 'Urgent to collect'], ['todo', 'To collect']].concat(EV.CATS.map(([k, n]) => [k, n.split(' (')[0]])).map(([k, l]) => `<button class="btn sm${f === k ? ' primary' : ''}" data-act="evFilter" data-f="${k}">${esc(l)}</button>`).join('')}</div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Category</th><th style="min-width:240px">Evidence to collect</th><th style="min-width:160px">Where / from whom</th><th style="min-width:200px">Why (what it tests)</th><th>Priority</th><th>Method</th><th>Owner</th><th>Due</th><th>Status</th><th>Ref</th><th></th></tr></thead><tbody>
      ${items.map(({ r, i }) => `<tr data-evrow="${i}"${r.priority === 'Urgent' && r.status === 'To collect' ? ' class="urgent"' : ''}><td class="num">${i + 1}</td>
        <td><select id="ev-items-cat-${i}" data-ev="items" data-i="${i}" data-k="cat"${sd}>${evOpt(EV.CATS.map(x => x[0]), r.cat, EV.CATS.map(x => x[1].split(' (')[0]))}</select></td>
        <td><textarea id="ev-items-item-${i}" data-ev="items" data-i="${i}" data-k="item" rows="2"${ro}>${esc(r.item)}</textarea></td>
        <td><textarea data-ev="items" data-i="${i}" data-k="source" rows="2"${ro}>${esc(r.source)}</textarea></td>
        <td><textarea data-ev="items" data-i="${i}" data-k="purpose" rows="2"${ro}>${esc(r.purpose)}</textarea></td>
        <td><select data-ev="items" data-i="${i}" data-k="priority"${sd}>${evOpt(EV.PRIORITY, r.priority)}</select></td>
        <td><select data-ev="items" data-i="${i}" data-k="method"${sd}>${evOpt(EV.METHODS, r.method)}</select></td>
        <td><input data-ev="items" data-i="${i}" data-k="owner" value="${esc(r.owner)}"${ro}></td>
        <td><input type="date" data-ev="items" data-i="${i}" data-k="due" value="${esc(r.due)}"${ro}></td>
        <td><select id="ev-items-status-${i}" data-ev="items" data-i="${i}" data-k="status"${sd}>${evOpt(EV.ITEM_STATUS, r.status)}</select></td>
        <td><input data-ev="items" data-i="${i}" data-k="ref" value="${esc(r.ref)}" placeholder="E-01" style="min-width:70px"${ro}></td>
        <td>${del('items', i)}</td></tr>`).join('') || `<tr><td colspan="12" class="muted">${E.items.length ? 'No items in this filter.' : 'No evidence items yet. Write the account above and build the plan, or add items by hand.'}</td></tr>`}
      </tbody></table></div>${edit ? '<div class="row" style="margin-top:8px"><button class="btn sm" data-act="evAdd" data-list="items">Add evidence item</button></div>' : ''}
    </section>
    <section class="panel"><h2>Photography schedule</h2><p class="small muted" style="margin-bottom:10px">Shoot in this order: overviews from every side first, then mid-range, then close-ups with a scale. Write the photo number against each line.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Shot</th><th style="min-width:220px">Subject</th><th style="min-width:180px">Camera position / direction</th><th>View</th><th style="min-width:200px">What it must show</th><th>Taken</th><th>Photo no. / file</th><th></th></tr></thead><tbody>
      ${E.photos.map((r, i) => `<tr><td class="num">${i + 1}</td>
        <td><textarea id="ev-photos-subject-${i}" data-ev="photos" data-i="${i}" data-k="subject" rows="2"${ro}>${esc(r.subject)}</textarea></td>
        <td><textarea data-ev="photos" data-i="${i}" data-k="position" rows="2"${ro}>${esc(r.position)}</textarea></td>
        <td><select data-ev="photos" data-i="${i}" data-k="view"${sd}>${evOpt(EV.VIEWS, r.view)}</select></td>
        <td><textarea data-ev="photos" data-i="${i}" data-k="purpose" rows="2"${ro}>${esc(r.purpose)}</textarea></td>
        <td style="text-align:center"><input type="checkbox" id="ev-photos-taken-${i}" data-ev="photos" data-i="${i}" data-k="taken" aria-label="Photo ${i + 1} taken"${r.taken ? ' checked' : ''}${sd}></td>
        <td><input data-ev="photos" data-i="${i}" data-k="ref" value="${esc(r.ref)}" placeholder="IMG_0412" style="min-width:90px"${ro}></td>
        <td style="white-space:nowrap">${edit ? `<button class="xbtn" data-act="evMove" data-i="${i}" data-d="-1" aria-label="Move up"${i ? '' : ' disabled'}>↑</button><button class="xbtn" data-act="evMove" data-i="${i}" data-d="1" aria-label="Move down"${i < E.photos.length - 1 ? '' : ' disabled'}>↓</button>` : ''}${del('photos', i)}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">No photos planned yet.</td></tr>'}
      </tbody></table></div>${edit ? '<div class="row" style="margin-top:8px"><button class="btn sm" data-act="evAdd" data-list="photos">Add photo</button></div>' : ''}
      ${prefs.coach ? `<div class="coach" style="margin-top:12px"><b>Photography good practice</b><ul>${EV.PHOTO_TIPS.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
    </section>
    <section class="panel"><h2>Assumptions and conclusions to test</h2><p class="small muted" style="margin-bottom:10px">Nothing goes into the tree or the report as a fact until the evidence supports it. When a statement is supported, mark the tree element confirmed.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th style="min-width:240px">Statement</th><th>Type</th><th style="min-width:240px">Evidence that would confirm or refute it</th><th>Tripod tree element</th><th>Status</th><th></th></tr></thead><tbody>
      ${E.tests.map((r, i) => `<tr><td class="num">${i + 1}</td>
        <td><textarea id="ev-tests-statement-${i}" data-ev="tests" data-i="${i}" data-k="statement" rows="2"${ro}>${esc(r.statement)}</textarea></td>
        <td><select data-ev="tests" data-i="${i}" data-k="kind"${sd}>${evOpt(EV.KINDS, r.kind)}</select></td>
        <td><textarea data-ev="tests" data-i="${i}" data-k="evidence" rows="2"${ro}>${esc(r.evidence)}</textarea></td>
        <td><select data-ev="tests" data-i="${i}" data-k="node" style="max-width:220px"${sd}>${nodeOpts(r)}</select>${r.node && node(r.node) ? `<button class="btn sm ghost" data-act="showIssue" data-ids="${esc(r.node)}" style="margin-top:4px">Show on tree</button>` : ''}</td>
        <td><select id="ev-tests-status-${i}" data-ev="tests" data-i="${i}" data-k="status"${sd}>${evOpt(EV.TEST_STATUS, r.status)}</select></td>
        <td>${del('tests', i)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">No statements to test yet.</td></tr>'}
      </tbody></table></div>${edit ? '<div class="row" style="margin-top:8px"><button class="btn sm" data-act="evAdd" data-list="tests">Add statement</button></div>' : ''}
    </section>${modal}${v.modal === 'treePrompt' ? `<div class="modal-bg" role="dialog" aria-modal="true" aria-label="Tree prompt for Claude"><div class="modal"><h3>Tree prompt for Claude</h3><p class="small muted">Copy all of this text into a chat with Claude. Then copy Claude's whole reply and use <b>Paste Claude's tree</b>.</p><textarea id="ev-tprompt" rows="14" readonly>${esc(EV.treePrompt(S.c, E.narrative, C))}</textarea><div class="row"><span class="spacer"></span><button class="btn primary" data-act="evModalClose">Done</button></div></div></div>`
      : v.modal === 'treePaste' ? `<div class="modal-bg" role="dialog" aria-modal="true" aria-label="Paste Claude's tree"><div class="modal"><h3>Paste Claude's tree</h3><p class="small muted">Paste Claude's complete reply (the JSON with "trios"). Anything before or after it is ignored.</p><textarea id="ev-tpaste" rows="12" placeholder='{"trios":[...], "notes":"..."}'></textarea>${v.pasteErr ? `<p class="small" style="color:var(--err)">${esc(v.pasteErr)}</p>` : ''}${isStarterTree() ? '' : `<div class="row small"><label class="check"><input type="radio" name="ev-tmode" value="add" checked> Put the draft beside the current tree</label><label class="check"><input type="radio" name="ev-tmode" value="replace"> Replace the current tree</label></div>`}<div class="row"><span class="spacer"></span><button class="btn" data-act="evModalClose">Cancel</button><button class="btn primary" data-act="evTreePasteUse">Use this tree</button></div></div></div>` : ''}
  </div>`;
}
function evEdit(t) {
  const E = S.c.evidence, k = t.dataset.k, val = t.type === 'checkbox' ? t.checked : t.value;
  if (t.dataset.ev === 'narrative') E.narrative = val;
  else if (t.dataset.ev === 'useTree') E.useTree = val;
  else { const r = (E[t.dataset.ev] || [])[+t.dataset.i]; if (!r) return; r[k] = val; }
  changed('Edited the evidence plan', 'evidence');
  if (t.type === 'checkbox' || t.tagName === 'SELECT') { const st = $('#ev-stats'); if (st) st.outerHTML = evStatsHTML(); }
  if (t.dataset.k === 'node') render();
}
function evApply(plan, mode, source) {
  const E = S.c.evidence;
  if (mode === 'add') { E.items = E.items.concat(plan.items); E.photos = E.photos.concat(plan.photos); E.tests = E.tests.concat(plan.tests); if (plan.notes) E.notes = [E.notes, plan.notes].filter(Boolean).join('\n\n'); }
  else { E.items = plan.items; E.photos = plan.photos; E.tests = plan.tests; E.notes = plan.notes || ''; }
  E.generatedAt = nowISO(); E.source = source;
  changed((mode === 'add' ? 'Added to' : 'Built') + ' the evidence plan (' + source + ')');
  S.ev.err = ''; S.ev.filter = 'all';
  S.ev.msg = `${mode === 'add' ? 'Added' : 'Plan ready'}: ${plan.items.length} evidence items, ${plan.photos.length} photos, ${plan.tests.length} statements to test.${source === 'Claude' ? ' Written by Claude: check every line against what you know before you use it.' : ''}`;
  render();
}
const EV_FAIL = { rate_limited: 'Claude is busy or your usage limit has been reached. Try again later.', invalid_json: "Claude's answer could not be read as a plan. Try again.", refused: 'Claude declined this request. Rephrase the account and try again.',
  empty_completion: 'Claude returned nothing. Shorten the account and try again.', prompt_too_large: 'The account is too long for one request. Shorten it and try again.', session_expired: 'Your claude.ai session has expired. Sign in again and try again.' };
async function evRun(how, mode) {
  S.ev.ask = null;
  const E = S.c.evidence, nar = E.narrative || '';
  if (how === 'starter') { evApply(EV.starter(S.c, nar, evNames), mode, 'starter plan'); return; }
  if (!evAI()) { S.ev.err = 'Claude is not available in this view. Use Build starter plan, or Copy prompt for Claude and paste the answer back.'; render(); return; }
  if (nar.trim().length < 40) { S.ev.err = 'Write a few sentences about the incident first: what happened, what you think caused it, and what you are not sure about.'; S.ev.msg = ''; render(); return; }
  const sample = Store.sample, ctl = new AbortController(), caseId = S.c.id, input = EV.prompt(S.c, nar, evNames);
  Object.assign(S.ev, { busy: true, ctl, err: '', msg: 'Asking Claude… the first words can take up to a minute or two.' });
  render();
  const opts = { signal: ctl.signal, onText: ({ text }) => { S.ev.msg = 'Claude is writing the plan… ' + (text.length / 1000).toFixed(1) + 'k characters'; renderEvStatus(); } };
  try {
    const ans = typeof sample.json === 'function' ? await sample.json(input, opts) : EV.parseText((await sample(input, opts)).text);
    S.ev.busy = false; S.ev.ctl = null;
    if (!S.c || S.c.id !== caseId) return;
    let plan; try { plan = EV.fromAnswer(ans, S.c.nodes.map(n => n.id)); } catch (e) { S.ev.err = "Claude's answer could not be read as a plan (" + e.message + ') Try again.'; S.ev.msg = ''; render(); return; }
    evApply(plan, mode, 'Claude');
  } catch (e) {
    S.ev.busy = false; S.ev.ctl = null;
    const code = e && e.code;
    if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].indexOf(code) >= 0) {
      S.ev.aiOff = true; S.ev.msg = '';
      S.ev.err = 'Claude is not available to this artifact in your account, so it cannot write the plan here. Use Build starter plan, or Copy prompt for Claude and paste the answer back.';
    } else if (code === 'cancelled') { S.ev.err = ''; S.ev.msg = 'Stopped. Nothing was changed.'; }
    else { S.ev.msg = ''; S.ev.err = EV_FAIL[code] || 'Something went wrong while asking Claude. Try again.'; }
    if (S.c && S.c.id === caseId && S.tab === 'evidence') render();
  }
}
function evStart(how) {
  const E = S.c.evidence;
  if (E.items.length + E.photos.length + E.tests.length) { S.ev.ask = how; S.ev.msg = ''; S.ev.err = ''; render(); return; }
  evRun(how, 'replace');
}
const STARTER_LABELS = ['Main event: describe the damage, injury or loss', 'Agent of Change that acted on the Object', 'Object that was changed or harmed'];
const isStarterTree = () => !S.c.nodes.length || (S.c.nodes.length <= 3 && S.c.nodes.every(n => STARTER_LABELS.indexOf(n.label) >= 0 || !n.label));
function treeApply(d, mode, source) {
  pushUndo();
  if (mode === 'replace' || isStarterTree()) { S.c.nodes = d.nodes; S.c.edges = d.edges; X.tidy(S.c); }
  else {
    const tmp = { nodes: d.nodes, edges: d.edges }; X.tidy(tmp);
    const right = Math.max(...S.c.nodes.map(n => n.x + X.geom(n).w)), left = Math.min(...d.nodes.map(n => n.x));
    const hasMain = S.c.nodes.some(n => n.mainEvent);
    d.nodes.forEach(n => { n.x += right + 220 - left; if (hasMain) delete n.mainEvent; });
    S.c.nodes = S.c.nodes.concat(d.nodes); S.c.edges = S.c.edges.concat(d.edges);
  }
  if (d.notes) addLog('Draft tree notes: ' + d.notes.slice(0, 300));
  changed('Drafted the Tripod tree (' + source + ')');
  const errs = R.check(S.c).filter(i => i.sev === 'error').length;
  S.ev.msg = `Draft tree added: ${d.nodes.length} elements, all marked assumed.${errs ? ' ' + errs + ' rule error' + (errs > 1 ? 's' : '') + ' to fix: see Rules check.' : ''}${d.notes ? ' Claude notes: ' + d.notes : ''}`;
  S.ev.err = ''; S.ev.askTree = null;
  S.tab = 'tree'; S.sel.clear(); S.fitPending = true; render();
  toast('Draft tree added. Every element is marked assumed until the evidence confirms it.');
}
async function treeRun(mode) {
  S.ev.askTree = null;
  const nar = (S.c.evidence.narrative || '').trim();
  if (nar.length < 40) { S.ev.err = 'Write a few sentences about the incident first, in the account above.'; S.ev.msg = ''; render(); return; }
  const sample = Store.sample, ctl = new AbortController(), caseId = S.c.id;
  Object.assign(S.ev, { busy: true, ctl, err: '', msg: 'Asking Claude to draft the tree\u2026 this usually takes one to two minutes.' });
  render();
  const opts = { signal: ctl.signal, onText: ({ text }) => { S.ev.msg = 'Claude is drafting the tree\u2026 ' + (text.length / 1000).toFixed(1) + 'k characters'; renderEvStatus(); } };
  try {
    const input = EV.treePrompt(S.c, nar, C);
    const ans = typeof sample.json === 'function' ? await sample.json(input, opts) : EV.parseText((await sample(input, opts)).text);
    S.ev.busy = false; S.ev.ctl = null;
    if (!S.c || S.c.id !== caseId) return;
    let d; try { d = EV.treeFromAnswer(ans, C); } catch (e) { S.ev.err = "Claude's answer could not be read as a tree (" + e.message + ') Try again.'; S.ev.msg = ''; render(); return; }
    treeApply(d, mode, 'Claude');
  } catch (e) {
    S.ev.busy = false; S.ev.ctl = null;
    const code = e && e.code;
    if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].indexOf(code) >= 0) { S.ev.aiOff = true; S.ev.msg = ''; S.ev.err = 'Claude is not available to this artifact in your account. Use Copy tree prompt for Claude and paste the answer back.'; }
    else if (code === 'cancelled') { S.ev.err = ''; S.ev.msg = 'Stopped. The tree was not changed.'; }
    else { S.ev.msg = ''; S.ev.err = EV_FAIL[code] || 'Something went wrong while asking Claude. Try again.'; }
    if (S.c && S.c.id === caseId && S.tab === 'evidence') render();
  }
}
const EV_ACT = {
  evTreeClaude: () => { if (!evAI()) return; if (isStarterTree()) treeRun('replace'); else { S.ev.askTree = true; render(); } },
  evTreeGo: d => treeRun(d.mode),
  evTreeCancel: () => { S.ev.askTree = null; render(); },
  evTreeCopy: async () => {
    const text = EV.treePrompt(S.c, S.c.evidence.narrative, C);
    try { await navigator.clipboard.writeText(text); toast("Tree prompt copied. Paste it into Claude, then bring the reply back with Paste Claude's tree."); }
    catch (e) { S.ev.modal = 'treePrompt'; render(); const t = $('#ev-tprompt'); if (t) { t.focus(); t.select(); } }
  },
  evTreePaste: () => { S.ev.modal = 'treePaste'; S.ev.pasteErr = ''; render(); const t = $('#ev-tpaste'); if (t) t.focus(); },
  evTreePasteUse: () => {
    const t = $('#ev-tpaste'), m = document.querySelector('input[name=ev-tmode]:checked');
    let d;
    try { d = EV.treeFromAnswer(EV.parseText(t ? t.value : ''), C); }
    catch (e) { S.ev.pasteErr = 'That is not a tree this app can read: ' + e.message; const keep = t ? t.value : ''; render(); const n = $('#ev-tpaste'); if (n) { n.value = keep; n.focus(); } return; }
    S.ev.modal = null; S.ev.pasteErr = '';
    treeApply(d, m ? m.value : 'replace', 'Claude (pasted)');
  },
  evClaude: () => evStart('claude'),
  evStarter: () => evStart('starter'),
  evGo: d => evRun(S.ev.ask, d.mode),
  evCancelAsk: () => { S.ev.ask = null; render(); },
  evStop: () => { if (S.ev.ctl) S.ev.ctl.abort(); },
  evCopyPrompt: async () => {
    const text = EV.prompt(S.c, S.c.evidence.narrative, evNames);
    try { await navigator.clipboard.writeText(text); toast("Prompt copied. Paste it into Claude, then bring Claude's reply back with Paste Claude's answer."); }
    catch (e) { S.ev.modal = 'prompt'; render(); const t = $('#ev-prompt'); if (t) { t.focus(); t.select(); } }
  },
  evPaste: () => { S.ev.modal = 'paste'; S.ev.pasteErr = ''; render(); const t = $('#ev-paste'); if (t) t.focus(); },
  evModalClose: () => { S.ev.modal = null; S.ev.pasteErr = ''; render(); },
  evPasteUse: () => {
    const t = $('#ev-paste'), m = document.querySelector('input[name=ev-pmode]:checked');
    let plan;
    try { plan = EV.fromAnswer(EV.parseText(t ? t.value : ''), S.c.nodes.map(n => n.id)); }
    catch (e) { S.ev.pasteErr = 'That is not a plan this app can read: ' + e.message; const keep = t ? t.value : ''; render(); const n = $('#ev-paste'); if (n) { n.value = keep; n.focus(); } return; }
    S.ev.modal = null; S.ev.pasteErr = '';
    evApply(plan, m ? m.value : 'replace', "Claude (pasted)");
  },
  evFilter: d => { S.ev.filter = d.f; render(); },
  evAdd: d => {
    const E = S.c.evidence, L = d.list;
    const mk = { items: () => EV.mkItem({ cat: ['position', 'people', 'parts', 'paper', 'electronic'].indexOf(S.ev.filter) >= 0 ? S.ev.filter : 'position', priority: 'Normal' }), photos: () => EV.mkPhoto({}), tests: () => EV.mkTest({}) }[L];
    E[L].push(mk()); if (L === 'items') S.ev.filter = ['position', 'people', 'parts', 'paper', 'electronic'].indexOf(S.ev.filter) >= 0 ? S.ev.filter : 'all';
    changed('Added a line to the evidence plan', 'evidence'); render();
    const k = { items: 'item', photos: 'subject', tests: 'statement' }[L], el = $(`#ev-${L}-${k}-${E[L].length - 1}`); if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); }
  },
  evDel: d => { S.c.evidence[d.list].splice(+d.i, 1); changed('Deleted a line from the evidence plan', 'evidence'); render(); },
  evMove: d => { const P = S.c.evidence.photos, i = +d.i, j = i + (+d.d); if (j < 0 || j >= P.length) return; [P[i], P[j]] = [P[j], P[i]]; changed('Reordered the photography schedule', 'evidence'); render(); }
};

/* ---------- Tree workbench ---------------------------------------------- */
function symIcon(type, w, h) {
  w = w || 30; h = h || 20;
  const fill = { event: '#d7262e', object: '#1f8f4e', ic: '#9aa1a8', pc: '#2f6db5', uc: '#f2c230', agent: 'url(#tbStripe)' }[type];
  let s = '';
  const f = Math.max(3, Math.round(h * 0.17)), mid = h / 2;
  if (R.BARRIERS[type]) {
    const q = Math.round(h * 0.42), cx = w / 2, y = mid - q / 2;
    s += `<line x1="0" y1="${mid}" x2="${w}" y2="${mid}" stroke="#555" stroke-width="1.2"/>`;
    if (type === 'failed') s += `<rect x="${cx - q - 2}" y="${y}" width="${q}" height="${q}" fill="#141414"/><rect x="${cx + 2}" y="${y}" width="${q}" height="${q}" fill="#141414"/>`;
    else if (type === 'effective') s += `<rect x="${cx - q - 2}" y="${y}" width="${2 * q + 4}" height="${q}" fill="#141414"/>`;
    else s += `<rect x="${cx - q - 2}" y="${y}" width="${q}" height="${q}" fill="#fff" stroke="#141414" stroke-dasharray="2 1.5"/><rect x="${cx + 2}" y="${y}" width="${q}" height="${q}" fill="#fff" stroke="#141414" stroke-dasharray="2 1.5"/>`;
    if (type === 'inadequate') s += `<line x1="${cx - q - 4}" y1="${y + q + 3}" x2="${cx + q + 4}" y2="${y + q + 3}" stroke="#141414" stroke-width="1.5"/>`;
  } else if (type === 'narrative') {
    s += `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" fill="#fbfaf2" stroke="#8b8a7a" stroke-dasharray="3 2"/><line x1="5" y1="${mid - 3}" x2="${w - 5}" y2="${mid - 3}" stroke="#8b8a7a"/><line x1="5" y1="${mid + 3}" x2="${w - 9}" y2="${mid + 3}" stroke="#8b8a7a"/>`;
  } else {
    if (type === 'eventAgent' || type === 'eventObject') s += `<rect width="${w}" height="${h}" rx="2" fill="#d7262e"/><rect width="${w}" height="${mid}" fill="${type === 'eventAgent' ? 'url(#tbStripe)' : '#1f8f4e'}"/>`;
    else s += `<rect width="${w}" height="${h}" rx="2" fill="${fill}"/>`;
    s += `<rect x="${f}" y="${f}" width="${w - 2 * f}" height="${h - 2 * f}" rx="1" fill="#fff"/>`;
    if (type === 'uc') s += `<rect x="${w - f - 9}" y="${h - f - 6}" width="9" height="6" fill="#141414"/>`;
  }
  return `<svg class="sym" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${s}</svg>`;
}
function benchHTML() {
  const pal = C.PALETTE.map(g => `<div class="pal-group"><span class="eyebrow">${esc(g.title)}</span>${g.types.map(t => `<button class="pal-item" draggable="${!S.readonly}" data-pal="${t}" title="${esc(TY[t].def)}"${S.readonly ? ' disabled' : ''}>${symIcon(t)}<span>${esc(TY[t].name)}</span></button>`).join('')}${g.note ? `<span class="small muted">${esc(g.note)}</span>` : ''}</div>`).join('');
  const stages = prefs.coach ? C.STAGES.map(s => `<div class="stage-card"><b>${s.n}. ${esc(s.title)}</b></div>`).join('') : '';
  return `<div class="bench">
    <aside class="palette" aria-label="Tree elements">${pal}${stages ? `<div class="pal-group"><span class="eyebrow">Three stages</span>${stages}</div>` : ''}</aside>
    <div class="canvas-wrap" id="cw">
      <svg id="cv" role="img" aria-label="Tripod Beta tree canvas"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="var(--grid)"/></pattern></defs><rect id="cv-bg" width="100%" height="100%" fill="${S.grid ? 'url(#grid)' : 'none'}"/><g id="vp"></g></svg>
      <div class="toolbar no-print">
        <div class="grp"><button class="btn sm" data-act="undo" title="Undo (Ctrl/Cmd+Z)"${S.readonly ? ' disabled' : ''}>Undo</button><button class="btn sm" data-act="redo" title="Redo (Shift+Ctrl/Cmd+Z)"${S.readonly ? ' disabled' : ''}>Redo</button></div>
        <div class="grp"><button class="btn sm" data-act="zoomOut" aria-label="Zoom out">−</button><span class="zoomlbl" id="zoomlbl">${Math.round(S.view.k * 100)}%</span><button class="btn sm" data-act="zoomIn" aria-label="Zoom in">+</button><button class="btn sm" data-act="fit">Fit</button></div>
        <div class="grp"><button class="btn sm" data-act="tidy" title="Arrange the tree automatically"${S.readonly ? ' disabled' : ''}>Tidy layout</button><button class="btn sm" data-act="toggleGrid">${S.grid ? 'Hide' : 'Show'} grid</button></div>
        <div class="grp"><button class="btn sm" data-act="toggleCoach" aria-pressed="${!!prefs.coach}">Coach ${prefs.coach ? 'on' : 'off'}</button></div>
        <span class="spacer"></span>
        <div class="grp" id="issue-chip"></div>
      </div>
      <div class="hint no-print">Drag elements from the palette · drag the round handle on a node to link it · click a line to select it · drag the background or Shift+scroll to pan, scroll wheel or pinch to zoom · Delete removes the selection</div>
    </div>
    <aside class="inspector" id="insp" aria-label="Inspector"></aside>
  </div>`;
}
function issueChip() {
  const el = $('#issue-chip'); if (!el) return;
  const is = issues(), e = is.filter(i => i.sev === 'error').length, w = is.filter(i => i.sev === 'warning').length;
  el.innerHTML = `<button class="btn sm" data-act="tab" data-t="checks">${e ? `<span class="count err">${e}</span> error${e > 1 ? 's' : ''}` : ''}${e && w ? ' ' : ''}${w ? `<span class="count warn">${w}</span> warning${w > 1 ? 's' : ''}` : ''}${!e && !w ? '<span class="count ok">✓</span> Tree rules met' : ''}</button>`;
}
function issueMap() {
  const m = {};
  issues().forEach(i => i.ids.forEach(id => { m[id] = m[id] || { error: 0, warning: 0, tip: 0 }; m[id][i.sev]++; }));
  return m;
}
function renderTree() {
  const vp = $('#vp'); if (!vp || !S.c) return;
  const r = X.renderTree(S.c, { interactive: true, sel: S.sel, selEdge: S.selEdge, issues: issueMap(), hl: S.hl, p: 'tb' });
  vp.innerHTML = r.body + (drag && drag.kind === 'link' ? `<path class="ghost-link" id="ghost" d=""/>` : '') + (drag && drag.kind === 'band' ? `<rect class="band" id="band"/>` : '');
  applyView(); issueChip(); updateBadge();
}
function applyView() {
  const vp = $('#vp'); if (vp) vp.setAttribute('transform', `translate(${S.view.x},${S.view.y}) scale(${S.view.k})`);
  const z = $('#zoomlbl'); if (z) z.textContent = Math.round(S.view.k * 100) + '%';
}
function fit() {
  const svg = $('#cv'); if (!svg || !S.c) return;
  const b = X.renderTree(S.c, {}).bbox, W = svg.clientWidth || 800, H = svg.clientHeight || 500;
  const k = Math.max(0.2, Math.min(1.25, (W - 60) / Math.max(b.w, 1), (H - 110) / Math.max(b.h, 1)));
  S.view = { k, x: (W - b.w * k) / 2 - b.x * k, y: 56 + (H - 80 - b.h * k) / 2 - b.y * k };
  applyView();
}
function zoomAt(f, cx, cy) {
  const k = Math.max(0.15, Math.min(2.5, S.view.k * f));
  S.view.x = cx - (cx - S.view.x) * (k / S.view.k); S.view.y = cy - (cy - S.view.y) * (k / S.view.k); S.view.k = k; applyView();
}
const toWorld = (svg, ev) => { const r = svg.getBoundingClientRect(); return { x: (ev.clientX - r.left - S.view.x) / S.view.k, y: (ev.clientY - r.top - S.view.y) / S.view.k, sx: ev.clientX - r.left, sy: ev.clientY - r.top }; };

let drag = null;
const capture = (el, ev) => { try { el.setPointerCapture(ev.pointerId); } catch (e) {} };
function mountCanvas() {
  const svg = $('#cv');
  renderTree(); renderInspector();
  if (S.fitPending) { S.fitPending = false; requestAnimationFrame(fit); }
  svg.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    const p = toWorld(svg, ev);
    const port = ev.target.closest('[data-port]'), nd = ev.target.closest('.node'), ed = ev.target.closest('[data-edge]');
    if (port && !S.readonly) { drag = { kind: 'link', from: port.getAttribute('data-port'), p0: p }; renderTree(); capture(svg, ev); return; }
    if (nd) {
      const id = nd.getAttribute('data-id');
      if (ev.shiftKey || ev.metaKey || ev.ctrlKey) { if (S.sel.has(id)) S.sel.delete(id); else S.sel.add(id); }
      else if (!S.sel.has(id)) S.sel = new Set([id]);
      S.selEdge = null;
      drag = { kind: 'move', p0: p, start: Array.from(S.sel).map(i => { const n = node(i); return n ? { n, x: n.x, y: n.y } : null; }).filter(Boolean), moved: false };
      capture(svg, ev); renderTree(); renderInspector(); return;
    }
    if (ed) { S.selEdge = ed.getAttribute('data-edge'); S.sel.clear(); renderTree(); renderInspector(); return; }
    if (ev.shiftKey && !S.readonly) { drag = { kind: 'band', p0: p }; renderTree(); capture(svg, ev); return; }
    drag = { kind: 'pan', sx: ev.clientX, sy: ev.clientY, vx: S.view.x, vy: S.view.y, moved: false };
    svg.classList.add('panning'); capture(svg, ev);
  });
  svg.addEventListener('pointermove', ev => {
    if (!drag) return;
    const p = toWorld(svg, ev);
    if (drag.kind === 'pan') { const dx = ev.clientX - drag.sx, dy = ev.clientY - drag.sy; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true; S.view.x = drag.vx + dx; S.view.y = drag.vy + dy; applyView(); }
    else if (drag.kind === 'move' && !S.readonly) {
      const dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
      if (!drag.moved) { pushUndo(); drag.moved = true; }
      drag.start.forEach(s => { s.n.x = Math.round((s.x + dx) / 10) * 10; s.n.y = Math.round((s.y + dy) / 10) * 10; });
      const r = X.renderTree(S.c, { interactive: true, sel: S.sel, selEdge: S.selEdge, issues: issueMap(), hl: S.hl, p: 'tb' });
      $('#vp').innerHTML = r.body;
    } else if (drag.kind === 'link') {
      const a = node(drag.from), g = X.geom(a), gh = $('#ghost');
      if (gh) gh.setAttribute('d', `M${a.x + g.w},${a.y + g.ay} L${p.x},${p.y}`);
    } else if (drag.kind === 'band') {
      const b = $('#band'); const x = Math.min(p.x, drag.p0.x), y = Math.min(p.y, drag.p0.y);
      if (b) { b.setAttribute('x', x); b.setAttribute('y', y); b.setAttribute('width', Math.abs(p.x - drag.p0.x)); b.setAttribute('height', Math.abs(p.y - drag.p0.y)); }
      drag.p1 = p;
    }
  });
  const end = ev => {
    if (!drag) return;
    const d = drag; drag = null; svg.classList.remove('panning');
    if (d.kind === 'pan' && !d.moved) { S.sel.clear(); S.selEdge = null; renderTree(); renderInspector(); return; }
    if (d.kind === 'move' && d.moved) { changed('Moved elements', 'move'); renderTree(); return; }
    if (d.kind === 'link') {
      const p = toWorld(svg, ev), pad = 10;
      const hit = S.c.nodes.slice().reverse().find(n => { const g = X.geom(n); return n.id !== d.from && p.x >= n.x - pad && p.x <= n.x + g.w + pad && p.y >= n.y - pad && p.y <= n.y + g.h + pad; });
      if (hit) { pushUndo(); if (!link(d.from, hit.id)) S.undo.pop(); }
      renderTree(); renderInspector(); return;
    }
    if (d.kind === 'band' && d.p1) {
      const x0 = Math.min(d.p0.x, d.p1.x), x1 = Math.max(d.p0.x, d.p1.x), y0 = Math.min(d.p0.y, d.p1.y), y1 = Math.max(d.p0.y, d.p1.y);
      S.sel = new Set(S.c.nodes.filter(n => { const g = X.geom(n); return n.x >= x0 && n.y >= y0 && n.x + g.w <= x1 && n.y + g.h <= y1; }).map(n => n.id));
      renderTree(); renderInspector(); return;
    }
    renderTree();
  };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', () => { drag = null; renderTree(); });
  svg.addEventListener('wheel', ev => {
    // scroll wheel zooms around the pointer (pinch arrives as ctrl+wheel); Shift+scroll pans
    ev.preventDefault();
    const r = svg.getBoundingClientRect();
    if (ev.shiftKey) { S.view.x -= ev.deltaX; S.view.y -= ev.deltaY; applyView(); return; }
    const d = ev.deltaY * (ev.deltaMode === 1 ? 33 : ev.deltaMode === 2 ? 400 : 1);
    zoomAt(Math.exp(ev.ctrlKey ? -d * 0.01 : -Math.max(-100, Math.min(100, d)) * 0.0015), ev.clientX - r.left, ev.clientY - r.top);
  }, { passive: false });
  svg.addEventListener('dblclick', ev => { if (ev.target.closest('.node')) focusLabel(); });
  // palette: drag and drop, or click to add at the centre of the view
  $$('.pal-item').forEach(b => {
    b.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', 'tb:' + b.dataset.pal); ev.dataTransfer.effectAllowed = 'copy'; });
    b.addEventListener('click', () => { const W = svg.clientWidth, H = svg.clientHeight; addNode(b.dataset.pal, (W / 2 - S.view.x) / S.view.k - 75, (H / 2 - S.view.y) / S.view.k - 32); });
  });
  svg.addEventListener('dragover', ev => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; });
  svg.addEventListener('drop', ev => {
    ev.preventDefault(); const t = (ev.dataTransfer.getData('text/plain') || '').replace(/^tb:/, '');
    if (!TY[t] || S.readonly) return;
    const p = toWorld(svg, ev);
    const hitEdge = ev.target.closest && ev.target.closest('[data-edge]');
    if (hitEdge && R.BARRIERS[t]) { insertBarrier(hitEdge.getAttribute('data-edge'), t); return; }
    addNode(t, p.x - 75, p.y - 30);
  });
}

/* ---------- inspector ---------------------------------------------------- */
const TYPE_GROUPS = [['event', 'eventAgent', 'eventObject'], ['agent', 'eventAgent'], ['object', 'eventObject'], ['failed', 'missing', 'inadequate', 'effective']];
function siblingsOf(t) { const g = TYPE_GROUPS.filter(x => x.indexOf(t) >= 0); const s = new Set(); g.forEach(x => x.forEach(y => s.add(y))); return Array.from(s); }
function coachHTML(n) {
  if (!prefs.coach) return '';
  const t = TY[n.type];
  let s = `<div class="coach"><b>${esc(t.name)}</b><p>${esc(t.def)}</p><ul>${t.tips.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  if (n.type === 'ic' && n.errorType) { const e = C.ERRORS.find(x => x.code === n.errorType); if (e) s += `<p><b>${esc(e.name)}:</b> ${esc(e.def)} Typical Preconditions: ${esc(e.pre.join('; '))}.</p><span class="ref">User Guide Annex 3</span>`; }
  if (n.type === 'uc' && n.brf) { const b = C.BRF.find(x => x.code === n.brf); if (b) s += `<p><b>${b.code} ${esc(b.name)}:</b> ${esc(b.def)}</p><span class="ref">User Guide Annex 4</span>`; }
  return s + '</div>';
}
function nodeIssuesHTML(id) {
  const is = issues().filter(i => i.ids.indexOf(id) >= 0);
  if (!is.length) return '';
  return `<div class="issues">${is.map(i => `<div class="issue ${i.sev}" style="grid-template-columns:minmax(0,1fr)"><span class="sev">${i.sev}</span><span>${esc(i.msg)} <span class="ref">${esc(i.ref)}</span></span></div>`).join('')}</div>`;
}
function renderInspector() {
  const el = $('#insp'); if (!el || !S.c) return;
  const ro = fieldDis(), sd = selDis();
  if (S.selEdge) {
    const e = S.c.edges.find(x => x.id === S.selEdge);
    if (!e) { S.selEdge = null; return renderInspector(); }
    const a = node(e.from), b = node(e.to), kind = R.edgeKind(a.type, b.type);
    el.innerHTML = `<h3>Link</h3><p class="small">${esc(TY[a.type].name)} <b>${esc(a.label || '(no label)')}</b> → ${esc(TY[b.type].name)} <b>${esc(b.label || '(no label)')}</b></p>
      <p class="small muted">${kind === 'trajectory' ? 'A trajectory: the path along which the Agent or Object reaches the Event. Barriers sit on it.' : kind === 'probable' ? 'Precondition to Immediate Cause: probabilistic, so drawn dotted.' : kind === 'note' ? 'Narrative link.' : 'Causal link in the Tripod causation path.'}</p>
      ${S.readonly ? '' : `<div class="quick">${kind === 'trajectory' ? `<button class="btn sm primary" data-act="insBarrier" data-t="failed">Insert Failed Barrier</button><button class="btn sm" data-act="insBarrier" data-t="effective">Insert Effective Barrier</button><button class="btn sm" data-act="insBarrier" data-t="missing">Insert Missing Barrier</button>` : ''}<button class="btn sm danger" data-act="delSel">Remove link</button></div>`}`;
    return;
  }
  if (S.sel.size > 1) {
    el.innerHTML = `<h3>${S.sel.size} elements selected</h3><p class="small muted">Drag any of them to move the group. Shift-click to add or remove elements.</p>${S.readonly ? '' : '<div class="quick"><button class="btn sm danger" data-act="delSel">Delete selected</button></div>'}`;
    return;
  }
  if (!S.sel.size) {
    const tr = R.trios(S.c), M = X.model(S.c);
    el.innerHTML = `<h3>Tree overview</h3>
      <div class="stats"><div class="stat"><b>${tr.length}</b><span>trios</span></div><div class="stat"><b>${M.counts.failed}</b><span>failed barriers</span></div><div class="stat"><b>${M.counts.uc}</b><span>underlying causes</span></div><div class="stat"><b>${M.counts.actions}</b><span>actions</span></div></div>
      ${prefs.coach ? C.STAGES.map(s => `<div class="coach"><b>${s.n}. ${esc(s.title)}</b><p>${esc(s.body)}</p></div>`).join('') : ''}
      <p class="small muted">Select an element to edit it. Select a line to insert a barrier on it.</p>`;
    return;
  }
  const n = node(Array.from(S.sel)[0]);
  if (!n) { S.sel.clear(); return renderInspector(); }
  const t = TY[n.type], ix = R.index(S.c);
  const sib = siblingsOf(n.type);
  const ins = ix.ins[n.id].map(e => ({ e, o: node(e.from), dir: 'from' })), outs = ix.outs[n.id].map(e => ({ e, o: node(e.to), dir: 'to' }));
  const isLinked = m => S.c.edges.some(e => (e.from === n.id && e.to === m.id) || (e.to === n.id && e.from === m.id));
  const others = S.c.nodes.filter(m => m.id !== n.id && !isLinked(m));
  const cand = (from, to) => R.canConnect(from.type, to.type).ok ? '' : (routePlan(from, to) || {}).label;
  const before = others.map(m => ({ m, via: cand(m, n) })).filter(x => x.via !== undefined);
  const after = others.map(m => ({ m, via: cand(n, m) })).filter(x => x.via !== undefined);
  const linkOpts = list => list.map(({ m, via }) => `<option value="${esc(m.id)}">${esc(TY[m.type].short)}: ${esc((m.label || '(no label)').slice(0, 60))}${via ? ' (' + esc(via) + ')' : ''}</option>`).join('');
  const acts = S.c.actions.filter(a => a.target === n.id);
  let typeFields = '';
  if (n.type === 'ic') {
    typeFields = `<label class="field"><span>Kind</span><select id="f-act" data-nf="act"${sd}><option value="act"${n.act !== 'condition' ? ' selected' : ''}>Sub-standard act (a person)</option><option value="condition"${n.act === 'condition' ? ' selected' : ''}>Sub-standard condition (technical, by exception)</option></select></label>
      <label class="field"><span>Error type (Annex 3)</span><select id="f-err" data-nf="errorType"${sd}><option value="">Not classified</option>${['Unintended action', 'Intended action', 'Violation'].map(g => `<optgroup label="${g}">${C.ERRORS.filter(e => e.group === g).map(e => `<option value="${e.code}"${n.errorType === e.code ? ' selected' : ''}>${esc(e.name)}</option>`).join('')}</optgroup>`).join('')}</select></label>
      <label class="field"><span>Reason if no Precondition (uncontrollable outside party)</span><input id="f-just" data-nf="justification" value="${esc(n.justification || '')}"${ro}></label>`;
  } else if (n.type === 'pc') {
    typeFields = `<label class="field"><span>Scope</span><select id="f-scope" data-nf="scope"${sd}><option value="org"${n.scope !== 'external' ? ' selected' : ''}>Organisational (needs an Underlying Cause)</option><option value="external"${n.scope === 'external' ? ' selected' : ''}>External or natural (may be an end node)</option></select></label>`;
  } else if (n.type === 'uc') {
    typeFields = `<label class="field"><span>Basic Risk Factor</span><select id="f-brf" data-nf="brf"${sd}><option value="">Not assigned</option>${C.BRF.map(b => `<option value="${b.code}"${n.brf === b.code ? ' selected' : ''}>${b.code} · ${esc(b.name)}</option>`).join('')}</select></label>`;
  } else if (R.EVENTS[n.type]) {
    typeFields = `<label class="check"><input type="checkbox" id="f-main" data-nf="mainEvent"${n.mainEvent ? ' checked' : ''}${sd}> Main event (the reason for the investigation)</label>`;
  }
  const quick = [];
  if (!S.readonly) {
    if (R.EVENTS[n.type]) {
      const trio = R.trios(S.c, ix).find(x => x.event.id === n.id);
      if (trio && !trio.agents.length) quick.push(['agent', 'Add Agent input']);
      if (trio && !trio.objects.length) quick.push(['object', 'Add Object input']);
      if (trio && trio.agents.length) quick.push(['barrierAgent', 'Barrier on Agent side']);
      if (trio && trio.objects.length) quick.push(['barrierObject', 'Barrier on Object side']);
      if (!ix.outN(n.id).length) quick.push(['next', 'Add subsequent event']);
    }
    if (n.type === 'agent') quick.push(['priorAgent', 'Add prior trio (makes this an Event-Agent)']);
    if (n.type === 'object') quick.push(['priorObject', 'Add prior trio (makes this an Event-Object)']);
    if (n.type === 'failed' && !ix.inN(n.id, m => m.type === 'ic').length) quick.push(['ic', 'Add Immediate Cause']);
    if (n.type === 'missing' || n.type === 'inadequate') quick.push(['uc', 'Add Underlying Cause']);
    if (n.type === 'ic') quick.push(['pc', 'Add Precondition']);
    if (n.type === 'pc' && n.scope !== 'external') quick.push(['uc', 'Add Underlying Cause']);
  }
  const lr = (x) => `<div class="link-row"><span class="dir">${x.dir === 'from' ? '←' : '→'}</span><span title="${esc(x.o.label)}">${esc(TY[x.o.type].short)}: ${esc(x.o.label || '(no label)')}</span><button class="btn sm ghost" data-act="selNode" data-id="${esc(x.o.id)}">Show</button>${S.readonly ? '' : `<button class="xbtn" data-act="unlink" data-id="${esc(x.e.id)}" aria-label="Remove link">×</button>`}</div>`;
  el.innerHTML = `<h3>${symIcon(n.type, 34, 22)}${esc(t.name)}</h3>
    ${sib.length > 1 && !S.readonly ? `<label class="field"><span>Element type</span><select id="f-type" data-act-change="setType">${sib.map(s => `<option value="${s}"${s === n.type ? ' selected' : ''}>${esc(TY[s].name)}</option>`).join('')}</select></label>` : ''}
    <label class="field"><span>Description</span><textarea id="f-label" data-nf="label" rows="3"${ro}>${esc(n.label)}</textarea></label>
    ${typeFields}
    ${quick.length ? `<div class="quick">${quick.map(q => `<button class="btn sm" data-act="quick" data-k="${q[0]}">${esc(q[1])}</button>`).join('')}</div>` : ''}
    ${nodeIssuesHTML(n.id)}
    ${R.ACTIONABLE[n.type] ? `<div><span class="lbl">Recommended actions</span>${acts.length ? `<ul class="small" style="margin:4px 0;padding-left:18px">${acts.map(a => `<li>${esc(a.text || '(no text)')} <span class="muted">${esc(a.owner || '')}${a.due ? ' · ' + esc(a.due) : ''}</span></li>`).join('')}</ul>` : '<p class="small muted">None yet.</p>'}${S.readonly ? '' : `<button class="btn sm" data-act="addActionFor" data-id="${esc(n.id)}">Add action</button>`}</div>` : ''}
    <div><span class="lbl">Links</span><div class="links">${ins.concat(outs).map(lr).join('') || '<p class="small muted">Not linked yet. Drag the round handle on the node onto another element.</p>'}</div>
    ${!S.readonly && before.length ? `<label class="field" style="margin-top:6px"><span>Link a preceding element (it leads into this one)</span><select id="f-linkfrom" data-act-change="linkFrom"><option value="">Choose an element\u2026</option>${linkOpts(before)}</select></label>` : ''}
    ${!S.readonly && after.length ? `<label class="field" style="margin-top:6px"><span>Link a following element (this one leads into it)</span><select id="f-linkto" data-act-change="linkTo"><option value="">Choose an element\u2026</option>${linkOpts(after)}</select></label>` : ''}</div>
    <label class="field"><span>Notes</span><textarea id="f-notes" data-nf="notes" rows="2"${ro}>${esc(n.notes || '')}</textarea></label>
    <label class="field"><span>Evidence / source</span><input id="f-ev" data-nf="evidence" value="${esc(n.evidence || '')}" placeholder="e.g. Witness statement W3, PTW 2231, photo P12"${ro}></label>
    ${n.type !== 'narrative' ? `<label class="check"><input type="checkbox" id="f-ver" data-nf="verified"${n.verified !== false ? ' checked' : ''}${sd}> Confirmed by evidence (clear to mark as assumed)</label>` : ''}
    ${coachHTML(n)}
    ${S.readonly ? '' : '<div class="quick"><button class="btn sm danger" data-act="delSel">Delete element</button></div>'}`;
}

/* ---------- Checks tab ---------------------------------------------------- */
function checksHTML() {
  const is = issues(), f = S.issueFilter;
  const list = is.filter(i => f === 'all' || i.sev === f);
  const n = s => is.filter(i => i.sev === s).length;
  const lab = id => { const x = node(id); return x ? x.label : ''; };
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Quality check</span><h1>Tripod Beta rules check</h1><p class="muted">Checked live against the tree rules (User Guide Annex 5 and 6), the quality tips (Annex 2) and the requirement for an action on every Failed/Missing Barrier and Underlying Cause.</p></div>
    <div class="row" role="group" aria-label="Filter">${[['all', 'All', is.length], ['error', 'Errors', n('error')], ['warning', 'Warnings', n('warning')], ['tip', 'Tips', n('tip')]].map(([k, l, c]) => `<button class="btn sm${f === k ? ' primary' : ''}" data-act="issueFilter" data-f="${k}">${l} ${c}</button>`).join('')}</div></div>
    ${!n('error') && !n('warning') ? '<div class="allclear">The tree meets every rule checked. Each Failed or Missing Barrier and Underlying Cause has at least one action.</div>' : ''}
    <div class="issues">${list.map(i => `<div class="issue ${i.sev}"><span class="sev">${i.sev}</span><div><div>${esc(i.msg)}</div><span class="ref">${esc(i.code)} · ${esc(i.ref)}</span></div>${i.ids.length ? `<button class="btn sm" data-act="showIssue" data-ids="${esc(i.ids.join(','))}" title="${esc(lab(i.ids[0]))}">Show on tree</button>` : '<span></span>'}</div>`).join('') || (is.length ? '<p class="muted">Nothing in this filter.</p>' : '')}</div>
  </div>`;
}

/* ---------- Actions tab --------------------------------------------------- */
function actionsHTML() {
  const ro = fieldDis(), sd = selDis();
  const targets = S.c.nodes.filter(n => R.ACTIONABLE[n.type]);
  const uncovered = targets.filter(n => !S.c.actions.some(a => a.target === n.id && a.status !== 'Cancelled'));
  const f = S.actFilter;
  const rows = S.c.actions.map((a, i) => ({ a, i })).filter(x => f === 'all' || (f === 'open' ? (x.a.status === 'Open' || x.a.status === 'In progress') : x.a.status === f));
  const tOpt = a => `<option value="">Not linked</option>${['failed', 'missing', 'inadequate', 'uc'].map(ty => { const ns = targets.filter(n => n.type === ty); return ns.length ? `<optgroup label="${esc(TY[ty].name)}s">${ns.map(n => `<option value="${esc(n.id)}"${a.target === n.id ? ' selected' : ''}>${esc((n.label || '(no label)').slice(0, 70))}${n.brf ? ' [' + n.brf + ']' : ''}</option>`).join('')}</optgroup>` : ''; }).join('')}`;
  const st = ['Open', 'In progress', 'Done', 'Cancelled'];
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Step 6 · Remedial actions</span><h1>Recommended actions</h1><p class="muted">Actions on Failed Barriers restore the barrier locally. Actions on Underlying Causes correct the management system and usually take longer and need management endorsement.</p></div>
      <div class="row">${[['all', 'All'], ['open', 'Open'], ['Done', 'Done']].map(([k, l]) => `<button class="btn sm${f === k ? ' primary' : ''}" data-act="actFilter" data-f="${k}">${l}</button>`).join('')}${S.readonly ? '' : '<button class="btn primary" data-act="addAction">Add action</button>'}</div></div>
    ${uncovered.length ? `<section class="panel"><h3>Still needs an action (${uncovered.length})</h3><div class="links">${uncovered.map(n => `<div class="link-row"><span>${esc(TY[n.type].name)}: ${esc(n.label || '(no label)')}${n.brf ? ' [' + n.brf + ']' : ''}</span>${S.readonly ? '' : `<button class="btn sm" data-act="addActionFor" data-id="${esc(n.id)}">Add action</button>`}</div>`).join('')}</div></section>` : (targets.length ? '<div class="allclear">Every Failed/Missing Barrier and Underlying Cause has at least one action.</div>' : '')}
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th style="min-width:200px">Addresses</th><th style="min-width:260px">Action</th><th>Owner</th><th>Due</th><th>Priority</th><th>Status</th><th title="Specific, Measurable, Appropriate, Realistic, Time-based">SMART</th><th></th></tr></thead><tbody>
    ${rows.map(({ a, i }) => `<tr data-row="${i}">
      <td class="mono">${i + 1}</td>
      <td><select class="tgt" id="a-tgt-${i}" data-af="target"${sd}>${tOpt(a)}</select></td>
      <td><textarea id="a-text-${i}" data-af="text" rows="2"${ro}>${esc(a.text)}</textarea><input id="a-close-${i}" data-af="closeNote" placeholder="Close-out note / evidence" value="${esc(a.closeNote || '')}" style="margin-top:4px"${ro}></td>
      <td><input id="a-owner-${i}" data-af="owner" value="${esc(a.owner)}"${ro}><label class="check small" style="margin-top:4px"><input type="checkbox" id="a-agreed-${i}" data-af="agreed"${a.agreed ? ' checked' : ''}${sd}> Agreed by owner</label></td>
      <td><input type="date" id="a-due-${i}" data-af="due" value="${esc(a.due)}"${ro}></td>
      <td><select id="a-pri-${i}" data-af="priority"${sd}>${['High', 'Medium', 'Low'].map(p => `<option${a.priority === p ? ' selected' : ''}>${p}</option>`).join('')}</select></td>
      <td><select id="a-st-${i}" data-af="status"${sd}>${st.map(p => `<option${a.status === p ? ' selected' : ''}>${p}</option>`).join('')}</select></td>
      <td><div class="smart">${C.SMART.map(s => `<label title="${esc(s.name + ': ' + s.q)}">${s.k}<input type="checkbox" id="a-sm-${s.k}-${i}" data-smart="${s.k}"${a.smart && a.smart[s.k] ? ' checked' : ''}${sd}></label>`).join('')}</div></td>
      <td>${S.readonly ? '' : `<button class="xbtn" data-act="actDel" data-i="${i}" aria-label="Delete action">×</button>`}</td></tr>`).join('') || `<tr><td colspan="9" class="muted">No actions${f !== 'all' ? ' in this filter' : ' yet'}.</td></tr>`}
    </tbody></table></div>
    ${prefs.coach ? `<div class="coach"><b>SMART actions (User Guide 6.6)</b><ul>${C.SMART.map(s => `<li><b>${s.name}:</b> ${esc(s.q)}</li>`).join('')}</ul><p>Actions should be developed within the affected organisation, agreed by the action party, and stretch the organisation without being out of reach.</p></div>` : ''}
  </div>`;
}

/* ---------- BRF tab --------------------------------------------------------- */
function brfHTML() {
  const M = X.model(S.c), mx = Math.max(1, ...M.brf.map(b => b.n));
  const ics = S.c.nodes.filter(n => n.type === 'ic');
  const errs = C.ERRORS.map(e => ({ e, n: ics.filter(i => i.errorType === e.code).length })).filter(x => x.n);
  const emx = Math.max(1, ...errs.map(x => x.n));
  const uncl = ics.filter(i => !i.errorType && i.act !== 'condition').length, cond = ics.filter(i => i.act === 'condition').length;
  const noBrf = S.c.nodes.filter(n => n.type === 'uc' && !n.brf).length;
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Classification</span><h1>Basic Risk Factor profile</h1><p class="muted">Underlying Causes classified against the eleven Tripod BRFs show where in the management system the remedy lies. Profiles across many investigations show the overall risk status of an operation.</p></div></div>
    <div class="stats"><div class="stat"><b>${M.trios.length}</b><span>trios</span></div><div class="stat"><b>${M.counts.failed}</b><span>failed barriers</span></div><div class="stat"><b>${M.counts.missing}</b><span>missing / inadequate</span></div><div class="stat"><b>${M.counts.effective}</b><span>effective barriers</span></div><div class="stat"><b>${M.counts.uc}</b><span>underlying causes</span></div></div>
    <div class="cols2">
      <section class="panel"><h2>Underlying Causes by BRF</h2>${noBrf ? `<p class="small" style="color:var(--warn)">${noBrf} Underlying Cause${noBrf > 1 ? 's have' : ' has'} no BRF yet.</p>` : ''}
        ${M.brf.map(b => `<div class="chart-row" title="${esc(C.BRF.find(x => x.code === b.code).def)}"><span><span class="code">${b.code}</span>${esc(b.name)}</span><span class="bar"><i style="width:${(b.n / mx) * 100}%"></i></span><span class="mono">${b.n}</span></div>`).join('')}</section>
      <section class="panel"><h2>Immediate Causes by error type</h2>
        ${errs.map(x => `<div class="chart-row" title="${esc(x.e.def)}"><span>${esc(x.e.name)}</span><span class="bar"><i style="width:${(x.n / emx) * 100}%"></i></span><span class="mono">${x.n}</span></div>`).join('') || '<p class="muted">No Immediate Causes classified yet.</p>'}
        ${cond ? `<p class="small muted" style="margin-top:8px">${cond} sub-standard condition(s) (technical, no human error type).</p>` : ''}${uncl ? `<p class="small" style="color:var(--warn);margin-top:4px">${uncl} sub-standard act(s) not classified.</p>` : ''}</section>
    </div>
    <section class="panel"><h2>Underlying Causes</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>BRF</th><th>Underlying Cause</th><th>Feeds</th><th>Actions</th></tr></thead><tbody>
      ${S.c.nodes.filter(n => n.type === 'uc').sort((a, b) => (a.brf || 'ZZ').localeCompare(b.brf || 'ZZ')).map(u => { const ix = R.index(S.c); const outs = ix.outN(u.id); return `<tr><td class="mono">${esc(u.brf || '–')}</td><td>${esc(u.label)}</td><td class="small">${outs.map(o => esc(TY[o.type].short + ': ' + o.label)).join('<br>')}</td><td class="mono">${S.c.actions.filter(a => a.target === u.id).length}</td></tr>`; }).join('') || '<tr><td colspan="4" class="muted">No Underlying Causes yet.</td></tr>'}
    </tbody></table></div></section>
  </div>`;
}

/* ---------- Report tab ------------------------------------------------------- */
function reportHTML() {
  const offline = !HAS_RUNTIME;
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Step 7 · Report</span><h1>Incident report</h1><p class="muted">Generated from the case details, the tree, the causation paths, the BRF profile and the action plan.</p></div></div>
    <section class="panel"><h3>Report</h3><div class="row">
      ${offline ? '<button class="btn primary" data-act="print">Print or save as PDF</button>' : ''}
      <button class="btn${offline ? '' : ' primary'}" data-act="exportDocx">Word document (.docx)</button>
      <button class="btn" data-act="exportReport">Web page (.html)</button></div>
      ${offline ? '' : '<p class="small muted" style="margin-top:6px">For a PDF, open the downloaded web page in a browser and print it, or save the Word document as PDF.</p>'}
    </section>
    <section class="panel"><h3>Tree and data</h3><div class="row">
      <button class="btn" data-act="exportSVG">Tree picture (.svg)</button><button class="btn" data-act="exportPNG">Tree picture (.png)</button>
      <button class="btn" data-act="exportDrawio">Tree for draw.io (${offline ? '.drawio' : '.drawio.svg'})</button>
      <button class="btn" data-act="exportCase">Case file (.json)</button><button class="btn" data-act="exportCasebook">Storyline Casebook package (.json)</button></div>
      <p class="small muted" style="margin-top:6px">The case file opens again here on any computer. The Casebook package imports into the Storyline Casebook (events, preconditions as conditions, Tripod elements as ICAM factors, underlying causes as root causes, actions).</p></section>
    <div class="rpt-frame" id="rpt"></div>
  </div>`;
}
function mountReport() {
  const el = $('#rpt'); if (!el) return;
  el.innerHTML = `<style>${X.REPORT_CSS}</style>` + X.reportBody(S.c, X.treeSVG(S.c, { noTitle: true }));
}

/* ---------- Method guide ------------------------------------------------- */
function guideHTML() {
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Reference</span><h1>Tripod Beta method guide</h1><p class="muted">Summarised from the Tripod Beta User Guide (Stichting Tripod Foundation): glossary, tree symbols, quality tips, error types and Basic Risk Factors.</p></div></div>
    <section class="panel"><h2>The three stages</h2><div class="guide-grid">${C.STAGES.map(s => `<div><h3>${s.n}. ${esc(s.title)}</h3><p>${esc(s.body)}</p></div>`).join('')}</div></section>
    <section class="panel"><h2>Tree symbols</h2><div class="guide-grid">${Object.keys(TY).map(k => `<div class="sym-row">${symIcon(k, 64, 40)}<div><b>${esc(TY[k].name)}</b><p class="small">${esc(TY[k].def)}</p></div></div>`).join('')}</div></section>
    <section class="panel"><h2>Tree rules</h2><ul>
      <li>An Event has exactly two inputs: one Agent of Change and one Object. One Agent may act on several Objects, and one Object may be hit by several Agents, each making a separate Event.</li>
      <li>Agents and Objects have no inputs. Event-Agent and Event-Object nodes chain trios together.</li>
      <li>A Failed Barrier has exactly one Immediate Cause. An Immediate Cause is usually linked to one Failed Barrier, occasionally to several.</li>
      <li>Preconditions promote Immediate Causes (many to one, drawn dotted). Underlying Causes create Preconditions (many to many).</li>
      <li>A Missing or Inadequate Barrier links only to Underlying Causes, never to an Immediate Cause or a Precondition.</li>
      <li>An Effective Barrier has no causation path; the Event it protects becomes a Potential Event.</li>
      <li>Every organisational Precondition needs an Underlying Cause. An Immediate Cause without an Underlying Cause is very exceptional (an uncontrollable outside party) and must be explained.</li>
      <li>Each Failed or Missing Barrier and each Underlying Cause should have at least one recommendation.</li></ul></section>
    <section class="panel"><h2>Quality tips (Annex 2)</h2><div class="guide-grid">${Object.keys(C.TIPS).map(k => `<div><h3>${esc(k)}</h3><ul class="small">${C.TIPS[k].map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}</div></section>
    <section class="panel"><h2>Errors, violations and their Preconditions (Annex 3)</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Error type</th><th>Description</th><th>Possible Preconditions</th></tr></thead><tbody>${C.ERRORS.map(e => `<tr><td><b>${esc(e.name)}</b></td><td>${esc(e.def)}</td><td>${esc(e.pre.join('; '))}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="panel"><h2>Basic Risk Factors (Annex 4)</h2><div class="tbl-wrap"><table class="tbl"><tbody>${C.BRF.map(b => `<tr><td class="mono"><b>${b.code}</b></td><td><b>${esc(b.name)}</b></td><td>${esc(b.def)}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="panel"><h2>Glossary (Annex 1)</h2><dl class="gl">${C.GLOSSARY.map(g => `<dt>${esc(g[0])}</dt><dd>${esc(g[1])}</dd>`).join('')}</dl></section>
  </div>`;
}

/* ---------- files: save / open ------------------------------------------- */
async function saveFile(name, data, mime) {
  if (HAS_RUNTIME) {
    const dl = Store.dl || await window.claude.use('downloads').catch(() => null);
    if (!dl) { toast('Saving files is not available in this view.'); return; }
    try { await dl.save({ filename: name, data: data instanceof Uint8Array ? new Blob([data], { type: mime }) : data }); }
    catch (e) { if (e && e.code !== 'declined') toast('Not saved: ' + (e.message || e.code) + '.'); }
    return;
  }
  try {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (e) { toast('This browser could not save the file.'); }
}
function pickFile(accept, cb) {
  const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.style.display = 'none';
  i.onchange = () => { const f = i.files && i.files[0]; i.remove(); if (f) cb(f); };
  document.body.appendChild(i); i.click();
}
const fileBase = () => slug((S.c.meta.ref ? S.c.meta.ref + '-' : '') + S.c.meta.title);
function caseFile(c) { return JSON.stringify({ format: 'tripod-beta-case', version: 1, exportedAt: nowISO(), app: 'Istec Training Tripod Beta Investigator', case: c }, null, 1); }
function importCase(file) {
  file.text().then(t => {
    let o; try { o = JSON.parse(t); } catch (e) { toast('That file is not a valid case file (it is not JSON).'); return; }
    const c = o && o.format === 'tripod-beta-case' ? o.case : (o && o.nodes && o.meta ? o : null);
    if (!c) { toast('That file is not a Tripod Beta case file.'); return; }
    const exists = Store.list.some(x => x.id === c.id) || c.example;
    if (exists) { c.id = uid('tb-'); c.meta = c.meta || {}; c.meta.title = (c.meta.title || 'Imported case') + ' (imported copy)'; delete c.example; }
    createCase(normalise(c), 'Opened from file ' + file.name);
  });
}
function svgToPng(svg, scale) {
  return new Promise((res, rej) => {
    const m = svg.match(/width="(\d+)" height="(\d+)"/), w = +m[1], h = +m[2];
    const k = Math.min(scale || 2, 9000 / w, 9000 / h);
    const img = new Image();
    img.onload = () => {
      try {
        const cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(b => { if (!b) return rej(new Error('no png')); b.arrayBuffer().then(ab => res({ blob: b, bytes: new Uint8Array(ab), w: cv.width, h: cv.height })); }, 'image/png');
      } catch (e) { rej(e); }
    };
    img.onerror = () => rej(new Error('svg load'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
function dataUrlBytes(d) { const b = atob(d.split(',')[1]); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
function pickLogo() {
  pickFile('image/png,image/jpeg,image/webp,image/svg+xml', f => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 360 / img.width, 160 / img.height), cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.width * k)); cv.height = Math.max(1, Math.round(img.height * k));
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        S.c.meta.logo = cv.toDataURL('image/png'); changed('Added the client logo'); render();
      };
      img.onerror = () => toast('That image could not be read.');
      img.src = r.result;
    };
    r.readAsDataURL(f);
  });
}

const EXPORTS = {
  exportCase: () => saveFile(fileBase() + '.tripod.json', caseFile(S.c), 'application/json'),
  exportCasebook: () => saveFile(fileBase() + '.casebook.json', JSON.stringify(X.casebookPackage(S.c), null, 1), 'application/json'),
  exportSVG: () => saveFile(fileBase() + '-tree.svg', X.treeSVG(S.c), 'image/svg+xml'),
  exportPNG: async () => { try { const p = await svgToPng(X.treeSVG(S.c), 2); saveFile(fileBase() + '-tree.png', p.blob, 'image/png'); } catch (e) { toast('The PNG could not be drawn in this browser. Use the SVG instead.'); } },
  exportDrawio: () => HAS_RUNTIME ? saveFile(fileBase() + '-tree.drawio.svg', X.drawioSVG(S.c), 'image/svg+xml') : saveFile(fileBase() + '-tree.drawio', X.drawioXML(S.c), 'application/xml'),
  exportReport: () => saveFile(fileBase() + '-report.html', X.reportHTML(S.c, X.treeSVG(S.c, { noTitle: true })), 'text/html'),
  exportDocx: async () => {
    toast('Building the Word document…');
    const imgs = [];
    try { const p = await svgToPng(X.treeSVG(S.c, { noTitle: true }), 2); imgs.push({ id: 'tree', bytes: p.bytes, w: p.w, h: p.h }); } catch (e) {}
    if (S.c.meta.logo) { try { const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = S.c.meta.logo; }); imgs.push({ id: 'logo', bytes: dataUrlBytes(S.c.meta.logo), w: im.width, h: im.height }); } catch (e) {} }
    const bytes = X.docx(S.c, imgs);
    saveFile(fileBase() + '-report.docx', new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  },
  exportEvidence: () => {
    const bytes = EV.xlsx(S.c, X.zip, evNames);
    saveFile(fileBase() + '-evidence-plan.xlsx', new Blob([bytes], { type: XLSX_MIME }), XLSX_MIME);
  },
  print: () => {
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { toast('Printing is not available here. Download the web page and print it.'); } setTimeout(() => f.remove(), 60000); };
    f.srcdoc = X.reportHTML(S.c, X.treeSVG(S.c, { noTitle: true }));
  }
};

/* ---------- event wiring ---------------------------------------------------- */
const ACT = Object.assign({
  tab: d => { if (d.t !== 'cases' && d.t !== 'guide' && !S.c) return; flushSave(); S.tab = d.t; if (d.t === 'tree') S.fitPending = S.fitPending || false; render(); },
  closeCase: () => closeCase(),
  newCase: () => { const f = $('#new-form'); f.hidden = false; $('#f-newtitle').focus(); },
  newCancel: () => { $('#new-form').hidden = true; },
  open: d => loadCase(d.id),
  copyExample: d => copyExample(d && d.id),
  dupCase: d => { let c = Store.mode === 'db' ? (Store.remote[d.id] && clone(Store.remote[d.id].data)) : localGet(d.id); if (!c) return; c.id = uid('tb-'); c.meta.title += ' (copy)'; c.log = []; createCase(normalise(c), 'Duplicated from ' + (c.meta.ref || 'another case')); },
  exportCaseId: d => { const c = Store.mode === 'db' ? (Store.remote[d.id] && Store.remote[d.id].data) : localGet(d.id); if (c) saveFile(slug((c.meta.ref ? c.meta.ref + '-' : '') + c.meta.title) + '.tripod.json', caseFile(c), 'application/json'); },
  importCase: async () => {
    if (OFF) { try { const r = await FL.open(); if (r) await openLinkedFile(r.handle, r.name, r.text); } catch (e) { toast('Could not open the file: ' + (e.message || e)); } return; }
    pickFile('.json,application/json', importCase);
  },
  linkFile: () => linkFile(),
  reconnectFile: () => reconnectFile(),
  takeHandoff: async () => { const h = S.handoff; S.handoff = null; if (!h) return; const p = await KIT.permission(h.handle, true); if (p !== 'granted') { toast('Permission was not given.'); render(); return; } try { const f = await h.handle.getFile(); await openLinkedFile(h.handle, f.name, await f.text()); } catch (e) { toast('Could not read ' + h.name + '.'); render(); } },
  dropHandoff: () => { S.handoff = null; render(); },
  delAsk: d => { S.confirmDel = d.id; render(); },
  delNo: () => { S.confirmDel = null; render(); },
  delYes: d => deleteCase(d.id),
  conflictTheirs: () => resolveConflict(false),
  conflictMine: () => resolveConflict(true),
  teamAdd: () => { S.c.team.push({ name: '', role: '' }); changed('Added a team member', 'team'); render(); const i = $('#t-name-' + (S.c.team.length - 1)); if (i) i.focus(); },
  teamDel: d => { S.c.team.splice(+d.i, 1); changed('Removed a team member', 'team'); render(); },
  logoPick: () => pickLogo(),
  logoDel: () => { S.c.meta.logo = ''; changed('Removed the client logo'); render(); },
  undo, redo,
  zoomIn: () => { const s = $('#cv'); zoomAt(1.2, s.clientWidth / 2, s.clientHeight / 2); },
  zoomOut: () => { const s = $('#cv'); zoomAt(1 / 1.2, s.clientWidth / 2, s.clientHeight / 2); },
  fit: () => fit(),
  tidy: () => { pushUndo(); X.tidy(S.c); changed('Tidied the tree layout', 'tidy'); renderTree(); fit(); },
  toggleGrid: () => { S.grid = !S.grid; prefs.grid = S.grid; savePrefs(); const bg = $('#cv-bg'); if (bg) bg.setAttribute('fill', S.grid ? 'url(#grid)' : 'none'); const b = document.querySelector('[data-act=toggleGrid]'); if (b) b.textContent = (S.grid ? 'Hide' : 'Show') + ' grid'; },
  toggleCoach: () => { prefs.coach = !prefs.coach; savePrefs(); const v = Object.assign({}, S.view); render(); S.view = v; applyView(); },
  delSel: () => deleteSelection(),
  unlink: d => unlink(d.id),
  selNode: d => { S.sel = new Set([d.id]); S.selEdge = null; renderTree(); renderInspector(); centreOn([d.id]); },
  quick: d => quickAdd(Array.from(S.sel)[0], d.k),
  insBarrier: d => insertBarrier(S.selEdge, d.t),
  showIssue: d => { const ids = d.ids.split(',').filter(Boolean); S.tab = 'tree'; S.sel = new Set(ids.slice(0, 1)); S.hl = new Set(ids); render(); setTimeout(() => centreOn(ids), 30); setTimeout(() => { S.hl = new Set(); renderTree(); }, 2600); },
  issueFilter: d => { S.issueFilter = d.f; render(); },
  actFilter: d => { S.actFilter = d.f; render(); },
  addAction: () => addAction(''),
  addActionFor: d => addAction(d.id),
  actDel: d => { pushUndo(); S.c.actions.splice(+d.i, 1); changed('Deleted an action'); render(); }
}, EXPORTS, EV_ACT);
function addAction(target) {
  pushUndo();
  S.c.actions.push({ id: uid('act'), target, text: '', owner: '', due: addDays(today(), 30), priority: 'Medium', status: 'Open', smart: {}, agreed: false, closeNote: '' });
  changed('Added an action', 'action');
  S.tab = 'actions'; S.actFilter = 'all'; render();
  const i = $('#a-text-' + (S.c.actions.length - 1)); if (i) { i.focus(); i.scrollIntoView({ block: 'center' }); }
}
function centreOn(ids) {
  const svg = $('#cv'); if (!svg) return;
  const ns = ids.map(node).filter(Boolean); if (!ns.length) return;
  const n = ns[0], g = X.geom(n);
  S.view.x = svg.clientWidth / 2 - (n.x + g.w / 2) * S.view.k; S.view.y = svg.clientHeight / 2 - (n.y + g.h / 2) * S.view.k; applyView();
}

document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b || b.disabled) return;
  const fn = ACT[b.dataset.act]; if (!fn) return;
  ev.preventDefault(); fn(b.dataset, b);
});
document.addEventListener('submit', ev => {
  if (ev.target.dataset.form === 'new') { ev.preventDefault(); const t = ($('#f-newtitle').value || '').trim(); createCase(newCase(t || 'New investigation')); }
});
let editUndoArmed = null;
document.addEventListener('focusin', ev => { const t = ev.target; if (t.matches('[data-nf],[data-af],[data-smart]')) { if (editUndoArmed !== t) { pushUndo(); editUndoArmed = t; } } });
document.addEventListener('focusout', () => { editUndoArmed = null; });
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'f-myname') { prefs.name = t.value.trim(); savePrefs(); return; }
  if (!S.c || S.readonly) return;
  if (t.dataset.meta) { S.c.meta[t.dataset.meta] = t.value; changed('Edited the incident details', 'meta'); if (t.dataset.meta === 'title' || t.dataset.meta === 'ref') renderTop(); return; }
  if (t.dataset.team != null) { S.c.team[+t.dataset.team][t.dataset.k] = t.value; changed('Edited the team', 'team'); return; }
  if (t.dataset.ev && t.type !== 'checkbox' && t.tagName !== 'SELECT') { evEdit(t); return; }
  if (t.dataset.nf && t.type !== 'checkbox' && t.tagName !== 'SELECT') {
    const n = node(Array.from(S.sel)[0]); if (!n) return;
    n[t.dataset.nf] = t.value; changed('Edited ' + TY[n.type].name + ' text', 'text-' + n.id); renderTree(); return;
  }
  const row = t.closest('[data-row]');
  if (row && t.dataset.af && t.type !== 'checkbox' && t.tagName !== 'SELECT') { S.c.actions[+row.dataset.row][t.dataset.af] = t.value; changed('Edited an action', 'action-' + row.dataset.row); }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (!S.c || S.readonly) return;
  if (t.dataset.actChange === 'setType') return setType(Array.from(S.sel)[0], t.value);
  if (t.dataset.actChange === 'linkTo' || t.dataset.actChange === 'linkFrom') {
    if (!t.value) return; const me = Array.from(S.sel)[0]; pushUndo();
    const ok = t.dataset.actChange === 'linkTo' ? linkDir(me, t.value) : linkDir(t.value, me);
    if (!ok) S.undo.pop(); renderTree(); renderInspector(); if (ok && S.sel.size === 1 && Array.from(S.sel)[0] !== me) focusLabel(); return;
  }
  if (t.dataset.ev && (t.type === 'checkbox' || t.tagName === 'SELECT' || t.type === 'date')) { evEdit(t); return; }
  if (t.dataset.meta && t.tagName === 'SELECT') { S.c.meta[t.dataset.meta] = t.value; changed(t.dataset.meta === 'status' ? 'Set the report status to ' + t.value : 'Edited the incident details', t.dataset.meta === 'status' ? '' : 'meta'); return; }
  if (t.dataset.nf && (t.type === 'checkbox' || t.tagName === 'SELECT')) {
    const n = node(Array.from(S.sel)[0]); if (!n) return;
    if (t.dataset.nf === 'mainEvent' && t.checked) S.c.nodes.forEach(m => { if (m !== n) m.mainEvent = false; });
    n[t.dataset.nf] = t.type === 'checkbox' ? t.checked : t.value;
    changed('Edited ' + TY[n.type].name, 'prop-' + n.id); renderTree(); renderInspector(); return;
  }
  const row = t.closest('[data-row]');
  if (row) {
    const a = S.c.actions[+row.dataset.row];
    if (t.dataset.smart) { a.smart = Object.assign({}, a.smart, { [t.dataset.smart]: t.checked }); changed('Edited an action', 'action-' + row.dataset.row); return; }
    if (t.dataset.af) { a[t.dataset.af] = t.type === 'checkbox' ? t.checked : t.value; changed(t.dataset.af === 'status' ? 'Set an action to ' + t.value : 'Edited an action', t.dataset.af === 'status' ? '' : 'action-' + row.dataset.row); if (t.dataset.af === 'target' || t.dataset.af === 'status') render(); }
  }
});
document.addEventListener('keydown', ev => {
  const inField = ev.target.closest && ev.target.closest('input,textarea,select,[contenteditable]');
  if (S.tab !== 'tree' || !S.c) return;
  const mod = ev.metaKey || ev.ctrlKey;
  if (mod && ev.key.toLowerCase() === 'z' && !inField) { ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
  if (mod && ev.key.toLowerCase() === 'y' && !inField) { ev.preventDefault(); redo(); return; }
  if (inField) return;
  if ((ev.key === 'Delete' || ev.key === 'Backspace') && (S.sel.size || S.selEdge)) { ev.preventDefault(); deleteSelection(); return; }
  if (ev.key === 'Escape') { S.sel.clear(); S.selEdge = null; renderTree(); renderInspector(); return; }
  const arrows = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[ev.key];
  if (arrows && S.sel.size && !S.readonly) { ev.preventDefault(); pushUndo(); S.sel.forEach(id => { const n = node(id); n.x += arrows[0] * (ev.shiftKey ? 5 : 1); n.y += arrows[1] * (ev.shiftKey ? 5 : 1); }); changed('Moved elements', 'move'); renderTree(); }
});
window.addEventListener('beforeunload', () => flushSave());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });

/* test hook for the automated tests */
window.TBApp = { EV, LINK, linkDir, register, openLinkedFile, centreOn: ids => centreOn(ids), S, Store, X, R, C, openCase, exampleCase, newCase, link, addNode, insertBarrier, quickAdd, deleteSelection, issues, render, save: () => save(), flushSave };

/* ---------- boot ------------------------------------------------------------- */
if (!HAS_RUNTIME) Store.list = localList();
if (OFF) Store.list.forEach(x => { const c = localGet(x.id); if (c) register(c); });
render();
initRuntime();
if (OFF) {
  const h = location.hash || '';
  if (h.startsWith('#case-')) { const c = localGet(h.slice(6)); if (c) openCase(c); }
  if (h === '#handoff') KIT.KitHandoff.take('tripod').then(v => { if (v && v.handle) { S.handoff = v; render(); } });
}
})();
