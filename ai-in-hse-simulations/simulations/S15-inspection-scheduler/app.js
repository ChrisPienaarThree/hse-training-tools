/* ============================================================================
   S15 — Risk-based inspection scheduler. app.js
   Nothing here runs a model. Two scheduling strategies (uniform rotation vs
   risk-weighted) are simulated month-by-month over the SAME seeded sequence
   of randomly-arising faults, so the comparison is apples-to-apples. All
   statistics below are computed live from that simulation.
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
    budget: null,
    horizon: null,
    seed: 1,
    theme: (function () { try { return localStorage.getItem("s15-theme") || "system"; } catch (e) { return "system"; } })()
  };

  function scenarioList() { return (window.HSE_S15 && window.HSE_S15.manifest) || []; }
  function scenario(id) { return window.HSE_S15.scenarios[id]; }

  /* ---------- core simulation ---------- */
  // Pre-draw one random number per (asset, month) up front into a deterministic table, then run each
  // strategy independently against that SAME table, deciding "a fault arises" only when the asset has
  // no fault currently open under that strategy's own state. This keeps the underlying randomness
  // identical across strategies while letting each strategy's actual fault timeline diverge based on
  // when it happens to inspect (an earlier inspection prevents a fault, under that strategy, that the
  // other strategy — visiting later — would still see arise).
  function drawTable(sc, seed, horizon) {
    const rng = mulberry32(hash2("s15-draws-" + seed, sc.id));
    const n = sc.assets.length;
    const table = [];
    for (let m = 0; m < horizon; m++) {
      const row = new Array(n);
      for (let i = 0; i < n; i++) row[i] = rng();
      table.push(row);
    }
    return table;
  }

  function riskScore(asset, monthsSinceInspection) {
    return asset.severity * asset.ncRate * (1 + 0.1 * monthsSinceInspection);
  }

  // Runs one strategy ("uniform" | "risk") over `horizon` months against the shared draw table.
  // Returns { caught: [{assetIdx, ageAtCatch, month}], stillOpen: [assetIdx...], history }
  function runStrategy(sc, table, horizon, budget, strategy) {
    const n = sc.assets.length;
    const faultOpenSince = new Array(n).fill(null); // month the current open fault arose, or null
    const monthsSinceInspection = new Array(n).fill(0);
    let rrPointer = 0; // round-robin pointer for uniform strategy
    const caught = [];
    let totalArisen = 0;

    for (let m = 1; m <= horizon; m++) {
      const row = table[m - 1];
      // 1) faults arise this month, for assets with no fault currently open
      for (let i = 0; i < n; i++) {
        if (faultOpenSince[i] === null && row[i] < sc.assets[i].ncRate) {
          faultOpenSince[i] = m;
          totalArisen++;
        }
        monthsSinceInspection[i]++;
      }
      // 2) choose which assets get inspected this month, up to budget
      let chosen;
      if (strategy === "uniform") {
        chosen = [];
        for (let k = 0; k < budget && k < n; k++) {
          chosen.push((rrPointer + k) % n);
        }
        rrPointer = (rrPointer + budget) % n;
      } else {
        const scored = sc.assets.map((a, i) => ({ i, score: riskScore(a, monthsSinceInspection[i]) }));
        scored.sort((a, b) => b.score - a.score);
        chosen = scored.slice(0, Math.min(budget, n)).map((x) => x.i);
      }
      // 3) inspect: clears any open fault, resets monthsSinceInspection
      for (const i of chosen) {
        if (faultOpenSince[i] !== null) {
          caught.push({ assetIdx: i, arose: faultOpenSince[i], caughtMonth: m, age: m - faultOpenSince[i] });
          faultOpenSince[i] = null;
        }
        monthsSinceInspection[i] = 0;
      }
    }

    const stillOpen = [];
    for (let i = 0; i < n; i++) if (faultOpenSince[i] !== null) stillOpen.push({ assetIdx: i, age: horizon - faultOpenSince[i] + 1 });

    const avgAge = caught.length ? caught.reduce((s, c) => s + c.age, 0) / caught.length : 0;
    return { caught, stillOpen, totalArisen, avgAge, faultOpenSince, monthsSinceInspection };
  }

  function simulate(sc, seed, horizon, budget) {
    const table = drawTable(sc, seed, horizon);
    const uni = runStrategy(sc, table, horizon, budget, "uniform");
    const risk = runStrategy(sc, table, horizon, budget, "risk");
    return { uni, risk, table };
  }

  // The static priority tier: the higher-risk half of assets, ranked by severity x historical rate
  // (independent of any live simulation state). This is what the headline "faster detection" claim is
  // measured against — a risk-weighted schedule concentrates its limited budget on this tier, so the
  // fair test of "does it work" is whether THIS tier gets caught younger, not the whole asset list
  // unweighted (a schedule that deliberately visits low-priority assets less often should not be
  // penalised for that on an unweighted average — that's the point of risk-weighting).
  function priorityTier(sc) {
    const ranked = sc.assets.map((a, i) => ({ i, score: a.severity * a.ncRate })).sort((a, b) => b.score - a.score);
    const cut = Math.ceil(sc.assets.length / 2);
    return new Set(ranked.slice(0, cut).map((x) => x.i));
  }

  function tierAvgAge(caught, tierSet) {
    const rows = caught.filter((c) => tierSet.has(c.assetIdx));
    return rows.length ? rows.reduce((s, c) => s + c.age, 0) / rows.length : null;
  }

  /* ---------- rendering ---------- */
  function bandClass(v, good, warn) { return v >= good ? "ok" : v >= warn ? "warn" : "bad"; }

  function render() {
    const sc = scenario(STATE.scenarioId);
    const root = $("#app");
    if (!sc) { root.innerHTML = "<p>Scenario not found.</p>"; return; }

    const budget = STATE.budget != null ? STATE.budget : sc.budget.default;
    const horizon = STATE.horizon != null ? STATE.horizon : sc.horizon.default;
    const result = simulate(sc, STATE.seed, horizon, budget);
    const n = sc.assets.length;
    const tier = priorityTier(sc);

    const uniCaughtPct = Math.round((100 * result.uni.caught.length) / Math.max(1, result.uni.totalArisen));
    const riskCaughtPct = Math.round((100 * result.risk.caught.length) / Math.max(1, result.risk.totalArisen));
    const uniTierAge = tierAvgAge(result.uni.caught, tier);
    const riskTierAge = tierAvgAge(result.risk.caught, tier);
    const tierBetter = uniTierAge !== null && riskTierAge !== null && riskTierAge <= uniTierAge;

    const tiles = `
      <div class="tiles">
        <div class="tile"><div class="tl">Faults arisen</div><div class="big">${result.uni.totalArisen} <span style="font-size:.5em;font-weight:600;">uniform</span> / ${result.risk.totalArisen} <span style="font-size:.5em;font-weight:600;">risk-wtd</span></div><div class="small">over ${horizon} months, ${n} assets, same draw table</div></div>
        <div class="tile"><div class="tl">Total caught</div><div class="big">${result.uni.caught.length} <span style="font-size:.5em;font-weight:600;">unif. (${uniCaughtPct}%)</span> / ${result.risk.caught.length} <span style="font-size:.5em;font-weight:600;">risk (${riskCaughtPct}%)</span></div><div class="small">of faults that arose under each schedule</div></div>
        <div class="tile"><div class="tl">Higher-risk half — avg age at catch</div><div class="big ${tierBetter ? "ok" : "warn"}">${uniTierAge !== null ? uniTierAge.toFixed(1) : "—"} <span style="font-size:.5em;font-weight:600;">unif.</span> → ${riskTierAge !== null ? riskTierAge.toFixed(1) : "—"} <span style="font-size:.5em;font-weight:600;">risk</span></div><div class="small">the ${tier.size} assets highest on severity × rate</div></div>
        <div class="tile"><div class="tl">Still open at horizon end</div><div class="big">${result.uni.stillOpen.length} <span style="font-size:.6em;">uniform</span> / ${result.risk.stillOpen.length} <span style="font-size:.6em;">risk</span></div><div class="small">unresolved faults, either strategy</div></div>
      </div>`;

    const rankedAssets = sc.assets
      .map((a, i) => ({ a, i, priority: a.severity * a.ncRate }))
      .sort((x, y) => y.priority - x.priority);

    const rows = rankedAssets.map(({ a, i, priority }) => {
      const uc = result.uni.caught.filter((c) => c.assetIdx === i);
      const rc = result.risk.caught.filter((c) => c.assetIdx === i);
      const uOpen = result.uni.stillOpen.find((s) => s.assetIdx === i);
      const rOpen = result.risk.stillOpen.find((s) => s.assetIdx === i);
      const uAge = uc.length ? (uc.reduce((s, c) => s + c.age, 0) / uc.length).toFixed(1) : (uOpen ? uOpen.age + "*" : "—");
      const rAge = rc.length ? (rc.reduce((s, c) => s + c.age, 0) / rc.length).toFixed(1) : (rOpen ? rOpen.age + "*" : "—");
      const isTier = tier.has(i);
      return `<tr${isTier ? ' style="border-left:3px solid var(--purple);"' : ""}>
        <td>${esc(a.label)}${isTier ? ' <span style="color:var(--purple);font-size:.72rem;">▲ priority</span>' : ""}</td>
        <td class="num">${a.severity}</td>
        <td class="num">${(a.ncRate * 100).toFixed(0)}%</td>
        <td class="num">${uc.length}${uOpen ? "*" : ""}</td>
        <td class="num">${uAge}</td>
        <td class="num ${rc.length >= uc.length ? "win" : ""}">${rc.length}${rOpen ? "*" : ""}</td>
        <td class="num ${(rc.length && uc.length && parseFloat(rAge) <= parseFloat(uAge)) ? "win" : ""}">${rAge}</td>
      </tr>`;
    }).join("");

    const budgetOpts = rangeOptions(sc.budget, budget);
    const horizonOpts = rangeOptions(sc.horizon, horizon);

    root.innerHTML = `
      <div class="banner"><strong>Teaching simulation.</strong> The two schedules run against the identical, hidden, seeded sequence of arising faults — this is a real Monte Carlo comparison of scheduling logic, not a scripted outcome. Severity and non-conformance rates are authored inputs.</div>
      <div class="context"><strong>${esc(sc.label)}.</strong> ${esc(sc.context)}</div>
      ${tiles}
      <div class="card">
        <h2>Controls</h2>
        <div class="ctl"><div class="ch"><label class="field" style="margin:0;">Inspector-day budget / month</label><span class="cv" id="budgetVal">${budget}</span></div>
          <input type="range" id="budgetRange" min="${sc.budget.min}" max="${sc.budget.max}" step="1" value="${budget}"></div>
        <div class="ctl"><div class="ch"><label class="field" style="margin:0;">Horizon (months)</label><span class="cv" id="horizonVal">${horizon}</span></div>
          <input type="range" id="horizonRange" min="${sc.horizon.min}" max="${sc.horizon.max}" step="1" value="${horizon}"></div>
        <div class="ctl" style="width:auto;">
          <div class="opsbtns">
            <button id="reseedBtn" class="ghost">Re-seed fault sequence</button>
            <button id="resetBtn" class="ghost">Reset to defaults</button>
          </div>
        </div>
      </div>
      <div class="card">
        <h2>Per-asset outcomes, ranked by severity × historical rate <span style="font-weight:400;color:var(--ink-soft);font-size:.8rem;">(seed ${STATE.seed})</span></h2>
        <div style="overflow-x:auto;">
        <table class="assets">
          <thead><tr><th>Asset</th><th>Sev.</th><th>Hist. rate</th><th>Uniform: caught</th><th>Uniform: avg age</th><th>Risk-weighted: caught</th><th>Risk-weighted: avg age</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        </div>
        <p class="small" style="color:var(--ink-soft);font-size:.78rem;margin-top:8px;">▲ priority marks the higher-risk half — compare its rows to the tile above. * still open at horizon end (age shown is age at horizon end, not at catch). Green highlights risk-weighted matching or beating uniform on that row — expect that mostly in the priority rows, not necessarily everywhere.</p>
      </div>
      <div class="callouts">
        <div class="callout"><b>Why it matters —</b> ${esc(sc.callouts.scale)}</div>
        <div class="callout"><b>Faster detection —</b> ${esc(sc.callouts.fasterDetection)}</div>
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

    $("#budgetRange").addEventListener("input", (e) => { STATE.budget = parseInt(e.target.value, 10); $("#budgetVal").textContent = STATE.budget; renderDebounced(); });
    $("#horizonRange").addEventListener("input", (e) => { STATE.horizon = parseInt(e.target.value, 10); $("#horizonVal").textContent = STATE.horizon; renderDebounced(); });
    $("#reseedBtn").addEventListener("click", () => { STATE.seed++; render(); });
    $("#resetBtn").addEventListener("click", () => { STATE.budget = null; STATE.horizon = null; STATE.seed = 1; render(); });
  }

  let renderTimer = null;
  function renderDebounced() { clearTimeout(renderTimer); renderTimer = setTimeout(render, 0); }

  function rangeOptions() { return null; } // placeholder, ranges are plain <input type=range>, unused helper kept minimal

  function buildScenarioPicker() {
    const sel = $("#scenarioSelect");
    sel.innerHTML = scenarioList().map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join("");
    sel.value = STATE.scenarioId;
    sel.addEventListener("change", (e) => {
      STATE.scenarioId = e.target.value;
      STATE.budget = null; STATE.horizon = null; STATE.seed = 1;
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
    try { localStorage.setItem("s15-theme", STATE.theme); } catch (e) {}
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
