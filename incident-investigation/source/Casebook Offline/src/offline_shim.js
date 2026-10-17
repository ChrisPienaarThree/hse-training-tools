/* Storyline Casebook (offline) — local runtime.
   Stands in for the claude.ai artifact runtime: window.claude.use('db' | 'downloads' | 'permissions').
   The db is an in-memory, Firestore-like document store (path -> data) persisted to IndexedDB
   (KIT.KitStore key "casebook:workspace") and, when linked, to a workspace file on the USB stick.
   Needs KIT (kit.js) loaded first. */
(function () {
  'use strict';
  const WS_KEY = 'casebook:workspace';
  const docs = new Map();          // full path -> plain object
  const listeners = new Set();     // {kind:'doc'|'query', path, q, next, prevIds}
  let changeHooks = [];
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const isPlain = v => v && typeof v === 'object' && !Array.isArray(v);
  const autoId = () => { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; let s = ''; for (let i = 0; i < 20; i++) s += c[Math.floor(Math.random() * c.length)]; return s; };
  const err = (code, message) => { const e = new Error(message); e.code = code; return e; };
  const segs = p => String(p).split('/').filter(Boolean);
  const parentOf = p => segs(p).slice(0, -1).join('/');

  /* ---------- load ---------- */
  const ready = (async () => {
    try {
      const ws = await KIT.KitStore.get(WS_KEY);
      if (ws && ws.docs) Object.keys(ws.docs).forEach(k => docs.set(k, ws.docs[k]));
    } catch (e) {}
  })();

  /* ---------- notify ---------- */
  let flushQueued = false;
  function notifyAll(changedPaths) {
    changeHooks.forEach(fn => { try { fn(changedPaths); } catch (e) {} });
    if (flushQueued) return; flushQueued = true;
    setTimeout(() => { flushQueued = false; listeners.forEach(deliver); }, 0);
  }
  function snapDoc(path) {
    const d = docs.get(path), data = d === undefined ? undefined : clone(d);
    return { id: segs(path).pop(), ref: makeDoc(path), exists: d !== undefined, data: () => data === undefined ? undefined : clone(data), metadata: { fromCache: false, hasPendingWrites: false } };
  }
  function runQuery(colPath, q) {
    let out = [];
    docs.forEach((v, k) => { if (parentOf(k) === colPath) out.push(k); });
    (q.where || []).forEach(([f, op, val]) => {
      const t = { '==': (a, b) => a === b, '!=': (a, b) => a !== b, '<': (a, b) => a < b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '>=': (a, b) => a >= b,
        in: (a, b) => (b || []).includes(a), 'not-in': (a, b) => !(b || []).includes(a), 'array-contains': (a, b) => Array.isArray(a) && a.includes(b) }[op];
      out = out.filter(k => t && t((docs.get(k) || {})[f], val));
    });
    if (q.orderBy) {
      const { field, dir } = q.orderBy, s = dir === 'desc' ? -1 : 1;
      out.sort((a, b) => { const x = (docs.get(a) || {})[field], y = (docs.get(b) || {})[field]; if (x === undefined && y === undefined) return a < b ? -1 : 1; if (x === undefined) return 1; if (y === undefined) return -1; return (x < y ? -1 : x > y ? 1 : 0) * s; });
    } else out.sort();
    if (q.limit) out = out.slice(0, q.limit);
    return out;
  }
  function snapQuery(colPath, q, prevIds) {
    const paths = runQuery(colPath, q), list = paths.map(snapDoc);
    const ids = paths.map(p => segs(p).pop());
    const changes = [];
    if (prevIds) {
      prevIds.forEach((id, i) => { if (!ids.includes(id)) changes.push({ type: 'removed', doc: { id, exists: true, data: () => ({}) }, oldIndex: i, newIndex: -1 }); });
      list.forEach((d, i) => { const o = prevIds.indexOf(d.id); changes.push({ type: o < 0 ? 'added' : 'modified', doc: d, oldIndex: o, newIndex: i }); });
    } else list.forEach((d, i) => changes.push({ type: 'added', doc: d, oldIndex: -1, newIndex: i }));
    return { snap: { docs: list, size: list.length, empty: !list.length, docChanges: () => changes, forEach: fn => list.forEach(fn), metadata: { fromCache: false, hasPendingWrites: false } }, ids };
  }
  function deliver(l) {
    try {
      if (l.kind === 'doc') l.next(snapDoc(l.path));
      else { const r = snapQuery(l.path, l.q, l.prevIds); l.prevIds = r.ids; l.next(r.snap); }
    } catch (e) { setTimeout(() => { throw e; }); }
  }

  /* ---------- refs ---------- */
  function merge(target, src) {
    Object.keys(src).forEach(k => {
      const v = src[k];
      if (isPlain(v) && v.__delete__ === true) { delete target[k]; return; }
      if (isPlain(v) && isPlain(target[k])) merge(target[k], v); else target[k] = clone(v);
    });
    return target;
  }
  function makeDoc(path) {
    path = segs(path).join('/');
    if (segs(path).length % 2) throw new TypeError('Document path needs an even number of segments: ' + path);
    return {
      id: segs(path).pop(), path,
      async get() { await ready; return snapDoc(path); },
      async set(data) { await ready; if (!isPlain(data)) throw err('invalid_argument', 'Document body must be an object'); docs.set(path, clone(data)); notifyAll([path]); },
      async update(data) { await ready; if (!docs.has(path)) throw err('invalid_argument', 'No document to update at ' + path); docs.set(path, merge(clone(docs.get(path)), data)); notifyAll([path]); },
      async delete() { await ready; if (docs.delete(path)) notifyAll([path]); },
      onSnapshot(next, error) { const l = { kind: 'doc', path, next }; listeners.add(l); ready.then(() => setTimeout(() => { if (listeners.has(l)) deliver(l); }, 0)); return () => listeners.delete(l); },
      collection(name) { return makeCol(path + '/' + name); },
      async acquire() { return { acquired: true, version: 1, holder: 'local' }; }
    };
  }
  function makeQuery(path, q) {
    return {
      where(f, op, v) { return makeQuery(path, Object.assign({}, q, { where: (q.where || []).concat([[f, op, v]]) })); },
      orderBy(field, dir) { return makeQuery(path, Object.assign({}, q, { orderBy: { field, dir: dir || 'asc' } })); },
      limit(n) { return makeQuery(path, Object.assign({}, q, { limit: n })); },
      async get() { await ready; return snapQuery(path, q, null).snap; },
      onSnapshot(next, error) { const l = { kind: 'query', path, q, next, prevIds: null }; listeners.add(l); ready.then(() => setTimeout(() => { if (listeners.has(l)) deliver(l); }, 0)); return () => listeners.delete(l); }
    };
  }
  function makeCol(path) {
    path = segs(path).join('/');
    if (!(segs(path).length % 2)) throw new TypeError('Collection path needs an odd number of segments: ' + path);
    const q = makeQuery(path, {});
    return Object.assign(q, {
      path,
      doc(id) { return makeDoc(path + '/' + (id || autoId())); },
      async add(data) { const d = makeDoc(path + '/' + autoId()); await d.set(data); return d; }
    });
  }
  const DB = Object.freeze({ doc: makeDoc, collection: makeCol });

  /* ---------- workspace helpers (used by the file bar) ---------- */
  const Workspace = {
    ready,
    toJSON() { const o = {}; docs.forEach((v, k) => { o[k] = v; }); return { format: 'storyline-casebook-workspace', version: 1, savedAt: new Date().toISOString(), app: 'Storyline Casebook (offline)', docs: o }; },
    async persist() { return KIT.KitStore.set(WS_KEY, { savedAt: new Date().toISOString(), docs: this.toJSON().docs }); },
    async replace(ws) { await KIT.KitStore.set(WS_KEY, { savedAt: new Date().toISOString(), docs: (ws && ws.docs) || {} }); },
    cases() {
      const out = [];
      docs.forEach((v, k) => { const s = segs(k); if (s.length === 2 && s[0] === 'cases') out.push(Object.assign({ id: s[1] }, v)); });
      return out;
    },
    sub(caseId, name) { const p = 'cases/' + caseId + '/' + name, out = []; docs.forEach((v, k) => { if (parentOf(k) === p) out.push(Object.assign({ id: segs(k).pop() }, v)); }); return out; },
    onChange(fn) { changeHooks.push(fn); },
    size() { return docs.size; }
  };
  window.CBO_WORKSPACE = Workspace;

  const downloads = Object.freeze({
    async save(r) {
      if (!r || !r.filename || r.data == null) throw err('bad_request', 'filename and data are required');
      KIT.download(r.filename, r.data, 'application/octet-stream');
      return { status: 'saved' };
    }
  });
  const permissions = Object.freeze({ async state() { return 'granted'; }, async request(names) { const o = {}; (names || ['db']).forEach(n => o[n] = 'granted'); return o; }, async manage() {} });

  window.claude = Object.freeze({
    use: async name => {
      if (name === 'db') { await ready; return DB; }
      if (name === 'downloads') return downloads;
      if (name === 'permissions') return permissions;
      return null;
    }
  });
})();
