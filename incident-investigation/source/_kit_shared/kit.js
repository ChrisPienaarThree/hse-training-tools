/* Incident Investigation Toolkit — shared offline helpers (Istec Training).
   Inlined into every tool and the START HERE dashboard at build time.

   KitStore    tiny IndexedDB key/value store (db "iikit", store "kv"), shared by every page opened from file://
   FileLink    save to / open from a real file on the USB stick (File System Access API in Chrome/Edge),
               remembers file handles so later saves write straight to the file; download / file-input fallback
   KitRegistry list of investigations known on this computer (localStorage "iikit.registry"), shown on the dashboard
   KitHandoff  dashboard -> tool: "open this file" (passes a file handle through IndexedDB)

   Chrome and Edge give all file:// pages one shared storage area, which is what makes the registry and the hand-off
   work. Firefox/Safari keep storage per file, so there the tools still work but the dashboard only sees the folder. */
var KIT = (function () {
  'use strict';
  const VERSION = '1.0';
  const hasFSA = typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function' && typeof window.showOpenFilePicker === 'function';
  const hasDirPicker = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

  /* ---------- IndexedDB key/value ---------- */
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      let done = false;
      const t = setTimeout(() => { if (!done) { done = true; rej(new Error('IndexedDB timeout')); } }, 4000);
      try {
        const r = indexedDB.open('iikit', 1);
        r.onupgradeneeded = () => { r.result.createObjectStore('kv'); };
        r.onsuccess = () => { if (!done) { done = true; clearTimeout(t); res(r.result); } };
        r.onerror = () => { if (!done) { done = true; clearTimeout(t); rej(r.error); } };
      } catch (e) { done = true; clearTimeout(t); rej(e); }
    });
    dbp.catch(() => { dbp = null; });
    return dbp;
  }
  const KitStore = {
    async get(k) { try { const d = await db(); return await new Promise((res, rej) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); } catch (e) { return undefined; } },
    async set(k, v) { try { const d = await db(); await new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); return true; } catch (e) { return false; } },
    async del(k) { try { const d = await db(); await new Promise((res) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = res; t.onerror = res; }); } catch (e) {} },
    async keys(prefix) { try { const d = await db(); return await new Promise((res) => { const q = d.transaction('kv').objectStore('kv').getAllKeys(); q.onsuccess = () => res((q.result || []).filter(k => typeof k === 'string' && (!prefix || k.startsWith(prefix)))); q.onerror = () => res([]); }); } catch (e) { return []; } }
  };

  /* ---------- files ---------- */
  function download(name, data, mime) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  function pickWithInput(accept) {
    return new Promise(res => {
      const i = document.createElement('input'); i.type = 'file'; if (accept) i.accept = accept; i.style.display = 'none';
      i.onchange = () => { const f = i.files && i.files[0]; i.remove(); res(f || null); };
      document.body.appendChild(i); i.click();
    });
  }
  async function permission(handle, ask) {
    if (!handle || !handle.queryPermission) return 'denied';
    try {
      let s = await handle.queryPermission({ mode: 'readwrite' });
      if (s !== 'granted' && ask) s = await handle.requestPermission({ mode: 'readwrite' });
      return s;
    } catch (e) { return 'denied'; }
  }
  /* opts: {tool, ext, label, mime} e.g. {tool:'tripod', ext:'.tripod.json', label:'Tripod Beta case'} */
  function FileLink(opts) {
    const types = [{ description: opts.label, accept: { [opts.mime || 'application/json']: [opts.ext.slice(opts.ext.lastIndexOf('.'))] } }];
    const key = id => 'handle:' + opts.tool + ':' + id;
    return {
      supported: hasFSA,
      /* Ask where to save; returns {handle, name} or null when cancelled. */
      async saveAs(id, suggested, text) {
        if (!hasFSA) { download(suggested, text, opts.mime || 'application/json'); return { handle: null, name: suggested, downloaded: true }; }
        let h;
        try { h = await window.showSaveFilePicker({ suggestedName: suggested, types, id: 'iikit-cases' }); }
        catch (e) { if (e && e.name === 'AbortError') return null; throw e; }
        await this.write(h, text);
        await KitStore.set(key(id), h);
        return { handle: h, name: h.name };
      },
      async write(h, text) { const w = await h.createWritable(); await w.write(text); await w.close(); },
      /* Open a file; returns {handle|null, name, text} or null. */
      async open() {
        if (hasFSA) {
          let hs;
          try { hs = await window.showOpenFilePicker({ types, multiple: false, id: 'iikit-cases' }); }
          catch (e) { if (e && e.name === 'AbortError') return null; throw e; }
          const f = await hs[0].getFile();
          return { handle: hs[0], name: f.name, text: await f.text(), modified: f.lastModified };
        }
        const f = await pickWithInput(opts.ext + ',.json,application/json');
        return f ? { handle: null, name: f.name, text: await f.text(), modified: f.lastModified } : null;
      },
      async link(id, h) { if (h) await KitStore.set(key(id), h); },
      async unlink(id) { await KitStore.del(key(id)); },
      async handleFor(id) { return await KitStore.get(key(id)); },
      permission,
      download: (name, text) => download(name, text, opts.mime || 'application/json')
    };
  }

  /* ---------- registry of investigations on this computer ---------- */
  const RK = 'iikit.registry';
  const KitRegistry = {
    list() { try { return JSON.parse(localStorage.getItem(RK) || '[]'); } catch (e) { return []; } },
    upsert(entry) {
      try {
        const L = this.list().filter(x => !(x.tool === entry.tool && x.id === entry.id));
        L.push(Object.assign({ seenAt: new Date().toISOString() }, entry));
        localStorage.setItem(RK, JSON.stringify(L.slice(-500)));
      } catch (e) {}
    },
    remove(tool, id) { try { localStorage.setItem(RK, JSON.stringify(this.list().filter(x => !(x.tool === tool && x.id === id)))); } catch (e) {} }
  };
  /* action summary helper: items [{status, due}] with open statuses */
  function actionStats(items, isOpen, dueOf) {
    const today = new Date().toISOString().slice(0, 10);
    let open = 0, overdue = 0; const dues = [];
    (items || []).forEach(a => { if (isOpen(a)) { open++; const d = dueOf(a); if (d) dues.push(String(d).slice(0, 10)); if (d && d < today) overdue++; } });
    return { total: (items || []).length, open, overdue, dues };
  }

  /* ---------- dashboard -> tool hand-off ---------- */
  const KitHandoff = {
    async put(tool, handle, name) { return KitStore.set('handoff:' + tool, { handle, name, at: Date.now() }); },
    async take(tool) { const v = await KitStore.get('handoff:' + tool); await KitStore.del('handoff:' + tool); return v && Date.now() - v.at < 10 * 60000 ? v : null; }
  };

  return { VERSION, hasFSA, hasDirPicker, KitStore, FileLink, KitRegistry, KitHandoff, actionStats, download, pickWithInput, permission };
})();
if (typeof module !== 'undefined') module.exports = KIT;
