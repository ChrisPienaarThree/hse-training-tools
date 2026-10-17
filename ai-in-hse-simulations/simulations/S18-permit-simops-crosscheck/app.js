/* ============================================================================
   S18 — AI-assisted permit-to-work / SIMOPs cross-check. app.js
   Nothing here runs a model. Work types, required controls, the SIMOPs
   incompatibility matrix and the active permits are all authored. Every
   checklist-completeness check and every SIMOPs clash is a real rule
   evaluation (set lookup + time-window overlap arithmetic), live.
   ============================================================================ */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const STATE = {
    scenarioId: null,
    candidate: null, // { workType, zone, start, end }
    checked: null,   // Set of ticked control labels for the current work type
    theme: (function () { try { return localStorage.getItem("s18-theme") || "system"; } catch (e) { return "system"; } })()
  };

  function scenarioList() { return (window.HSE_S18 && window.HSE_S18.manifest) || []; }
  function scenario(id) { return window.HSE_S18.scenarios[id]; }

  function fmtHour(h) {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
  }

  /* ---------- rule engine (real, live) ---------- */
  function pairKey(a, b) { return [a, b].sort().join("|"); }

  function incompatibleSet(sc) {
    const s = new Set();
    for (const [a, b] of sc.incompatiblePairs) s.add(pairKey(a, b));
    return s;
  }

  function overlaps(aStart, aEnd, bStart, bEnd) { return aStart < bEnd && aEnd > bStart; }

  function missingControls(sc, candidate, checked) {
    const wt = sc.workTypes.find((w) => w.key === candidate.workType);
    return wt.requiredControls.filter((c) => !checked.has(c));
  }

  function simopsClashes(sc, candidate) {
    const incompat = incompatibleSet(sc);
    return sc.activePermits.filter((p) => {
      if (p.zone !== candidate.zone) return false;
      if (!overlaps(candidate.start, candidate.end, p.start, p.end)) return false;
      return incompat.has(pairKey(candidate.workType, p.workType));
    });
  }

  /* ---------- rendering ---------- */
  function render() {
    const sc = scenario(STATE.scenarioId);
    const root = $("#app");
    if (!sc) { root.innerHTML = "<p>Scenario not found.</p>"; return; }
    if (!STATE.candidate) STATE.candidate = Object.assign({}, sc.defaultCandidate);
    if (!STATE.checked) STATE.checked = new Set();

    const candidate = STATE.candidate;
    const wt = sc.workTypes.find((w) => w.key === candidate.workType);
    const missing = missingControls(sc, candidate, STATE.checked);
    const clashes = simopsClashes(sc, candidate);
    const controlsPass = missing.length === 0;
    const simopsPass = clashes.length === 0;

    const workTypeOpts = sc.workTypes.map((w) => `<option value="${esc(w.key)}"${w.key === candidate.workType ? " selected" : ""}>${esc(w.label)}</option>`).join("");
    const zoneOpts = sc.zones.map((z) => `<option value="${esc(z)}"${z === candidate.zone ? " selected" : ""}>${esc(z)}</option>`).join("");

    const checklist = wt.requiredControls.map((c) => `<li><input type="checkbox" class="control-check" data-control="${esc(c)}" ${STATE.checked.has(c) ? "checked" : ""}> <span>${esc(c)}</span></li>`).join("");

    const permitRows = sc.activePermits.map((p) => {
      const isClash = clashes.indexOf(p) !== -1;
      const inZone = p.zone === candidate.zone;
      const timeOverlap = overlaps(candidate.start, candidate.end, p.start, p.end);
      return `<tr class="${isClash ? "overlapzone" : ""}">
        <td>${esc(p.id)}</td>
        <td>${esc(sc.workTypes.find((w) => w.key === p.workType).label)}</td>
        <td>${esc(p.zone)}</td>
        <td>${fmtHour(p.start)}–${fmtHour(p.end)}</td>
        <td>${esc(p.description)}</td>
        <td>${isClash ? '<b style="color:var(--red);">SIMOPs clash</b>' : (inZone && timeOverlap ? "same zone/time, compatible" : "—")}</td>
      </tr>`;
    }).join("");

    const clashCards = clashes.length
      ? clashes.map((p) => `<div class="clashcard"><b>Clash with ${esc(p.id)}</b> (${esc(sc.workTypes.find((w) => w.key === p.workType).label)}, ${esc(p.zone)}, ${fmtHour(p.start)}–${fmtHour(p.end)}) — ${esc(p.description)}. ${esc(wt.label)} and ${esc(sc.workTypes.find((w) => w.key === p.workType).label)} are listed as incompatible in the same zone at overlapping times.</div>`).join("")
      : `<div class="okcard">No SIMOPs clashes — no active permit in the same zone with an overlapping time window is on the incompatibility list.</div>`;

    root.innerHTML = `
      <div class="banner"><strong>Teaching simulation.</strong> Work types, required controls, the incompatibility matrix and the five active permits are authored. The checklist and SIMOPs checks below are real rule evaluations — a set lookup and a time-window overlap calculation — run live on whatever candidate permit you build.</div>
      <div class="context"><strong>${esc(sc.label)}.</strong> ${esc(sc.context)}</div>
      <div class="grid2">
        <div class="card">
          <h2>Build a candidate permit</h2>
          <div class="ctl"><label class="field">Work type</label><select id="workTypeSelect">${workTypeOpts}</select></div>
          <div class="ctl"><label class="field">Zone</label><select id="zoneSelect">${zoneOpts}</select></div>
          <div class="ctl"><div class="ch"><label class="field" style="margin:0;">Start time</label><span class="cv" id="startVal">${fmtHour(candidate.start)}</span></div>
            <input type="range" id="startRange" min="0" max="24" step="0.5" value="${candidate.start}"></div>
          <div class="ctl"><div class="ch"><label class="field" style="margin:0;">End time</label><span class="cv" id="endVal">${fmtHour(candidate.end)}</span></div>
            <input type="range" id="endRange" min="0" max="24" step="0.5" value="${candidate.end}"></div>
          <h3>Required controls — ${esc(wt.label)}</h3>
          <ul class="checklist">${checklist}</ul>
        </div>
        <div class="card">
          <h2>Cross-check results</h2>
          <div class="resultbanner ${controlsPass ? "pass" : "fail"}">${controlsPass ? "✓ All required controls ticked" : `✗ ${missing.length} required control${missing.length === 1 ? "" : "s"} not ticked: ${missing.map(esc).join("; ")}`}</div>
          <div class="resultbanner ${simopsPass ? "pass" : "fail"}">${simopsPass ? "✓ No SIMOPs clashes" : `✗ ${clashes.length} SIMOPs clash${clashes.length === 1 ? "" : "es"} with active permits`}</div>
          ${clashCards}
        </div>
      </div>
      <div class="card">
        <h2>Active permits</h2>
        <div style="overflow-x:auto;">
        <table class="permits">
          <thead><tr><th>ID</th><th>Work type</th><th>Zone</th><th>Time</th><th>Description</th><th>vs candidate</th></tr></thead>
          <tbody>${permitRows}</tbody>
        </table>
        </div>
      </div>
      <div class="callouts">
        <div class="callout"><b>Why it matters —</b> ${esc(sc.callouts.scale)}</div>
        <div class="callout"><b>Just two checks —</b> ${esc(sc.callouts.twoChecks)}</div>
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

    $("#workTypeSelect").addEventListener("change", (e) => {
      STATE.candidate.workType = e.target.value;
      STATE.checked = new Set();
      render();
    });
    $("#zoneSelect").addEventListener("change", (e) => { STATE.candidate.zone = e.target.value; render(); });
    $("#startRange").addEventListener("input", (e) => {
      let v = parseFloat(e.target.value);
      if (v >= STATE.candidate.end) v = STATE.candidate.end - 0.5;
      STATE.candidate.start = Math.max(0, v);
      render();
    });
    $("#endRange").addEventListener("input", (e) => {
      let v = parseFloat(e.target.value);
      if (v <= STATE.candidate.start) v = STATE.candidate.start + 0.5;
      STATE.candidate.end = Math.min(24, v);
      render();
    });
    $$(".control-check", root).forEach((el) => el.addEventListener("change", (e) => {
      const c = e.target.dataset.control;
      if (e.target.checked) STATE.checked.add(c); else STATE.checked.delete(c);
      render();
    }));
  }

  function buildScenarioPicker() {
    const sel = $("#scenarioSelect");
    sel.innerHTML = scenarioList().map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join("");
    sel.value = STATE.scenarioId;
    sel.addEventListener("change", (e) => {
      STATE.scenarioId = e.target.value;
      STATE.candidate = null; STATE.checked = null;
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
    try { localStorage.setItem("s18-theme", STATE.theme); } catch (e) {}
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
