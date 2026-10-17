/* ============================================================================
   S21 — EU AI Act screener + ISO 45001/42001 mapper. app.js
   Nothing here runs a model. Part A is a real rule engine: whichever
   checked questions exist are evaluated in a fixed priority order and the
   first matching category wins. Part B is a plain live filter over an
   authored reference table.
   ============================================================================ */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const PRIORITY = ["prohibited", "high-risk", "limited-risk", "minimal-risk"];

  const STATE = {
    scenarioId: null,
    answers: null, // { q1: bool, ... }
    activePreset: null,
    filterText: "",
    theme: (function () { try { return localStorage.getItem("s21-theme") || "system"; } catch (e) { return "system"; } })()
  };

  function scenarioList() { return (window.HSE_S21 && window.HSE_S21.manifest) || []; }
  function scenario(id) { return window.HSE_S21.scenarios[id]; }

  /* ---------- Part A: rule engine ---------- */
  function classify(sc, answers) {
    for (const tier of PRIORITY) {
      if (tier === "minimal-risk") return "minimal-risk";
      const hit = sc.questions.some((q) => q.category === tier && answers[q.id]);
      if (hit) return tier;
    }
    return "minimal-risk";
  }

  /* ---------- Part B: live filter ---------- */
  function filterRows(sc, text) {
    const t = text.trim().toLowerCase();
    if (!t) return sc.isoMapping;
    return sc.isoMapping.filter((r) =>
      r.clause.toLowerCase().indexOf(t) !== -1 ||
      r.title45001.toLowerCase().indexOf(t) !== -1 ||
      r.title42001.toLowerCase().indexOf(t) !== -1 ||
      r.integration.toLowerCase().indexOf(t) !== -1
    );
  }

  /* ---------- rendering ---------- */
  function render() {
    const sc = scenario(STATE.scenarioId);
    const root = $("#app");
    if (!sc) { root.innerHTML = "<p>Scenario not found.</p>"; return; }
    if (!STATE.answers) {
      STATE.answers = {};
      for (const q of sc.questions) STATE.answers[q.id] = false;
    }

    const tier = classify(sc, STATE.answers);
    const tierInfo = sc.tierInfo[tier];

    const presetBtns = sc.presets.map((p) => `<button class="ghost preset-btn${STATE.activePreset === p.id ? " active" : ""}" data-preset="${esc(p.id)}">${esc(p.label)}</button>`).join("");

    const qItems = sc.questions.map((q) => `<li>
        <input type="checkbox" class="q-check" data-qid="${esc(q.id)}" ${STATE.answers[q.id] ? "checked" : ""}>
        <span>${esc(q.text)} <span class="qtag ${esc(q.category)}">${esc(q.category.replace("-", " "))}</span></span>
      </li>`).join("");

    const activePresetObj = sc.presets.find((p) => p.id === STATE.activePreset);

    const filtered = filterRows(sc, STATE.filterText);
    const isoRows = filtered.map((r) => `<tr>
        <td class="clausecol">${esc(r.clause)}</td>
        <td>${esc(r.title45001)}</td>
        <td>${esc(r.title42001)}</td>
        <td>${esc(r.integration)}</td>
      </tr>`).join("");

    root.innerHTML = `
      <div class="banner"><strong>Teaching simulation.</strong> No model runs here. Part A is a real rule engine over whatever you check — six questions, a fixed priority order, first match wins. Part B is a plain live filter over an authored reference table. Penalty figures are illustrative training figures based on the EU AI Act's published tiers — verify against current official guidance before relying on them.</div>
      <div class="context"><strong>${esc(sc.label)}.</strong> ${esc(sc.context)}</div>

      <div class="card">
        <span class="parttag">Part A — EU AI Act risk screener</span>
        <h2>Questions</h2>
        <div class="presetbtns">${presetBtns}</div>
        ${activePresetObj ? `<p class="presetnote">${esc(activePresetObj.label)}: ${esc(activePresetObj.note)}</p>` : ""}
        <ul class="qlist">${qItems}</ul>
        <div class="tierbanner ${tier}">
          <div class="tt">${esc(tierInfo.label)}</div>
          <div class="tierbody">
            <p><strong>Obligations:</strong> ${esc(tierInfo.obligations)}</p>
            <p><strong>Penalty exposure:</strong> ${esc(tierInfo.penalty)}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <span class="parttag">Part B — ISO 45001 ↔ ISO 42001 clause mapping</span>
        <h2>Reference table <span id="isoCountSpan" style="font-weight:400;color:var(--ink-soft);font-size:.8rem;">showing ${filtered.length} of ${sc.isoMapping.length} clauses</span></h2>
        <input type="search" id="isoFilter" placeholder="Filter by clause, title or keyword…" style="width:100%;margin-bottom:10px;" value="${esc(STATE.filterText)}">
        <div style="overflow-x:auto;">
        <table class="isomap">
          <thead><tr><th>Clause</th><th>ISO 45001 (OH&amp;S)</th><th>ISO 42001 (AI management)</th><th>Integration note</th></tr></thead>
          <tbody>${isoRows || '<tr><td colspan="4" style="color:var(--ink-soft);">No clauses match this filter.</td></tr>'}</tbody>
        </table>
        </div>
      </div>

      <div class="callouts">
        <div class="callout"><b>Rule engine —</b> ${esc(sc.callouts.ruleEngine)}</div>
        <div class="callout"><b>The surprise —</b> ${esc(sc.callouts.surprise)}</div>
        <div class="callout"><b>Not omniscient —</b> ${esc(sc.callouts.notOmniscient)}</div>
        <div class="callout"><b>Still misses things —</b> ${esc(sc.callouts.stillMisses)}</div>
        <div class="callout"><b>Human call —</b> ${esc(sc.callouts.humanCall)}</div>
      </div>
      <details class="drawer"><summary>Facilitator notes</summary>
        <div class="dbody">
          <p><strong>What this is:</strong> ${esc(sc.notes.what)}</p>
          <p><strong>The maths:</strong> ${esc(sc.notes.math)}</p>
          <p><strong>What's real vs authored:</strong> ${esc(sc.notes.real)}</p>
        </div>
      </details>
    `;

    $$(".q-check", root).forEach((el) => el.addEventListener("change", (e) => {
      STATE.answers[e.target.dataset.qid] = e.target.checked;
      STATE.activePreset = null;
      render();
    }));
    $$(".preset-btn", root).forEach((el) => el.addEventListener("click", (e) => {
      const p = sc.presets.find((x) => x.id === e.currentTarget.dataset.preset);
      if (p) { STATE.answers = Object.assign({}, p.answers); STATE.activePreset = p.id; render(); }
    }));
    $("#isoFilter", root).addEventListener("input", (e) => {
      STATE.filterText = e.target.value;
      renderIsoOnly(sc);
    });
  }

  // Cheap partial re-render for Part B, so typing in the filter box doesn't steal focus.
  function renderIsoOnly(sc) {
    const filtered = filterRows(sc, STATE.filterText);
    const tbody = $("table.isomap tbody");
    if (tbody) {
      tbody.innerHTML = filtered.map((r) => `<tr>
        <td class="clausecol">${esc(r.clause)}</td>
        <td>${esc(r.title45001)}</td>
        <td>${esc(r.title42001)}</td>
        <td>${esc(r.integration)}</td>
      </tr>`).join("") || '<tr><td colspan="4" style="color:var(--ink-soft);">No clauses match this filter.</td></tr>';
    }
    const countEl = $("#isoCountSpan");
    if (countEl) countEl.textContent = `showing ${filtered.length} of ${sc.isoMapping.length} clauses`;
  }

  function buildScenarioPicker() {
    const sel = $("#scenarioSelect");
    sel.innerHTML = scenarioList().map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join("");
    sel.value = STATE.scenarioId;
    sel.addEventListener("change", (e) => {
      STATE.scenarioId = e.target.value;
      STATE.answers = null; STATE.activePreset = null; STATE.filterText = "";
      render();
    });
  }

  function applyTheme() {
    const root = document.documentElement;
    if (STATE.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", STATE.theme);
    $("#themeBtn").textContent = "Theme: " + STATE.theme;
  }
  function cycleTheme() {
    STATE.theme = STATE.theme === "system" ? "light" : STATE.theme === "light" ? "dark" : "system";
    try { localStorage.setItem("s21-theme", STATE.theme); } catch (e) {}
    applyTheme();
  }

  function init() {
    const list = scenarioList();
    STATE.scenarioId = list.length ? list[0].id : null;
    buildScenarioPicker();
    applyTheme();
    $("#themeBtn").addEventListener("click", cycleTheme);
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
