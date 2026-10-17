/* ============================================================================
   S12 — Gas-detection anomaly detection + dispersion.  Demo logic.

   No model runs. Channel baselines, noise, ramp rates and which channels the
   leak affects are PRE-AUTHORED. Live and real: the seeded sensor traces, the
   baseline statistics learned from the pre-leak window, the anomaly score
   every minute, both detectors' first-crossing times, and the lead time.
   ============================================================================ */
(function () {
  "use strict";
  var S12 = window.HSE_S12 || {};
  var scenarios = S12.scenarios || {};
  var manifest = S12.manifest || Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });
  var el = {}, ui = null, curId = null;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sc() { return scenarios[curId]; }
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hstr(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function hash2(a, b) { return (Math.imul(a >>> 0, 2654435761) ^ Math.imul(b >>> 0, 40503)) >>> 0; }
  function gauss(rng) { var u = Math.max(rng(), 1e-9), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  function genSeries() {
    var s = sc(), series = {};
    s.channels.forEach(function (ch) {
      var rng = mulberry32(hash2(ui.seed, hstr(ch.key)));
      var arr = [];
      for (var t = 0; t < s.minutes; t++) {
        var ramp = t > ui.leakStart ? (t - ui.leakStart) * ch.rampPerMin * ui.leakRate : 0;
        arr.push(ch.baseline + gauss(rng) * ch.noiseSd + ramp);
      }
      series[ch.key] = arr;
    });
    return series;
  }
  function baselineStats(series) {
    var s = sc(), stats = {};
    s.channels.forEach(function (ch) {
      var vals = series[ch.key].slice(0, s.baselineWindow);
      var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      var variance = vals.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / vals.length;
      stats[ch.key] = { mean: mean, sd: Math.sqrt(variance) || 0.01 };
    });
    return stats;
  }
  function anomalyScores(series, stats) {
    var s = sc(), scores = [];
    for (var t = 0; t < s.minutes; t++) {
      var ss = 0;
      s.channels.forEach(function (ch) { var z = (series[ch.key][t] - stats[ch.key].mean) / stats[ch.key].sd; ss += z * z; });
      scores.push(Math.sqrt(ss / s.channels.length));
    }
    return scores;
  }
  function firstSetpointCrossing(series) {
    var s = sc(), key = s.channels[0].key;
    for (var t = 0; t < s.minutes; t++) if (series[key][t] >= ui.setpoint) return t;
    return null;
  }
  function firstAnomalyCrossing(scores) {
    var s = sc();
    for (var t = s.baselineWindow + 1; t < scores.length; t++) if (scores[t] >= ui.sensitivity && scores[t - 1] >= ui.sensitivity) return t;
    return null;
  }

  function chartSVG(series, tSet, tAnom) {
    var s = sc(), W = 560, H = 210, padL = 8, padB = 16, plotH = H - padB - 10;
    var mm = {};
    s.channels.forEach(function (ch, i) {
      var arr = series[ch.key], lo = Math.min.apply(null, arr), hi = Math.max.apply(null, arr);
      mm[ch.key] = { lo: lo, hi: hi === lo ? lo + 1 : hi };
    });
    var X = function (t) { return padL + t / (s.minutes - 1) * (W - padL - 4); };
    var Y = function (v, key) { var m = mm[key]; return 10 + (1 - (v - m.lo) / (m.hi - m.lo)) * plotH; };
    var paths = s.channels.map(function (ch, i) {
      var d = series[ch.key].map(function (v, t) { return (t ? "L" : "M") + X(t).toFixed(1) + " " + Y(v, ch.key).toFixed(1); }).join(" ");
      return "<path class='l" + i + "' fill='none' stroke-width='1.6' d='" + d + "'/>";
    }).join("");
    var markers = "";
    if (tSet != null) markers += "<line class='setp' x1='" + X(tSet).toFixed(1) + "' y1='6' x2='" + X(tSet).toFixed(1) + "' y2='" + (H - padB) + "'/>";
    if (tAnom != null) markers += "<line class='anom' x1='" + X(tAnom).toFixed(1) + "' y1='6' x2='" + X(tAnom).toFixed(1) + "' y2='" + (H - padB) + "'/>";
    return "<svg viewBox='0 0 " + W + " " + H + "' preserveAspectRatio='xMidYMid meet'>" + paths + markers +
      "<text x='6' y='" + (H - 4) + "' font-size='9' fill='var(--ink-soft)'>0 min</text>" +
      "<text x='" + (W - 60) + "' y='" + (H - 4) + "' font-size='9' fill='var(--ink-soft)'>" + s.minutes + " min</text></svg>";
  }
  function plumeSVG() {
    var s = sc(), cx = 90, cy = 90, r = 78;
    var ang = (ui.windDir - 90) * Math.PI / 180;
    var len = 20 + Math.min(60, 6 * ui.leakRate * 10 / Math.max(1, ui.windSpeed));
    var spread = Math.max(6, 24 - ui.windSpeed * 2);
    var tx = cx + Math.cos(ang) * len, ty = cy + Math.sin(ang) * len;
    var perpX = Math.cos(ang + Math.PI / 2) * spread, perpY = Math.sin(ang + Math.PI / 2) * spread;
    var plume = "<polygon points='" + cx + "," + cy + " " + (tx + perpX) + "," + (ty + perpY) + " " + (tx - perpX) + "," + (ty - perpY) + "' fill='var(--amber)' opacity='.35'/>";
    var arrowX = cx + Math.cos(ang) * (r - 8), arrowY = cy + Math.sin(ang) * (r - 8);
    return "<svg viewBox='0 0 180 180'>" +
      "<circle cx='" + cx + "' cy='" + cy + "' r='" + r + "' fill='none' stroke='var(--line-strong)'/>" +
      plume +
      "<circle cx='" + cx + "' cy='" + cy + "' r='4' fill='var(--red)'/>" +
      "<line x1='" + cx + "' y1='" + cy + "' x2='" + arrowX.toFixed(1) + "' y2='" + arrowY.toFixed(1) + "' stroke='var(--blue)' stroke-width='2'/>" +
      "<text x='6' y='14' font-size='9' fill='var(--ink-soft)'>wind &rarr; (illustrative sketch, not a dispersion model)</text>" +
      "</svg>";
  }

  function render() {
    var s = sc(), series = genSeries(), stats = baselineStats(series), scores = anomalyScores(series, stats);
    var tSet = firstSetpointCrossing(series), tAnom = firstAnomalyCrossing(scores);
    var lead = (tSet != null && tAnom != null) ? tSet - tAnom : null;

    el.tiles.innerHTML =
      "<div class='tile'><div class='tl'>Fixed setpoint alarm fires</div><div class='big " + (tSet == null ? "ok" : "bad") + "'>" +
      (tSet == null ? "never" : tSet + " min") + "</div><div class='small'>" + s.channels[0].label + " &ge; " + ui.setpoint + "</div></div>" +
      "<div class='tile'><div class='tl'>Anomaly detector fires</div><div class='big " + (tAnom == null ? "ok" : "warn") + "'>" +
      (tAnom == null ? "never" : tAnom + " min") + "</div><div class='small'>RMS z-score &ge; " + ui.sensitivity.toFixed(1) + " for 2 min</div></div>" +
      "<div class='tile'><div class='tl'>Early-warning lead time</div><div class='big " + (lead == null ? "" : lead > 0 ? "ok" : "bad") + "'>" +
      (lead == null ? "&ndash;" : (lead > 0 ? lead + " min earlier" : (-lead) + " min later")) + "</div>" +
      "<div class='small'>" + (lead == null ? "one or both detectors never fired at these settings" : (lead > 0 ? "time to investigate before the hard alarm" : "the anomaly detector was NOT earlier here")) + "</div></div>";

    el.chart.innerHTML = chartSVG(series, tSet, tAnom);
    el.legend.innerHTML = s.channels.map(function (ch, i) { return "<span><i class='l" + i + "' style='border-color:var(--" + ["red", "blue", "ink-soft"][i] + ")'></i>" + esc(ch.label) + "</span>"; }).join("") +
      "<span><i style='border-color:var(--red);border-top-style:dashed'></i>setpoint fires</span>" +
      "<span><i style='border-color:var(--amber);border-top-style:dashed'></i>anomaly fires</span>";
    el.plume.innerHTML = plumeSVG();

    el.leakStartVal.textContent = ui.leakStart + " min";
    el.leakRateVal.textContent = ui.leakRate.toFixed(1) + "×";
    el.sensVal.textContent = ui.sensitivity.toFixed(1);
    el.setpointVal.textContent = ui.setpoint;
    el.windSpeedVal.textContent = ui.windSpeed + " m/s";
    el.windDirVal.textContent = ui.windDir + "°";
  }

  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    var s = scenarios[id];
    ui = { leakStart: s.leakStart.default, leakRate: s.leakRate.default, sensitivity: s.sensitivity.default,
           setpoint: s.setpoint.default, windSpeed: s.wind.speedDefault, windDir: s.wind.dirDefault, seed: 7 };
    if (el.scenario.value !== id) el.scenario.value = id;
    el.context.textContent = s.context;

    el.leakStartInp.min = s.leakStart.min; el.leakStartInp.max = s.leakStart.max; el.leakStartInp.step = s.leakStart.step; el.leakStartInp.value = ui.leakStart;
    el.leakRateInp.min = s.leakRate.min; el.leakRateInp.max = s.leakRate.max; el.leakRateInp.step = s.leakRate.step; el.leakRateInp.value = ui.leakRate;
    el.sensInp.min = s.sensitivity.min; el.sensInp.max = s.sensitivity.max; el.sensInp.step = s.sensitivity.step; el.sensInp.value = ui.sensitivity;
    el.setpointInp.min = s.setpoint.min; el.setpointInp.max = s.setpoint.max; el.setpointInp.step = s.setpoint.step; el.setpointInp.value = ui.setpoint;
    el.windSpeedInp.value = ui.windSpeed; el.windDirInp.value = ui.windDir;

    el.callouts.innerHTML = [
      ["Early warning", s.callouts.earlyWarning], ["The decoy channel", s.callouts.decoyChannel],
      ["Needs a good baseline", s.callouts.needsGoodBaseline], ["Not a dispersion model", s.callouts.notPhysics],
      ["Still needs the hardware alarm", s.callouts.stillHardware]
    ].map(function (c) { return "<div class='callout'><b>" + c[0] + ".</b> " + esc(c[1]) + "</div>"; }).join("");

    el.static.innerHTML = "<details class='drawer' open><summary>How this works (Day 3 &middot; Topic 3; also Day 1 T2b, Day 2 T5)</summary><div class='dbody'>" +
      "<p><b>What it is.</b> " + esc(s.notes.what) + "</p><p><b>The maths.</b> " + esc(s.notes.math) + "</p>" +
      "<p><b>What is real in this demo.</b> " + esc(s.notes.real) + "</p></div></details>";

    render();
    try { localStorage.setItem("s12.scenario", id); } catch (e) {}
  }

  function build() {
    ["scenario", "theme", "context", "tiles", "chart", "legend", "plume", "callouts", "static",
     "leakStartInp", "leakStartVal", "leakRateInp", "leakRateVal", "sensInp", "sensVal",
     "setpointInp", "setpointVal", "windSpeedInp", "windSpeedVal", "windDirInp", "windDirVal"].forEach(function (id) {
      el[id] = document.getElementById(id);
    });

    manifest.forEach(function (m) { if (!scenarios[m.id]) return; var o = document.createElement("option"); o.value = m.id; o.textContent = m.label; el.scenario.appendChild(o); });
    el.scenario.addEventListener("change", function () { loadScenario(el.scenario.value); });

    el.leakStartInp.addEventListener("input", function () { ui.leakStart = +el.leakStartInp.value; render(); });
    el.leakRateInp.addEventListener("input", function () { ui.leakRate = +el.leakRateInp.value; render(); });
    el.sensInp.addEventListener("input", function () { ui.sensitivity = +el.sensInp.value; render(); });
    el.setpointInp.addEventListener("input", function () { ui.setpoint = +el.setpointInp.value; render(); });
    el.windSpeedInp.addEventListener("input", function () { ui.windSpeed = +el.windSpeedInp.value; render(); });
    el.windDirInp.addEventListener("input", function () { ui.windDir = +el.windDirInp.value; render(); });
    document.getElementById("reseedBtn").addEventListener("click", function () { ui.seed = (ui.seed + 1) >>> 0; render(); });

    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) { if (t === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t); el.theme.textContent = "Theme: " + t; }
    var cur = "system"; try { cur = localStorage.getItem("s12.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () { cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]; applyTheme(cur); try { localStorage.setItem("s12.theme", cur); } catch (e) {} });

    var start = manifest[0] && manifest[0].id;
    try { var st = localStorage.getItem("s12.scenario"); if (st && scenarios[st]) start = st; } catch (e) {}
    loadScenario(start);
  }
  build();
})();
