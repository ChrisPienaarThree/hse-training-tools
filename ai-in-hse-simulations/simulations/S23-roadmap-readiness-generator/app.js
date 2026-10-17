/* ============================================================================
   S23 — Roadmap / readiness generator. app.js
   Not a model. Every use case's five baseline dimension scores are authored;
   the overall readiness score, the band, and the roadmap's phase order are a
   live computation recomputed on every slider change.
   ============================================================================ */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const STATE = {
    scenarioId: null,
    useCaseId: null,
    scores: null, // { dataQuality, governance, humanInLoop, successMetric, validationPlan }
    theme: (function () { try { return localStorage.getItem("s23-theme") || "system"; } catch (e) { return "system"; } })()
  };

  function scenarioList() { return (window.HSE_S23 && window.HSE_S23.manifest) || []; }
  function scenario(id) { return window.HSE_S23.scenarios[id]; }
  function useCase(sc, id) { return sc.useCases.find((u) => u.id === id); }

  /* ---------- core computation (real, live) ---------- */
  function overallScore(sc) {
    const sum = sc.dimensions.reduce((s, d) => s + (STATE.scores[d.key] || 0), 0);
    return sum / sc.dimensions.length;
  }
  function bandFor(sc, score) {
    return sc.bands.find((b) => score < b.max) || sc.bands[sc.bands.length - 1];
  }
  function roadmapOrder(sc) {
    return sc.dimensions.slice().sort((a, b) => (STATE.scores[a.key] || 0) - (STATE.scores[b.key] || 0));
  }

  /* ---------- rendering ---------- */
  function useCaseCards(sc) {
    return sc.useCases.map((u) => `
      <button class="ucard${u.id === STATE.useCaseId ? " selected" : ""}" data-usecase="${esc(u.id)}">
        <div class="ucname">${esc(u.label)}</div>
        <div class="ucnote">${esc(u.note)}</div>
      </button>`).join("");
  }

  function sliderControls(sc) {
    return sc.dimensions.map((d) => `
      <div class="sctl" data-dim="${esc(d.key)}">
        <div class="sh"><label class="field" style="margin:0;">${esc(d.label)}</label><span class="sv">${STATE.scores[d.key]}</span></div>
        <input type="range" class="dim-range" data-key="${esc(d.key)}" min="0" max="100" step="1" value="${STATE.scores[d.key]}">
        <div class="squestion">${esc(d.question)}</div>
      </div>`).join("");
  }

  function derivedHTML(sc) {
    const score = overallScore(sc);
    const band = bandFor(sc, score);
    const order = roadmapOrder(sc);
    const roadmapRows = order.map((d, idx) => `
      <div class="rmrow">
        <div class="rmphase">Phase ${idx + 1}</div>
        <div class="rmbody">
          <div class="rmhead">${esc(d.label)} <span class="rmscore">${STATE.scores[d.key]}/100</span></div>
          <div class="rmtext">${esc(d.phase)}</div>
        </div>
      </div>`).join("");
    return `
      <div class="scorepanel">
        <div class="scorenum">${score.toFixed(1)}<span class="scoremax">/100</span></div>
        <div class="scoreband band-${esc(band.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase())}">${esc(band.label)}</div>
        <div class="scoredetail">${esc(band.detail)}</div>
      </div>
      <div class="roadmap">${roadmapRows}</div>
    `;
  }

  function render() {
    const sc = scenario(STATE.scenarioId);
    const root = $("#app");
    if (!sc) { root.innerHTML = "<p>Scenario not found.</p>"; return; }
    if (!STATE.useCaseId || !useCase(sc, STATE.useCaseId)) STATE.useCaseId = sc.useCases[0].id;
    if (!STATE.scores) STATE.scores = Object.assign({}, useCase(sc, STATE.useCaseId).baseline);

    const uc = useCase(sc, STATE.useCaseId);

    root.innerHTML = `
      <div class="banner"><strong>Teaching simulation.</strong> Nothing here scores a use case for you. Each candidate's starting dimension scores are authored, illustrative baselines — you drag every slider. The overall score, the readiness band and the roadmap order are a real live calculation from those five numbers.</div>
      <div class="context"><strong>${esc(sc.label)}.</strong> ${esc(sc.context)}</div>
      <div class="card">
        <h2>1 &middot; Pick a candidate AI use case</h2>
        <div class="usecases" id="useCaseWrap">${useCaseCards(sc)}</div>
      </div>
      <div class="card">
        <h2>2 &middot; Score its readiness <span style="font-weight:400;color:var(--ink-soft);font-size:.8rem;">(drag away from the baseline &mdash; these are your judgement, not the tool's)</span></h2>
        <p class="ucnote-active">${esc(uc.note)}</p>
        <div class="sliders" id="slidersWrap">${sliderControls(sc)}</div>
      </div>
      <div class="card">
        <h2>3 &middot; Overall readiness &amp; roadmap</h2>
        <div id="derivedWrap">${derivedHTML(sc)}</div>
      </div>
      <div class="callouts">
        <div class="callout"><b>Why this matters &mdash;</b> ${esc(sc.callouts.scale)}</div>
        <div class="callout"><b>Watch it reorder &mdash;</b> ${esc(sc.callouts.reorders)}</div>
        <div class="callout"><b>Not omniscient &mdash;</b> ${esc(sc.callouts.notOmniscient)}</div>
        <div class="callout"><b>Still misses things &mdash;</b> ${esc(sc.callouts.stillMisses)}</div>
        <div class="callout"><b>Human call &mdash;</b> ${esc(sc.callouts.humanCall)}</div>
      </div>
      <details class="drawer"><summary>Facilitator notes</summary>
        <div class="dbody">
          <p><strong>What this is:</strong> ${esc(sc.notes.what)}</p>
          <p><strong>The maths:</strong> ${esc(sc.notes.math)}</p>
          <p><strong>What's real vs authored:</strong> ${esc(sc.notes.real)}</p>
        </div>
      </details>
    `;

    bindPersistentControls(sc);
  }

  function updateDerived() {
    const sc = scenario(STATE.scenarioId);
    $("#derivedWrap").innerHTML = derivedHTML(sc);
  }

  function bindPersistentControls(sc) {
    $$(".ucard", $("#useCaseWrap")).forEach((el) => el.addEventListener("click", (e) => {
      STATE.useCaseId = e.currentTarget.dataset.usecase;
      STATE.scores = Object.assign({}, useCase(sc, STATE.useCaseId).baseline);
      render();
    }));
    $$(".dim-range", $("#slidersWrap")).forEach((el) => el.addEventListener("input", (e) => {
      const key = e.target.dataset.key;
      STATE.scores[key] = parseInt(e.target.value, 10);
      const row = $(`.sctl[data-dim="${key}"] .sv`, $("#slidersWrap"));
      if (row) row.textContent = STATE.scores[key];
      updateDerived();
    }));
  }

  function buildScenarioPicker() {
    const sel = $("#scenarioSelect");
    sel.innerHTML = scenarioList().map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join("");
    sel.value = STATE.scenarioId;
    sel.addEventListener("change", (e) => {
      STATE.scenarioId = e.target.value;
      STATE.useCaseId = null; STATE.scores = null;
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
    try { localStorage.setItem("s23-theme", STATE.theme); } catch (e) {}
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

  init();
})();
