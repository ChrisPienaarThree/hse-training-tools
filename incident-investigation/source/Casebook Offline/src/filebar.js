/* Storyline Casebook (offline) — workspace file bar.
   Save to file / Open file / Download backup / Reconnect, linked-file autosave, registry entries for the
   toolkit dashboard, dashboard hand-off (#handoff) and routing of dropped/opened case packages to the
   Casebook's own importer. Needs KIT and CBO_WORKSPACE (offline_shim.js). */
(function () {
  'use strict';
  const WS = window.CBO_WORKSPACE;
  const FL = KIT.FileLink({ tool: 'casebook', ext: '.casebook-ws.json', label: 'Storyline Casebook workspace', mime: 'application/json' });
  const ST = { handle: null, perm: 'none', name: '', saving: false, again: false, lastErr: '' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };

  const css = `#cbo-bar{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:900;display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;
    max-width:calc(100% - 28px);background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:6px 8px;box-shadow:var(--shadow);font:13px/1.3 var(--font-body);color:var(--ink)}
  #cbo-bar .cbo-pill{font-family:var(--font-mono);font-size:11.5px;padding:3px 8px;border-radius:999px;background:var(--surface-2);color:var(--ink-soft);max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #cbo-bar .cbo-pill.ok{background:var(--good-soft);color:var(--good-ink)} #cbo-bar .cbo-pill.warn{background:var(--warn-soft);color:var(--warn-ink)} #cbo-bar .cbo-pill.bad{background:var(--bad-soft);color:var(--bad-ink)}
  #cbo-bar button{border:1px solid var(--border);background:var(--surface);color:var(--ink);border-radius:var(--radius-sm);padding:4px 9px;font-size:12.5px;cursor:pointer}
  #cbo-bar button:hover{background:var(--surface-2)} #cbo-bar button.pri{background:var(--accent);border-color:var(--accent);color:#fff}
  #cbo-bar .cbo-lbl{font-family:var(--font-display);font-weight:600;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint)}
  #cbo-modal{position:fixed;inset:0;z-index:950;background:rgba(18,22,29,.45);display:flex;align-items:center;justify-content:center;padding:16px}
  #cbo-modal .box{background:var(--surface);color:var(--ink);border-radius:var(--radius);padding:20px;max-width:520px;width:100%;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:12px;font:14px/1.5 var(--font-body)}
  #cbo-modal .row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
  #cbo-modal button{border:1px solid var(--border);background:var(--surface);color:var(--ink);border-radius:var(--radius-sm);padding:7px 14px;cursor:pointer}
  #cbo-modal button.pri{background:var(--accent);border-color:var(--accent);color:#fff}
  @media print{#cbo-bar,#cbo-modal{display:none!important}}`;

  function mount() {
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    const bar = document.createElement('div'); bar.id = 'cbo-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Workspace file');
    document.body.appendChild(bar);
    bar.addEventListener('click', e => { const b = e.target.closest('[data-cbo]'); if (b) ACT[b.dataset.cbo](); });
    renderBar();
  }
  function renderBar() {
    const bar = document.getElementById('cbo-bar'); if (!bar) return;
    let pill;
    if (ST.handle && ST.perm === 'granted') pill = `<span class="cbo-pill ok" id="cbo-status" title="Every change is written to this file">${ST.lastErr ? 'Save failed: ' + esc(ST.lastErr) : (ST.saving ? 'Saving to ' : 'Saved to ') + esc(ST.name)}</span>`;
    else if (ST.handle) pill = `<span class="cbo-pill warn" id="cbo-status" title="The browser needs your permission again to write to ${esc(ST.name)}">Reconnect needed</span>`;
    else pill = `<span class="cbo-pill bad" id="cbo-status" title="Cases are kept in this browser only. Save them to a file on the USB stick.">Not saved to a file</span>`;
    bar.innerHTML = `<span class="cbo-lbl">Workspace</span>${pill}
      ${ST.handle && ST.perm !== 'granted' ? '<button class="pri" data-cbo="reconnect" id="cbo-reconnect">Reconnect file</button>' : ''}
      <button data-cbo="saveAs" id="cbo-save"${ST.handle ? '' : ' class="pri"'}>Save to file…</button>
      <button data-cbo="open" id="cbo-open">Open file…</button>
      <button data-cbo="backup" id="cbo-backup">Download backup</button>`;
  }
  function modal(html, buttons) {
    return new Promise(res => {
      const m = document.createElement('div'); m.id = 'cbo-modal';
      m.innerHTML = `<div class="box" role="dialog" aria-modal="true">${html}<div class="row">${buttons.map((b, i) => `<button data-i="${i}"${b.pri ? ' class="pri"' : ''}>${esc(b.label)}</button>`).join('')}</div></div>`;
      document.body.appendChild(m);
      m.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (!b) return; m.remove(); res(buttons[+b.dataset.i].value); });
      const f = m.querySelector('button.pri') || m.querySelector('button'); if (f) f.focus();
    });
  }
  function toast(msg) { if (typeof window.toast === 'function') window.toast(msg); }

  /* ---------- saving ---------- */
  const text = () => JSON.stringify(WS.toJSON());
  let t1;
  function scheduleSave() { clearTimeout(t1); t1 = setTimeout(flush, 800); }
  async function flush() {
    clearTimeout(t1);
    await WS.persist();
    updateRegistry();
    if (ST.handle && ST.perm === 'granted') {
      if (ST.saving) { ST.again = true; return; }
      ST.saving = true; renderBar();
      try { await FL.write(ST.handle, text()); ST.lastErr = ''; }
      catch (e) { ST.lastErr = (e && e.name) || 'error'; ST.perm = await FL.permission(ST.handle, false); }
      ST.saving = false; renderBar();
      if (ST.again) { ST.again = false; flush(); }
    }
  }
  function updateRegistry() {
    const cases = WS.cases(), ids = new Set(cases.map(c => c.id));
    KIT.KitRegistry.list().filter(x => x.tool === 'casebook' && !ids.has(x.id)).forEach(x => KIT.KitRegistry.remove('casebook', x.id));
    cases.forEach(c => {
      const acts = WS.sub(c.id, 'correctiveActions');
      KIT.KitRegistry.upsert({
        tool: 'casebook', id: c.id, title: c.caseTitle || 'Untitled investigation', ref: c.caseRef || '', status: c.status || 'open',
        date: c.dateOccurred || '', updatedAt: c.updatedAt || '', file: ST.handle ? ST.name : '', toolFile: 'Storyline Casebook.html',
        actions: KIT.actionStats(acts, () => true, a => a.targetDate || '')
      });
    });
  }

  /* ---------- loading files ---------- */
  async function routeFile(name, raw, handle) {
    let o; try { o = JSON.parse(raw); } catch (e) { toast('That file is not valid JSON.'); return; }
    if (o && o.format === 'storyline-casebook-case') {
      if (typeof window.importCasePackage !== 'function') { toast('The case importer is not available.'); return; }
      await window.importCasePackage(new File([raw], name, { type: 'application/json' }), null);
      return;
    }
    if (!o || o.format !== 'storyline-casebook-workspace' || !o.docs) { toast('That file is not a Storyline Casebook workspace or case package.'); return; }
    const n = Object.keys(o.docs).filter(k => k.split('/').length === 2 && k.startsWith('cases/')).length;
    const here = WS.cases().length;
    const ok = !here || await modal(`<h3 style="margin:0">Open ${esc(name)}?</h3><p style="margin:0">It holds ${n} investigation${n === 1 ? '' : 's'}. Opening it replaces the ${here} case${here === 1 ? '' : 's'} currently on this computer${ST.handle ? '' : ', which are not saved to a file'}. ${here && !ST.handle ? 'Download a backup first if you need them.' : ''}</p>`,
      [{ label: 'Cancel', value: false }, { label: 'Open and replace', value: true, pri: true }]);
    if (!ok) return;
    await WS.replace(o);
    if (handle) await FL.link('workspace', handle); else await FL.unlink('workspace');
    location.hash = ''; location.reload();
  }

  const ACT = {
    async saveAs() {
      try {
        const r = await FL.saveAs('workspace', 'Casebook workspace ' + stamp() + '.casebook-ws.json', text());
        if (!r) return;
        if (r.downloaded) { toast('This browser cannot link files, so a copy was downloaded. Use Chrome or Edge to save straight to the USB stick.'); return; }
        ST.handle = r.handle; ST.name = r.name; ST.perm = 'granted'; ST.lastErr = '';
        updateRegistry(); renderBar(); toast('Saved to ' + r.name + '. Every change is now written to that file.');
      } catch (e) { toast('Could not save the file: ' + ((e && e.message) || e)); }
    },
    async open() {
      try { const r = await FL.open(); if (r) await routeFile(r.name, r.text, r.handle); }
      catch (e) { toast('Could not open the file: ' + ((e && e.message) || e)); }
    },
    backup() { KIT.download('Casebook backup ' + stamp() + '.casebook-ws.json', text(), 'application/json'); },
    async reconnect() {
      ST.perm = await FL.permission(ST.handle, true);
      if (ST.perm === 'granted') { renderBar(); flush(); toast('Reconnected to ' + ST.name + '.'); } else renderBar();
    }
  };

  /* drop a workspace or case package anywhere the Casebook itself does not handle the drop */
  window.addEventListener('dragover', e => { if (!e.defaultPrevented && e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) e.preventDefault(); });
  window.addEventListener('drop', async e => {
    if (e.defaultPrevented || !e.dataTransfer || !e.dataTransfer.files.length) return;
    const f = e.dataTransfer.files[0];
    e.preventDefault();
    if (!/\.json$/i.test(f.name)) { toast('Drop a .casebook-ws.json workspace or a case package (.json).'); return; }
    routeFile(f.name, await f.text(), null);
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', () => { flush(); });

  /* ---------- boot ---------- */
  (async function boot() {
    await WS.ready;
    if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    mount();
    WS.onChange(scheduleSave);
    try {
      const h = await FL.handleFor('workspace');
      if (h) { ST.handle = h; ST.name = h.name; ST.perm = await FL.permission(h, false); }
    } catch (e) {}
    renderBar(); updateRegistry();
    if (location.hash === '#handoff') {
      const v = await KIT.KitHandoff.take('casebook');
      history.replaceState(null, '', location.pathname + location.search);
      if (v && v.handle) {
        const go = await modal(`<h3 style="margin:0">Open ${esc(v.name || v.handle.name)}</h3><p style="margin:0">The toolkit dashboard asked to open this workspace file.</p>`, [{ label: 'Cancel', value: false }, { label: 'Open', value: true, pri: true }]);
        if (go) {
          const p = await FL.permission(v.handle, true);
          if (p !== 'granted') { toast('Permission to read the file was not given.'); return; }
          const f = await v.handle.getFile();
          await routeFile(f.name, await f.text(), v.handle);
        }
      }
    }
  })();
  window.CBO_FILEBAR = { flush, state: ST, updateRegistry, routeFile };
})();
