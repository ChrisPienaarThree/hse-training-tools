/* ============================================================================
   S16 — Composite safety culture score. app.js
   Nothing here runs a model. Every site's 4 component scores are authored;
   the composite score, the ranking, and the drill-down contributions are a
   live weighted sum recomputed on every slider change.
   ============================================================================ */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const COMPONENT_ORDER = ["incident", "capa", "survey", "nearMiss"];

  const STATE = {
    scenarioId: null,
    weights: null, // { incident, capa, survey, nearMiss }
    hideWeights: false,
    activePreset: null,
    selectedSite: null,
    theme: (function () { try { return localStorage.getItem("s16-theme") || "system"; } catch (e) { return "system"; } })()
  };

  function scenarioList() { return (window.HSE_S16 && window.HSE_S16.manifest) || []; }
  function scenario(id) { return window.HSE_S16.scenarios[id]; }

  /* ---------- core computation (real, live) ---------- */
  function weightSum(weights) { return COMPONENT_ORDER.reduce((s, k) => s + (weights[k] || 0), 0); }

  function composite(site, weights) {
    const total = weightSum(weights);
    if (total <= 0) return 0;
    let sum = 0;
    for (const k of COMPONENT_ORDER) sum += (weights[k] || 0) * site.scores[k];
    return sum / total;
  }

  function contributions(site, weights) {
    const total = weightSum(weights);
    return COMPONENT_ORDER.map((k) => ({
      key: k,
      value: total > 0 ? ((weights[k] || 0) * site.scores[k]) / total : 0,
      weight: weights[k] || 0,
      score: site.scores[k]
    }));
  }

  function rankedSites(sc, weights) {
    return sc.sites
      .map((s) => ({ site: s, composite: composite(s, weights) }))
      .sort((a, b) => b.composite - a.composite);
  }

  /* ---------- rendering ---------- */
  function render() {
    const sc = scenario(STATE.scenarioId);
    const root = $("#app");
    if (!sc) { root.innerHTML = "<p>Scenario not found.</p>"; return; }
    if (!STATE.weights) STATE.weights = Object.assign({}, sc.weightPresets[0].weights);
    if (!STATE.selectedSite || !sc.sites.find((s) => s.key === STATE.selectedSite)) {
      STATE.selectedSite = sc.sites[0].key;
    }

    const ranked = rankedSites(sc, STATE.weights);
    const total = weightSum(STATE.weights);

    const presetBtns = sc.weightPresets.map((p) => `<button class="ghost preset-btn${STATE.activePreset === p.id ? " active" : ""}" data-preset="${esc(p.id)}">${esc(p.label)}</button>`).join("");

    const compMax = Math.max(1, ...ranked.map((r) => r.composite));
    const rows = ranked.map((r, idx) => {
      const isSel = r.site.key === STATE.selectedSite;
      const pct = Math.max(0, Math.min(100, (r.composite / 100) * 100));
      return `<tr class="${isSel ? "selected" : ""}" data-site="${esc(r.site.key)}">
        <td><span class="rankbadge${idx === 0 ? " r1" : ""}">${idx + 1}</span>${esc(r.site.label)}</td>
        <td class="num"><span class="compositebar"><span style="width:${pct.toFixed(1)}%;"></span></span>${r.composite.toFixed(1)}</td>
      </tr>`;
    }).join("");

    const sel = sc.sites.find((s) => s.key === STATE.selectedSite);
    const contribs = contributions(sel, STATE.weights);
    const selComposite = composite(sel, STATE.weights);
    const drillRows = contribs.map((c) => {
      const comp = sc.components.find((x) => x.key === c.key);
      const pct = selComposite > 0 ? (100 * c.value) / Math.max(selComposite, 0.0001) : 0;
      return `<div class="drow">
        <div>${esc(comp.label)}</div>
        <div class="dbar"><span style="width:${Math.max(0, Math.min(100, pct)).toFixed(1)}%;"></span></div>
        <div class="dval">${c.value.toFixed(1)} pts</div>
      </div>`;
    }).join("");

    const weightSliders = COMPONENT_ORDER.map((k) => {
      const comp = sc.components.find((x) => x.key === k);
      const w = STATE.weights[k];
      const normPct = total > 0 ? Math.round((100 * w) / total) : 0;
      return `<div class="wctl">
        <div class="ch"><label class="field" style="margin:0;">${esc(comp.label)}</label><span class="cv">${w} <span style="color:var(--ink-soft);font-weight:400;">(${normPct}% of total)</span></span></div>
        <input type="range" class="weight-range" data-key="${esc(k)}" min="0" max="100" step="1" value="${w}">
        <div style="font-size:.74rem;color:var(--ink-soft);">${esc(comp.unit)}</div>
      </div>`;
    }).join("");

    root.innerHTML = `
      <div class="banner"><strong>Teaching simulation.</strong> Every component score below is authored, illustrative data. The composite score, the ranking and the drill-down are a real weighted-sum calculation, recomputed live from the weight sliders — nothing is pre-scripted.</div>
      <div class="context"><strong>${esc(sc.label)}.</strong> ${esc(sc.context)}</div>
      <div class="card">
        <h2>Weights</h2>
        <div class="presetbtns">${presetBtns}<button class="ghost" id="hideWeightsBtn">${STATE.hideWeights ? "Show weight values" : "Hide weight values"}</button></div>
        <div class="weights${STATE.hideWeights ? " hideweights" : ""}" id="weightsWrap">${weightSliders}</div>
      </div>
      <div class="card">
        <h2>Ranking <span style="font-weight:400;color:var(--ink-soft);font-size:.8rem;">(composite = weighted average of 4 components, 0-100; click a row to drill down)</span></h2>
        <div style="overflow-x:auto;">
        <table class="sites"><thead><tr><th>Site</th><th>Composite</th></tr></thead><tbody>${rows}</tbody></table>
        </div>
      </div>
      <div class="card">
        <h2>Drill-down — ${esc(sel.label)} <span style="font-weight:400;color:var(--ink-soft);font-size:.8rem;">composite ${selComposite.toFixed(1)}</span></h2>
        <div class="drilldown">${drillRows}</div>
        <p style="font-size:.78rem;color:var(--ink-soft);margin-top:8px;">Raw values — incident: ${esc(sel.raw.incident)} · CAPA: ${esc(sel.raw.capa)} · survey: ${esc(sel.raw.survey)} · near-miss: ${esc(sel.raw.nearMiss)}</p>
      </div>
      <div class="callouts">
        <div class="callout"><b>Why it matters —</b> ${esc(sc.callouts.scale)}</div>
        <div class="callout"><b>Watch it flip —</b> ${esc(sc.callouts.flips)}</div>
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

    $$(".weight-range", root).forEach((el) => el.addEventListener("input", (e) => {
      STATE.weights[e.target.dataset.key] = parseInt(e.target.value, 10);
      STATE.activePreset = null;
      render();
    }));
    $$(".preset-btn", root).forEach((el) => el.addEventListener("click", (e) => {
      const p = sc.weightPresets.find((x) => x.id === e.currentTarget.dataset.preset);
      if (p) { STATE.weights = Object.assign({}, p.weights); STATE.activePreset = p.id; render(); }
    }));
    $("#hideWeightsBtn", root).addEventListener("click", () => { STATE.hideWeights = !STATE.hideWeights; render(); });
    $$("table.sites tbody tr", root).forEach((el) => el.addEventListener("click", () => {
      STATE.selectedSite = el.dataset.site;
      render();
    }));
  }

  function buildScenarioPicker() {
    const sel = $("#scenarioSelect");
    sel.innerHTML = scenarioList().map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join("");
    sel.value = STATE.scenarioId;
    sel.addEventListener("change", (e) => {
      STATE.scenarioId = e.target.value;
      STATE.weights = null; STATE.activePreset = null; STATE.selectedSite = null;
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
    try { localStorage.setItem("s16-theme", STATE.theme); } catch (e) {}
    applyTheme();
  }

  function init() {
    const list = scenarioList();
    STATE.scenarioId = list.length ? list[0].id : null;
    STATE.activePreset = "lagging-first";
    buildScenarioPicker();
    applyTheme();
    $("#themeBtn").addEventListener("click", cycleTheme);
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
