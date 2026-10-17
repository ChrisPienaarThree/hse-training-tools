/* ============================================================================
   S20 — Emergency: scenario generator vs live coordinator. app.js
   BEFORE panel: a seeded PRNG picks one option from each generator list,
   live — real randomness, not pre-written prose. DURING panel: a scripted
   raw-feed timeline plays via a real transport (play/step/reset); the AI
   summary panel shows whichever authored checkpoint is current, and the
   events-behind/minutes-behind gap against the raw feed is computed live.
   ============================================================================ */
(function () {
  "use strict";

  /* ---------- seeded RNG (shared pattern across all S-sims) ---------- */
  function hstr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function hash2(a, b) { return hstr(a + "::" + b); }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const STATE = {
    scenarioId: null,
    genSeed: 1,
    eventIndex: 0,
    playing: false,
    playTimer: null,
    theme: (function () { try { return localStorage.getItem("s20-theme") || "system"; } catch (e) { return "system"; } })()
  };

  function scenarioList() { return (window.HSE_S20 && window.HSE_S20.manifest) || []; }
  function scenario(id) { return window.HSE_S20.scenarios[id]; }

  /* ---------- BEFORE: seeded generator ---------- */
  const GEN_KEYS = ["hazardTypes", "locations", "complicatingFactors", "casualtyCounts", "weatherConditions"];
  const GEN_LABELS = { hazardTypes: "Hazard", locations: "Location", complicatingFactors: "Complicating factor", casualtyCounts: "Casualties (drill premise)", weatherConditions: "Weather" };

  function generateBrief(sc, seed) {
    const rng = mulberry32(hash2("s20-gen-" + seed, sc.id));
    const picks = {};
    for (const k of GEN_KEYS) {
      const list = sc.generator[k];
      picks[k] = list[Math.floor(rng() * list.length)];
    }
    return picks;
  }

  function combinationCount(sc) {
    return GEN_KEYS.reduce((prod, k) => prod * sc.generator[k].length, 1);
  }

  /* ---------- DURING: timeline + lag/error computation ---------- */
  function activeCheckpoint(sc, eventIndex) {
    const cps = sc.timeline.checkpoints;
    let active = null;
    for (const cp of cps) if (cp.afterEventIndex <= eventIndex) active = cp;
    return active;
  }

  function gapInfo(sc, eventIndex) {
    const cp = activeCheckpoint(sc, eventIndex);
    if (!cp) return { checkpoint: null, eventsBehind: null, minutesBehind: null };
    const eventsBehind = eventIndex - cp.afterEventIndex;
    const minutesBehind = sc.timeline.events[eventIndex].t - sc.timeline.events[cp.afterEventIndex].t;
    return { checkpoint: cp, eventsBehind, minutesBehind };
  }

  /* ---------- rendering ---------- */
  function render() {
    const sc = scenario(STATE.scenarioId);
    const root = $("#app");
    if (!sc) { root.innerHTML = "<p>Scenario not found.</p>"; return; }

    const brief = generateBrief(sc, STATE.genSeed);
    const combos = combinationCount(sc);
    const briefLine = GEN_KEYS.map((k) => `<b>${esc(GEN_LABELS[k])}:</b> ${esc(brief[k])}`).join(" &nbsp;·&nbsp; ");

    const events = sc.timeline.events;
    const eventIndex = Math.max(0, Math.min(events.length - 1, STATE.eventIndex));
    const feedItems = events.map((e, i) => `<li class="${i === eventIndex ? "current" : ""}" style="${i > eventIndex ? "opacity:.35;" : ""}"><span class="tm">t=${e.t}min</span>${esc(e.text)}</li>`).join("");

    const gap = gapInfo(sc, eventIndex);
    let summaryHtml;
    if (!gap.checkpoint) {
      summaryHtml = `<div class="summarybox none">No AI summary yet — insufficient events processed.</div>`;
    } else {
      const wrong = gap.checkpoint.isAccurate === false;
      const stale = !wrong && (gap.eventsBehind > 0);
      const cls = wrong ? "wrong" : stale ? "stale" : "ok";
      const gapTagCls = wrong ? "wrong" : stale ? "stale" : "ok";
      const gapLabel = wrong
        ? "⚠ this summary states something the raw feed does not support"
        : (gap.eventsBehind === 0 ? "✓ up to date with the raw feed" : `⏱ ${gap.eventsBehind} event${gap.eventsBehind === 1 ? "" : "s"} / ${gap.minutesBehind} min behind the raw feed`);
      summaryHtml = `<div class="summarybox ${cls}">${esc(gap.checkpoint.text)}<div><span class="gaptag ${gapTagCls}">${gapLabel}</span></div></div>
        <p class="statline">Summary last refreshed after raw-feed event #${gap.checkpoint.afterEventIndex + 1} (t=${events[gap.checkpoint.afterEventIndex].t}min). Viewing raw feed at t=${events[eventIndex].t}min.</p>`;
    }

    root.innerHTML = `
      <div class="banner"><strong>Teaching simulation.</strong> The BEFORE panel's drill brief is real seeded randomness over authored option lists. The DURING panel's raw feed and AI summary checkpoints are authored — but the gap between them (events/minutes behind, or an outright wrong claim) is computed live from wherever you are in the playback.</div>
      <div class="context"><strong>${esc(sc.label)}.</strong> ${esc(sc.context)}</div>

      <div class="card">
        <span class="sectiontag before">Before — drill scenario generator</span>
        <h2>Generated drill brief</h2>
        <div class="briefbox">${briefLine}</div>
        <div class="statline">Seed ${STATE.genSeed} · ${combos.toLocaleString()} distinct drill briefs possible from these five option lists (5 lists × ${GEN_KEYS.map((k) => sc.generator[k].length).join("×")} = ${combos.toLocaleString()}).</div>
        <div style="margin-top:10px;"><button id="reseedBtn" class="ghost">Generate another (re-seed)</button></div>
      </div>

      <div class="card">
        <span class="sectiontag during">During — live incident timeline</span>
        <h2>Playback</h2>
        <div class="transport">
          <button id="playBtn" class="primary">${STATE.playing ? "Pause" : "Play"}</button>
          <button id="stepBtn" class="ghost">Step</button>
          <button id="resetBtn" class="ghost">Reset</button>
          <input type="range" id="eventRange" min="0" max="${events.length - 1}" step="1" value="${eventIndex}">
          <span class="statline">Event ${eventIndex + 1} / ${events.length} · t=${events[eventIndex].t}min</span>
        </div>
        <div class="grid2">
          <div>
            <h3>Raw feed (ground truth)</h3>
            <ul class="feedlist">${feedItems}</ul>
          </div>
          <div>
            <h3>AI summary panel</h3>
            ${summaryHtml}
          </div>
        </div>
      </div>

      <div class="callouts">
        <div class="callout"><b>Breadth —</b> ${esc(sc.callouts.breadth)}</div>
        <div class="callout"><b>The lag moment —</b> ${esc(sc.callouts.lagMoment)}</div>
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

    $("#reseedBtn").addEventListener("click", () => { STATE.genSeed++; render(); });
    $("#playBtn").addEventListener("click", () => { togglePlay(sc); });
    $("#stepBtn").addEventListener("click", () => { stopPlay(); STATE.eventIndex = Math.min(events.length - 1, eventIndex + 1); render(); });
    $("#resetBtn").addEventListener("click", () => { stopPlay(); STATE.eventIndex = 0; render(); });
    $("#eventRange").addEventListener("input", (e) => { stopPlay(); STATE.eventIndex = parseInt(e.target.value, 10); render(); });
  }

  function stopPlay() {
    STATE.playing = false;
    if (STATE.playTimer) { clearInterval(STATE.playTimer); STATE.playTimer = null; }
  }

  function togglePlay(sc) {
    if (STATE.playing) { stopPlay(); render(); return; }
    STATE.playing = true;
    STATE.playTimer = setInterval(() => {
      const events = sc.timeline.events;
      if (STATE.eventIndex >= events.length - 1) { stopPlay(); render(); return; }
      STATE.eventIndex++;
      render();
    }, 900);
    render();
  }

  function buildScenarioPicker() {
    const sel = $("#scenarioSelect");
    sel.innerHTML = scenarioList().map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join("");
    sel.value = STATE.scenarioId;
    sel.addEventListener("change", (e) => {
      stopPlay();
      STATE.scenarioId = e.target.value;
      STATE.genSeed = 1; STATE.eventIndex = 0;
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
    try { localStorage.setItem("s20-theme", STATE.theme); } catch (e) {}
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
