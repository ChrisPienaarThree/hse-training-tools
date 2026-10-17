/* ============================================================================
   S19 — Prompt engineering & review gate. app.js
   Nothing here runs a model. Presets carry pre-authored drafts; the
   checklist score is a live keyword scan of whatever text is in the prompt
   box (edits included), and the claim tally is a live count over the
   selected draft's authored grounded/fabricated tags.
   ============================================================================ */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const DIMENSIONS = ["specific", "grounded", "format", "constraints"];
  const DIM_LABELS = { specific: "Specific", grounded: "Grounded", format: "Format", constraints: "Constraints" };

  const STATE = {
    scenarioId: null,
    promptText: null,
    selectedPreset: null,
    theme: (function () { try { return localStorage.getItem("s19-theme") || "system"; } catch (e) { return "system"; } })()
  };

  function scenarioList() { return (window.HSE_S19 && window.HSE_S19.manifest) || []; }
  function scenario(id) { return window.HSE_S19.scenarios[id]; }

  /* ---------- live checklist scoring ---------- */
  function dimensionScore(text, dim) {
    const lower = text.toLowerCase();
    let count = 0;
    for (const kw of dim.keywords) if (lower.indexOf(kw.toLowerCase()) !== -1) count++;
    return Math.min(count, dim.max);
  }

  function scorePrompt(sc, text) {
    const per = {};
    let total = 0;
    for (const key of DIMENSIONS) { per[key] = dimensionScore(text, sc.scoring[key]); total += per[key]; }
    const maxTotal = DIMENSIONS.reduce((s, k) => s + sc.scoring[k].max, 0);
    const risk = Math.max(5, Math.min(95, Math.round(95 - total * 9)));
    return { per, total, maxTotal, risk };
  }

  /* ---------- rendering ---------- */
  function render() {
    const sc = scenario(STATE.scenarioId);
    const root = $("#app");
    if (!sc) { root.innerHTML = "<p>Scenario not found.</p>"; return; }
    if (STATE.promptText == null) STATE.promptText = sc.presets[0].prompt;
    if (!STATE.selectedPreset) STATE.selectedPreset = sc.presets[0].id;

    const score = scorePrompt(sc, STATE.promptText);
    const preset = sc.presets.find((p) => p.id === STATE.selectedPreset) || sc.presets[0];
    const groundedCount = preset.draft.claims.filter((c) => c.grounded).length;
    const fabricatedCount = preset.draft.claims.length - groundedCount;

    const presetBtns = sc.presets.map((p) => `<button class="ghost preset-btn${STATE.selectedPreset === p.id ? " active" : ""}" data-preset="${esc(p.id)}">${esc(p.label)}</button>`).join("");

    const scoreBoxes = DIMENSIONS.map((k) => `<div class="scorebox"><div class="sv">${score.per[k]}/${sc.scoring[k].max}</div><div class="sl">${esc(DIM_LABELS[k])}</div></div>`).join("");

    const riskColor = score.risk >= 60 ? "var(--red)" : score.risk >= 30 ? "var(--amber)" : "var(--green)";

    const claimItems = preset.draft.claims.map((c) => `<li><span class="${c.grounded ? "g" : "f"}">${c.grounded ? "✓ grounded" : "⚠ fabricated"}</span> — ${esc(c.text)}</li>`).join("");

    const notesList = sc.sourceNotes.map((n) => `<li>${esc(n)}</li>`).join("");

    root.innerHTML = `
      <div class="banner"><strong>Teaching simulation.</strong> No model runs here. The checklist score below is a live keyword scan of your prompt text — edit it freely. The four preset drafts are pre-authored, chosen to show the kind of output a prompt at that quality level tends to produce.</div>
      <div class="context"><strong>${esc(sc.label)}.</strong> ${esc(sc.context)}</div>
      <div class="notesbox"><strong>Source notes (the only permitted facts):</strong><ul>${notesList}</ul></div>
      <div class="grid2">
        <div class="card">
          <h2>Prompt</h2>
          <div class="presetbtns">${presetBtns}</div>
          <textarea id="promptBox">${esc(STATE.promptText)}</textarea>
          <p style="font-size:.76rem;color:var(--ink-soft);margin-top:6px;">Editing this box updates the checklist score live. It does not generate a new draft — only the four presets above have an authored draft attached.</p>
        </div>
        <div class="card">
          <h2>Live checklist score <span id="scoreTotalSpan" style="font-weight:400;color:var(--ink-soft);font-size:.8rem;">(${score.total}/${score.maxTotal})</span></h2>
          <div class="scorewrap">${scoreBoxes}</div>
          <h3>Predicted hallucination risk</h3>
          <div class="riskbar"><span style="width:${score.risk}%;background:${riskColor};"></span></div>
          <div id="riskPctVal" style="font-weight:700;color:${riskColor};">${score.risk}%</div>
          <p style="font-size:.78rem;color:var(--ink-soft);margin-top:6px;">predictedRisk% = clamp(95 − score×9, 5, 95). A prediction from the prompt's checklist score, not a measurement of the draft you're viewing.</p>
        </div>
      </div>
      <div class="card">
        <h2>Draft for "${esc(preset.label)}" <span style="font-weight:400;color:var(--ink-soft);font-size:.8rem;">${groundedCount} grounded · ${fabricatedCount} fabricated (of ${preset.draft.claims.length} claims)</span></h2>
        <div class="draftbox">${esc(preset.draft.text)}</div>
        <h3>Claim-by-claim</h3>
        <ul class="claimlist">${claimItems}</ul>
      </div>
      <div class="callouts">
        <div class="callout"><b>Why it matters —</b> ${esc(sc.callouts.scale)}</div>
        <div class="callout"><b>The ladder —</b> ${esc(sc.callouts.ladder)}</div>
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

    $("#promptBox", root).addEventListener("input", (e) => {
      STATE.promptText = e.target.value;
      // re-render score only, to avoid stealing focus/cursor from the textarea on every keystroke
      renderScoreOnly(sc);
    });
    $$(".preset-btn", root).forEach((el) => el.addEventListener("click", (e) => {
      const p = sc.presets.find((x) => x.id === e.currentTarget.dataset.preset);
      if (p) { STATE.selectedPreset = p.id; STATE.promptText = p.prompt; render(); }
    }));
  }

  // Cheap partial re-render for the score panel + score boxes, so typing in the textarea doesn't
  // rebuild the DOM under the user's cursor on every keystroke.
  function renderScoreOnly(sc) {
    const score = scorePrompt(sc, STATE.promptText);
    const boxes = $$(".scorebox .sv");
    DIMENSIONS.forEach((k, i) => { if (boxes[i]) boxes[i].textContent = `${score.per[k]}/${sc.scoring[k].max}`; });
    const totalEl = $("#scoreTotalSpan");
    if (totalEl) totalEl.textContent = `(${score.total}/${score.maxTotal})`;
    const riskColor = score.risk >= 60 ? "var(--red)" : score.risk >= 30 ? "var(--amber)" : "var(--green)";
    const bar = $(".riskbar > span");
    if (bar) { bar.style.width = score.risk + "%"; bar.style.background = riskColor; }
    const riskVal = $("#riskPctVal");
    if (riskVal) { riskVal.textContent = score.risk + "%"; riskVal.style.color = riskColor; }
  }

  function buildScenarioPicker() {
    const sel = $("#scenarioSelect");
    sel.innerHTML = scenarioList().map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join("");
    sel.value = STATE.scenarioId;
    sel.addEventListener("change", (e) => {
      STATE.scenarioId = e.target.value;
      STATE.promptText = null; STATE.selectedPreset = null;
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
    try { localStorage.setItem("s19-theme", STATE.theme); } catch (e) {}
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
