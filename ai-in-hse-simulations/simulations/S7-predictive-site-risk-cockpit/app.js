/* ============================================================================
   S7 — Predictive site-risk cockpit.  Demo logic.

   No model was trained. The logistic coefficients, each indicator's mean/SD,
   the drift terms and the health thresholds are PRE-AUTHORED. Live and real:
   the standardisation, the logistic prediction, the drifting "true" risk it is
   compared against, the seeded weekly outcome series, and every gap and health
   flag on screen.
   ============================================================================ */
(function () {
  "use strict";

  var S7 = window.HSE_S7 || {};
  var scenarios = S7.scenarios || {};
  var manifest = S7.manifest ||
    Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });

  var el = {}, ui = null, curId = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
  function pct(p) { return (p * 100).toFixed(1) + "%"; }
  function ppts(x) { return (x >= 0 ? "+" : "−") + Math.abs(x * 100).toFixed(1) + " pts"; }
  function sc() { return scenarios[curId]; }
  function inds() { return sc().indicators; }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hh(a, b) { return (Math.imul(a >>> 0, 2654435761) ^ Math.imul((b + 100000) >>> 0, 40503)) >>> 0; }

  /* ------------------------------------------------------------ model math */
  function seasonal(week) {
    var d = sc().drift;
    return d.seasonalAmp * Math.sin(2 * Math.PI * (week + d.seasonalPhase) / d.seasonalPeriod);
  }
  function z(ind, val) { return (val - ind.mean) / ind.sd; }
  function reportedVal(ind) {
    var v = ui.v[ind.key];
    return ind.underreportable ? Math.round(v * ui.reporting) : v;
  }
  function culturePenalty() {
    var s = sc();
    return s.underreport.culturePenaltyAtWorst * clamp((1 - ui.reporting) / (1 - s.reportingFloor), 0, 1);
  }
  function driftWeeks() { return Math.max(0, ui.weeks - ui.refit); }
  function frozenWeek() { return Math.min(ui.refit, ui.weeks); }

  function predLogitFrozen() {
    var s = sc(), fw = frozenWeek();
    var c = s.intercept + s.drift.latentPerWeek * fw + seasonal(s.baseWeek + fw);
    inds().forEach(function (ind) { c += (ind.coef + ind.driftPerWk * fw) * z(ind, reportedVal(ind)); });
    return c;
  }
  function trueLogitAt(week) {
    var s = sc();
    var c = s.intercept + s.drift.latentPerWeek * week + seasonal(s.baseWeek + week);
    inds().forEach(function (ind) { c += (ind.coef + ind.driftPerWk * week) * z(ind, ui.v[ind.key]); });
    return c + culturePenalty();
  }
  function contributions() {
    var fw = frozenWeek();
    return inds().map(function (ind) {
      return { key: ind.key, label: ind.label, c: (ind.coef + ind.driftPerWk * fw) * z(ind, reportedVal(ind)) };
    });
  }

  /* weekly probability from a 30-day probability */
  function weekly(p30) { return 1 - Math.pow(1 - clamp(p30, 0, 0.999), 7 / 30); }

  function series() {
    var now = ui.weeks, pts = [];
    var predNow = sigmoid(predLogitFrozen());
    for (var k = 25; k >= 0; k--) {
      var t = now - k;
      var pT = sigmoid(trueLogitAt(t));
      var pP = t <= ui.refit ? sigmoid(trueLogitAt(t)) : predNow;   /* model valid up to the refit, frozen after */
      pts.push({ t: t, k: 25 - k, pTrue: pT, pPred: pP });
    }
    /* seeded weekly outcomes + trailing-8 rolling rate (as a 30-day equivalent) */
    var rng = mulberry32(hh(ui.seed, 999));
    var obs = pts.map(function (p) {
      var r = mulberry32(hh(ui.seed, p.t))();
      return r < weekly(p.pTrue) ? 1 : 0;
    });
    pts.forEach(function (p, i) {
      var lo = Math.max(0, i - 7), win = obs.slice(lo, i + 1);
      var rate = win.reduce(function (a, b) { return a + b; }, 0) / win.length;
      p.obs = clamp(rate * (30 / 7), 0, 1);
    });
    var trailing = obs.reduce(function (a, b) { return a + b; }, 0) / obs.length;
    return { pts: pts, backtested30: clamp(trailing * (30 / 7), 0, 1), predNow: predNow };
  }

  function band(p) {
    return p < 0.08 ? { t: "ok", n: "Low" } : p < 0.16 ? { t: "warn", n: "Elevated" } : { t: "bad", n: "High" };
  }

  /* --------------------------------------------------------------- render */
  function seriesSVG(S) {
    var maxY = Math.max(0.2, S.pts.reduce(function (m, p) { return Math.max(m, p.pTrue, p.pPred, p.obs); }, 0) * 1.1);
    var X = function (k) { return 30 + k / 25 * 280; };
    var Y = function (p) { return 115 - clamp(p / maxY, 0, 1) * 100; };
    var path = function (sel) { return S.pts.map(function (p, i) { return (i ? "L" : "M") + X(p.k).toFixed(1) + " " + Y(p[sel]).toFixed(1); }).join(" "); };
    var svg = "<svg viewBox='0 0 320 132' preserveAspectRatio='xMidYMid meet'>";
    svg += "<line x1='30' y1='115' x2='310' y2='115' stroke='var(--line-strong)'/>";
    svg += "<text x='30' y='128'>26 weeks ago</text><text x='250' y='128'>now</text>";
    svg += "<text x='2' y='18'>" + (maxY * 100).toFixed(0) + "%</text><text x='8' y='115'>0</text>";
    var refK = 25 - (ui.weeks - ui.refit);
    if (refK >= 0 && refK <= 25 && driftWeeks() > 0)
      svg += "<line class='refit' x1='" + X(refK).toFixed(1) + "' y1='12' x2='" + X(refK).toFixed(1) + "' y2='115'/>" +
        "<text x='" + (X(refK) + 2).toFixed(1) + "' y='11'>fitted</text>";
    svg += "<path class='lo' d='" + path("obs") + "'/>";
    svg += "<path class='lt' d='" + path("pTrue") + "'/>";
    svg += "<path class='lp' d='" + path("pPred") + "'/>";
    return svg + "</svg>";
  }

  function paint() {
    var s = sc();
    var S = series();
    var pPred = S.predNow, pTrue = sigmoid(trueLogitAt(ui.weeks));
    var gap = Math.abs(pPred - pTrue);   /* real miscalibration; the 26-sample rate is too noisy to be a health signal */
    var bp = band(pPred), bt = band(pTrue);
    var dw = driftWeeks();
    var health = (dw >= s.health.driftWeeksStale || gap >= s.health.gapStale) ? { t: "bad", n: "Stale — recalibrate" }
      : (dw >= s.health.driftWeeksWarn || gap >= s.health.gapWarn) ? { t: "warn", n: "Suspect" }
      : { t: "ok", n: "Good" };
    var predVsTrue = pPred - pTrue;

    el.cockpit.innerHTML =
      "<div class='tile'><div class='tl'>Predicted 30-day risk (model output)</div>" +
        "<div class='big " + bp.t + "'>" + pct(pPred) + "</div>" +
        "<div class='small'>band: <b>" + bp.n + "</b> &nbsp;·&nbsp; back-tested actual (26 wk): " + pct(S.backtested30) + "</div></div>" +
      "<div class='tile'><div class='tl'>Model health</div>" +
        "<div><span class='pill " + health.t + "'>" + health.n + "</span></div>" +
        "<div class='small'>fitted <b>" + dw + "</b> week" + (dw === 1 ? "" : "s") + " ago &nbsp;·&nbsp; calibration gap <b>" + (gap * 100).toFixed(1) + " pts</b></div></div>" +
      "<div class='tile'><div class='tl'>Estimated true risk</div>" +
        "<div class='big " + bt.t + "'>" + pct(pTrue) + "</div>" +
        "<div class='small'>the model is reading <b>" + ppts(predVsTrue) + "</b> vs the truth" +
        (Math.abs(predVsTrue) >= 0.03 ? (predVsTrue < 0 ? " &mdash; false comfort" : " &mdash; over-warning") : "") + "</div></div>";

    var cs = contributions();
    var maxAbs = cs.reduce(function (m, x) { return Math.max(m, Math.abs(x.c)); }, 0.001);
    var waterfall = cs.slice().sort(function (a, b) { return Math.abs(b.c) - Math.abs(a.c); }).map(function (x) {
      var w = Math.abs(x.c) / maxAbs * 46;
      var st = x.c >= 0 ? "left:50%;width:" + w + "%" : "left:" + (50 - w) + "%;width:" + w + "%";
      return "<div class='row'><span>" + esc(x.label) + "</span><span class='track'><span class='mid'></span>" +
        "<i class='" + (x.c < 0 ? "neg" : "") + "' style='" + st + "'></i></span>" +
        "<span class='val'>" + (x.c >= 0 ? "+" : "−") + Math.abs(x.c).toFixed(2) + "</span></div>";
    }).join("");

    var top = cs.filter(function (x) { return x.c > 0.03; }).sort(function (a, b) { return b.c - a.c; }).slice(0, 3);
    var actions = top.length
      ? top.map(function (x) { return "<li><b>" + esc(x.label) + "</b> — " + esc(s.actions[x.key] || "Review this driver.") + "</li>"; }).join("")
      : "<li class='none'>No single indicator is strongly elevated right now. Keep the leading signals under watch.</li>";

    var urNote = Math.abs(predVsTrue) < 0.02
      ? "<div class='note ok'>Reporting is full and the model is current: predicted and estimated-true risk agree.</div>"
      : "<div class='note bad'>The model is fed the <b>reported</b> figures. " +
        (ui.reporting < 0.98 ? "Near-miss reporting is running at " + Math.round(ui.reporting * 100) + "% — the count the model sees is deflated, so the predicted risk sits <b>below</b> the estimated true risk. Retraining on this data just bakes the blind spot in." : "The gap here is drift, not under-reporting — press Retrain.") +
        "</div>";

    el.right.innerHTML =
      "<h2>What is driving the number</h2><div class='contrib'>" + waterfall + "</div>" +
      "<h3>Predicted vs actual, last 26 weeks</h3><div class='series'>" + seriesSVG(S) + "</div>" +
      "<div class='legend'><span><i class='p'></i>predicted (frozen model)</span><span><i class='t'></i>estimated true risk</span><span><i class='o'></i>observed rate (rolling)</span></div>" +
      "<h3>Reporting-culture check</h3><div class='gap'>" +
        "<div class='bar'><span>Predicted</span><span class='track'><i class='pred' style='width:" + Math.round(clamp(pPred / Math.max(pPred, pTrue, 0.2), 0, 1) * 100) + "%'></i></span><span class='v'>" + pct(pPred) + "</span></div>" +
        "<div class='bar'><span>Estimated true</span><span class='track'><i class='true' style='width:" + Math.round(clamp(pTrue / Math.max(pPred, pTrue, 0.2), 0, 1) * 100) + "%'></i></span><span class='v'>" + pct(pTrue) + "</span></div>" +
        urNote +
      "</div>" +
      "<h3>Recommended actions</h3><ul class='actions'>" + actions + "</ul>";

    el.weeksVal.textContent = ui.weeks + " wk";
    el.reportVal.textContent = Math.round(ui.reporting * 100) + "%";
  }

  /* --------------------------------------------------------------- wiring */
  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    var s = scenarios[id];
    ui = { v: {}, weeks: 0, refit: 0, reporting: 1.0, seed: 7 };
    s.indicators.forEach(function (ind) { ui.v[ind.key] = ind.default; });
    if (el.scenario.value !== id) el.scenario.value = id;
    el.target.textContent = "Prediction target: " + s.target;

    el.indicators.innerHTML = s.indicators.map(function (ind) {
      return "<div class='ind' data-k='" + ind.key + "'>" +
        "<div class='ih'><span>" + esc(ind.label) + "</span><span class='iv'></span></div>" +
        "<input type='range' min='" + ind.min + "' max='" + ind.max + "' step='" + ind.step + "'>" +
        "<div class='meta'><span class='mz'></span><span class='tag " + (ind.leading ? "lead" : "lag") + "'>" +
        (ind.leading ? "leading" : "lagging") + (ind.underreportable ? " · under-reportable" : "") + "</span></div></div>";
    }).join("");
    s.indicators.forEach(function (ind) {
      var wrap = el.indicators.querySelector("[data-k='" + ind.key + "']");
      var inp = wrap.querySelector("input");
      inp.value = ui.v[ind.key];
      var upd = function () {
        wrap.querySelector(".iv").textContent = (ind.step < 1) ? (+inp.value).toFixed(1) : inp.value;
        var zz = z(ind, +inp.value);
        wrap.querySelector(".mz").textContent = "z " + (zz >= 0 ? "+" : "−") + Math.abs(zz).toFixed(1) +
          " · " + (zz > 0.5 ? "above typical" : zz < -0.5 ? "below typical" : "about typical");
      };
      inp.addEventListener("input", function () { ui.v[ind.key] = +inp.value; upd(); paint(); });
      upd();
    });

    el.lagging.innerHTML = "<b>" + esc(s.lagging.label) + ":</b> " + esc(s.lagging.value) + " &nbsp;— " + esc(s.lagging.note);

    el.ops.innerHTML =
      "<div class='row'><div class='rh'><span>Weeks since the model was fitted</span><span id='weeksVal'>0 wk</span></div>" +
        "<input type='range' id='weeksInp' min='0' max='52' step='1' value='0'></div>" +
      "<div class='row'><div class='rh'><span>Reporting culture (near-miss capture)</span><span id='reportVal'>100%</span></div>" +
        "<input type='range' id='reportInp' min='" + s.reportingFloor + "' max='1' step='0.02' value='1'></div>" +
      "<div class='btns'><button class='primary' id='retrainBtn' type='button'>Retrain now</button>" +
        "<button class='ghost' id='reseedBtn' type='button'>re-seed outcomes</button></div>";
    el.weeksInp = document.getElementById("weeksInp");
    el.reportInp = document.getElementById("reportInp");
    el.weeksVal = document.getElementById("weeksVal");
    el.reportVal = document.getElementById("reportVal");
    el.weeksInp.addEventListener("input", function () { ui.weeks = +el.weeksInp.value; paint(); });
    el.reportInp.addEventListener("input", function () { ui.reporting = +el.reportInp.value; paint(); });
    document.getElementById("retrainBtn").addEventListener("click", function () { ui.refit = ui.weeks; paint(); });
    document.getElementById("reseedBtn").addEventListener("click", function () { ui.seed = (ui.seed + 1) >>> 0; paint(); });

    el.callouts.innerHTML = [
      ["Leading vs lagging", s.callouts.leadingLagging],
      ["Fitted on this org", s.callouts.perOrg],
      ["Drift is silent", s.callouts.driftSilent],
      ["Under-reporting = false comfort", s.callouts.underreporting],
      ["The evidence base", s.callouts.evidence]
    ].map(function (c) { return "<div class='callout'><b>" + c[0] + ".</b> " + esc(c[1]) + "</div>"; }).join("");

    el.static.innerHTML =
      "<details class='drawer' open><summary>How this works (Day 2 &middot; Topic 3; also Day 3 T1)</summary><div class='dbody'>" +
      "<p><b>The prediction.</b> " + esc(s.notes.what) + "</p>" +
      "<p><b>Model drift.</b> " + esc(s.notes.drift) + "</p>" +
      "<p><b>Under-reporting bias.</b> " + esc(s.notes.underreport) + "</p>" +
      "<p><b>Acting on it.</b> " + esc(s.notes.act) + "</p>" +
      "<p><span class='indep'>Evidence.</span> " + esc(s.callouts.evidence) + "</p>" +
      "<p><b>What is real in this demo.</b> " + esc(s.notes.real) + "</p>" +
      "</div></details>";

    paint();
    try { localStorage.setItem("s7.scenario", id); } catch (e) {}
  }

  function build() {
    el.scenario = document.getElementById("scenario");
    el.theme = document.getElementById("theme");
    el.target = document.getElementById("target");
    el.cockpit = document.getElementById("cockpit");
    el.indicators = document.getElementById("indicators");
    el.lagging = document.getElementById("lagging");
    el.ops = document.getElementById("ops");
    el.right = document.getElementById("right");
    el.callouts = document.getElementById("callouts");
    el.static = document.getElementById("static");

    manifest.forEach(function (m) {
      if (!scenarios[m.id]) return;
      var o = document.createElement("option");
      o.value = m.id; o.textContent = m.label;
      el.scenario.appendChild(o);
    });
    el.scenario.addEventListener("change", function () { loadScenario(el.scenario.value); });

    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) {
      if (t === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      el.theme.textContent = "Theme: " + t;
    }
    var cur = "system";
    try { cur = localStorage.getItem("s7.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () {
      cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      applyTheme(cur);
      try { localStorage.setItem("s7.theme", cur); } catch (e) {}
    });

    var start = manifest[0] && manifest[0].id;
    try { var st = localStorage.getItem("s7.scenario"); if (st && scenarios[st]) start = st; } catch (e) {}
    loadScenario(start);
  }

  build();
})();
