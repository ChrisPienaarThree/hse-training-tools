/* ============================================================================
   S13 — Heat-stress & fatigue wearable simulation.  Demo logic.

   No model runs. Slider ranges, the heat-model coefficient, both temperature
   thresholds and the medication-bias size are PRE-AUTHORED. Live and real:
   the core-temperature curve, both crossing times, the lead time, the
   fatigue score curve, and the risk band.
   ============================================================================ */
(function () {
  "use strict";
  var S13 = window.HSE_S13 || {};
  var scenarios = S13.scenarios || {};
  var manifest = S13.manifest || Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });
  var el = {}, ui = null, curId = null;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function sc() { return scenarios[curId]; }

  function coreTemp() {
    var s = sc(), h = s.heat;
    var heatLoad = ui.workload * h.heatCoef * (1 + 0.02 * (ui.ambientTemp - 25)) * (1 + 0.01 * (ui.humidity - 40));
    var trueArr = [], wearArr = [];
    for (var t = 0; t <= s.shiftMinutes; t += 5) {
      var trueT = 37.0 + heatLoad * (1 - Math.exp(-t / h.decayMin));
      var wearT = trueT - (ui.medication ? h.medicationBiasC : 0);
      trueArr.push({ t: t, v: trueT }); wearArr.push({ t: t, v: wearT });
    }
    return { trueArr: trueArr, wearArr: wearArr };
  }
  function firstCrossing(arr, threshold) { for (var i = 0; i < arr.length; i++) if (arr[i].v >= threshold) return arr[i].t; return null; }

  function fatigueSeries() {
    var s = sc();
    var arr = [];
    for (var t = 0; t <= s.shiftMinutes; t += 5) {
      var hourOfDay = (ui.shiftStartHour + t / 60) % 24;
      var circ = 0.5 + 0.5 * Math.cos(2 * Math.PI * (hourOfDay - 4) / 24);
      var awake = clamp((ui.hoursAwake + t / 60 - 8) / 16, 0, 1);
      var consec = Math.min(1, ui.consecutiveNights * 0.12);
      arr.push({ t: t, v: clamp(0.01 + 0.06 * circ + 0.12 * awake + 0.06 * consec, 0, 0.5) });
    }
    return arr;
  }
  function fatigueBand(score) {
    return score < 0.08 ? { name: "Low", tone: "ok" } : score < 0.15 ? { name: "Moderate", tone: "warn" } :
      score < 0.25 ? { name: "High", tone: "bad" } : { name: "Severe", tone: "bad" };
  }

  function lineSVG(series, opts) {
    var W = 480, H = 170, padB = 16;
    var vals = series.reduce(function (acc, s) { return acc.concat(s.arr.map(function (p) { return p.v; })); }, []);
    var lo = Math.min.apply(null, vals.concat(opts.extra || [])), hi = Math.max.apply(null, vals.concat(opts.extra || []));
    if (hi === lo) hi = lo + 1;
    var maxT = opts.maxT;
    var X = function (t) { return 6 + t / maxT * (W - 12); };
    var Y = function (v) { return 8 + (1 - (v - lo) / (hi - lo)) * (H - padB - 12); };
    var paths = series.map(function (s) {
      var d = s.arr.map(function (p, i) { return (i ? "L" : "M") + X(p.t).toFixed(1) + " " + Y(p.v).toFixed(1); }).join(" ");
      return "<path d='" + d + "' fill='none' stroke='" + s.color + "' stroke-width='2' " + (s.dashed ? "stroke-dasharray='4 3'" : "") + "/>";
    }).join("");
    var lines = (opts.hlines || []).map(function (h) {
      return "<line x1='6' y1='" + Y(h.v).toFixed(1) + "' x2='" + (W - 6) + "' y2='" + Y(h.v).toFixed(1) + "' stroke='" + h.color + "' stroke-dasharray='2 2' stroke-width='1.2'/>" +
        "<text x='" + (W - 60) + "' y='" + (Y(h.v) - 3).toFixed(1) + "' font-size='9' fill='" + h.color + "'>" + esc(h.label) + "</text>";
    }).join("");
    return "<svg viewBox='0 0 " + W + " " + H + "' preserveAspectRatio='xMidYMid meet'>" + lines + paths +
      "<text x='6' y='" + (H - 3) + "' font-size='9' fill='var(--ink-soft)'>0 min</text>" +
      "<text x='" + (W - 60) + "' y='" + (H - 3) + "' font-size='9' fill='var(--ink-soft)'>" + maxT + " min</text></svg>";
  }

  function render() {
    var s = sc(), ct = coreTemp(), h = s.heat;
    var tWarn = firstCrossing(ct.wearArr, h.earlyWarningThreshold);
    var tSymp = firstCrossing(ct.trueArr, h.symptomThreshold);
    var lead = (tWarn != null && tSymp != null) ? tSymp - tWarn : null;
    var fArr = fatigueSeries(), fEnd = fArr[fArr.length - 1].v, band = fatigueBand(fEnd);

    el.tiles.innerHTML =
      "<div class='tile'><div class='tl'>Wearable predictive alert</div><div class='big " + (tWarn == null ? "ok" : "warn") + "'>" + (tWarn == null ? "never" : tWarn + " min") + "</div><div class='small'>&ge; " + h.earlyWarningThreshold.toFixed(1) + "°C wearable reading</div></div>" +
      "<div class='tile'><div class='tl'>True symptom onset</div><div class='big " + (tSymp == null ? "ok" : "bad") + "'>" + (tSymp == null ? "never" : tSymp + " min") + "</div><div class='small'>&ge; " + h.symptomThreshold.toFixed(1) + "°C true core temp</div></div>" +
      "<div class='tile'><div class='tl'>Early-warning lead time</div><div class='big " + (lead == null ? "" : lead > 0 ? "ok" : "bad") + "'>" + (lead == null ? "&ndash;" : (lead > 0 ? lead + " min" : "none")) + "</div><div class='small'>" + (ui.medication ? "medication flag ON — reading biased" : "wearable reading unbiased") + "</div></div>" +
      "<div class='tile'><div class='tl'>Fatigue risk (end of shift)</div><div class='big " + band.tone + "'>" + band.name + "</div><div class='small'>error likelihood &asymp; " + (fEnd * 100).toFixed(0) + "%</div></div>";

    el.heatChart.innerHTML = lineSVG([
      { arr: ct.trueArr, color: "var(--red)" }, { arr: ct.wearArr, color: "var(--blue)", dashed: true }
    ], { maxT: s.shiftMinutes, extra: [36.8, h.symptomThreshold + 0.2], hlines: [
      { v: h.earlyWarningThreshold, color: "var(--blue)", label: "wearable alert" },
      { v: h.symptomThreshold, color: "var(--red)", label: "true symptom" }
    ] });
    el.fatigueChart.innerHTML = lineSVG([{ arr: fArr, color: "var(--purple)" }], { maxT: s.shiftMinutes, hlines: [
      { v: 0.08, color: "var(--green)", label: "Low/Mod" }, { v: 0.15, color: "var(--amber)", label: "Mod/High" }, { v: 0.25, color: "var(--red)", label: "High/Severe" }
    ] });

    el.ambientVal.textContent = ui.ambientTemp + "°C"; el.humidityVal.textContent = ui.humidity + "%"; el.workloadVal.textContent = ui.workload;
    el.awakeVal.textContent = ui.hoursAwake + " h"; el.startVal.textContent = ui.shiftStartHour + ":00"; el.nightsVal.textContent = ui.consecutiveNights;
  }

  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    var s = scenarios[id], h = s.heat, f = s.fatigue;
    ui = { ambientTemp: h.ambientTemp.default, humidity: h.humidity.default, workload: h.workload.default, medication: false,
           hoursAwake: f.hoursAwake.default, shiftStartHour: f.shiftStartHour.default, consecutiveNights: f.consecutiveNights.default };
    if (el.scenario.value !== id) el.scenario.value = id;
    el.context.textContent = s.context;

    el.ambientInp.min = h.ambientTemp.min; el.ambientInp.max = h.ambientTemp.max; el.ambientInp.value = ui.ambientTemp;
    el.humidityInp.min = h.humidity.min; el.humidityInp.max = h.humidity.max; el.humidityInp.value = ui.humidity;
    el.workloadInp.min = h.workload.min; el.workloadInp.max = h.workload.max; el.workloadInp.value = ui.workload;
    el.medicationChk.checked = false;
    el.awakeInp.min = f.hoursAwake.min; el.awakeInp.max = f.hoursAwake.max; el.awakeInp.value = ui.hoursAwake;
    el.startInp.min = f.shiftStartHour.min; el.startInp.max = f.shiftStartHour.max; el.startInp.value = ui.shiftStartHour;
    el.nightsInp.min = f.consecutiveNights.min; el.nightsInp.max = f.consecutiveNights.max; el.nightsInp.value = ui.consecutiveNights;

    el.callouts.innerHTML = [
      ["The predictive lead time", s.callouts.predictiveLead], ["A real sensor limitation", s.callouts.hrLimitation],
      ["The fatigue model is illustrative", s.callouts.fatigueModel], ["Interpret population stats with care", s.callouts.interpretWithCare],
      ["Wearables are also surveillance", s.callouts.surveillance]
    ].map(function (c) { return "<div class='callout'><b>" + c[0] + ".</b> " + esc(c[1]) + "</div>"; }).join("");

    el.static.innerHTML = "<details class='drawer' open><summary>How this works (Day 3 &middot; Topic 3)</summary><div class='dbody'>" +
      "<p><b>What it is.</b> " + esc(s.notes.what) + "</p><p><b>Heat maths.</b> " + esc(s.notes.heatMath) + "</p>" +
      "<p><b>Fatigue maths.</b> " + esc(s.notes.fatigueMath) + "</p><p><b>What is real in this demo.</b> " + esc(s.notes.real) + "</p></div></details>";

    render();
    try { localStorage.setItem("s13.scenario", id); } catch (e) {}
  }

  function build() {
    ["scenario", "theme", "context", "tiles", "heatChart", "fatigueChart", "callouts", "static",
     "ambientInp", "ambientVal", "humidityInp", "humidityVal", "workloadInp", "workloadVal", "medicationChk",
     "awakeInp", "awakeVal", "startInp", "startVal", "nightsInp", "nightsVal"].forEach(function (id) { el[id] = document.getElementById(id); });

    manifest.forEach(function (m) { if (!scenarios[m.id]) return; var o = document.createElement("option"); o.value = m.id; o.textContent = m.label; el.scenario.appendChild(o); });
    el.scenario.addEventListener("change", function () { loadScenario(el.scenario.value); });

    el.ambientInp.addEventListener("input", function () { ui.ambientTemp = +el.ambientInp.value; render(); });
    el.humidityInp.addEventListener("input", function () { ui.humidity = +el.humidityInp.value; render(); });
    el.workloadInp.addEventListener("input", function () { ui.workload = +el.workloadInp.value; render(); });
    el.medicationChk.addEventListener("change", function () { ui.medication = el.medicationChk.checked; render(); });
    el.awakeInp.addEventListener("input", function () { ui.hoursAwake = +el.awakeInp.value; render(); });
    el.startInp.addEventListener("input", function () { ui.shiftStartHour = +el.startInp.value; render(); });
    el.nightsInp.addEventListener("input", function () { ui.consecutiveNights = +el.nightsInp.value; render(); });

    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) { if (t === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t); el.theme.textContent = "Theme: " + t; }
    var cur = "system"; try { cur = localStorage.getItem("s13.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () { cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]; applyTheme(cur); try { localStorage.setItem("s13.theme", cur); } catch (e) {} });

    var start = manifest[0] && manifest[0].id;
    try { var st = localStorage.getItem("s13.scenario"); if (st && scenarios[st]) start = st; } catch (e) {}
    loadScenario(start);
  }
  build();
})();
