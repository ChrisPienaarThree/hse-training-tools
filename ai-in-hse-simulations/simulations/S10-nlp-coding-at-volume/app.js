/* ============================================================================
   S10 — NLP coding at volume.  Demo logic.

   No model runs. Each narrative's true code, a plausible wrong alternative,
   and field difficulty are PRE-AUTHORED. Live and real: the accuracy-vs-
   training-size curve, a seeded correct/wrong draw per field per narrative,
   the confidence shown, the Pareto aggregation, and your review-queue
   clearances.
   ============================================================================ */
(function () {
  "use strict";
  var S10 = window.HSE_S10 || {};
  var scenarios = S10.scenarios || {};
  var manifest = S10.manifest || Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });
  var ACC_BASE = 0.50, ACC_CAP = 0.97, ACC_DECAY = 120;
  var el = {}, ui = null, curId = null;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function sc() { return scenarios[curId]; }
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hstr(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function hash2(a, b) { return (Math.imul(a >>> 0, 2654435761) ^ Math.imul(b >>> 0, 40503)) >>> 0; }

  function accFactor(trainSize) { return ACC_BASE + (ACC_CAP - ACC_BASE) * (1 - Math.exp(-trainSize / ACC_DECAY)); }
  function correctProb(n, field) {
    var s = sc(), p = accFactor(ui.trainSize) * s.fieldDifficulty[field] * (n.quality === "poor" ? 0.82 : 1);
    return clamp(p, 0.05, 0.98);
  }
  function drawnCorrect(n, field) {
    var rng = mulberry32(hash2(ui.seed, hstr(n.id + "|" + field)));
    return rng() < correctProb(n, field);
  }
  function reviewKey(n, field) { return n.id + "|" + field; }
  function effectiveValue(n, field) {
    if (ui.reviewed[reviewKey(n, field)]) return n.trueCodes[field];
    return drawnCorrect(n, field) ? n.trueCodes[field] : n.altCodes[field];
  }

  function vocabOf(field) {
    var s = sc(), seen = {}, out = [];
    s.narratives.forEach(function (n) { if (!seen[n.trueCodes[field]]) { seen[n.trueCodes[field]] = true; out.push(n.trueCodes[field]); } });
    return out;
  }
  function paretoSVG() {
    var s = sc(), field = "eventType", vocab = vocabOf(field);
    var W = 480, H = 190, base = 160, bw = W / vocab.length;
    var maxC = Math.max(1, s.narratives.length);
    var bars = "";
    vocab.forEach(function (v, i) {
      var trueC = s.narratives.filter(function (n) { return n.trueCodes[field] === v; }).length;
      var dispC = s.narratives.filter(function (n) { return effectiveValue(n, field) === v; }).length;
      var hT = trueC / maxC * base, hD = dispC / maxC * base;
      var x0 = i * bw + 6;
      bars += "<rect class='true' x='" + x0 + "' y='" + (base - hT) + "' width='" + (bw / 2 - 8) + "' height='" + hT + "'/>";
      bars += "<rect class='disp' x='" + (x0 + bw / 2 - 2) + "' y='" + (base - hD) + "' width='" + (bw / 2 - 8) + "' height='" + hD + "'/>";
      bars += "<text x='" + (x0 + bw / 2 - 6) + "' y='" + (base + 14) + "' font-size='8.5' fill='var(--ink-soft)' text-anchor='middle'>" +
        esc(v.length > 16 ? v.slice(0, 15) + "…" : v) + "</text>";
    });
    return "<svg viewBox='0 0 " + W + " " + H + "' preserveAspectRatio='xMidYMid meet'>" + bars + "</svg>";
  }

  function fieldRowHTML(n, field) {
    var s = sc(), label = s.fieldLabels[field], conf = correctProb(n, field);
    var key = reviewKey(n, field), reviewed = ui.reviewed[key];
    var val = effectiveValue(n, field);
    var wrong = !reviewed && val !== n.trueCodes[field];
    var low = !reviewed && conf < s.reviewThreshold;
    var btn = low ? "<button class='review' type='button' data-n='" + n.id + "' data-f='" + field + "' aria-pressed='false'>Mark reviewed</button>"
      : (reviewed ? "<span style='color:var(--green);font-size:.76rem'>&#10003; corrected</span>" : "");
    return "<div class='fieldrow'><span class='fl'>" + esc(label) + "</span>" +
      "<span class='fv" + (wrong ? " wrong" : "") + "'>" + esc(val) + "</span>" +
      "<span class='conf" + (low ? " low" : "") + "'>" + conf.toFixed(2) + "</span></div>" +
      (btn ? "<div style='text-align:right'>" + btn + "</div>" : "");
  }
  function narrativeHTML(n) {
    var s = sc();
    return "<div class='narr'><div class='nh'><b>" + esc(n.id) + "</b><span class='qtag " + n.quality + "'>" + n.quality + "</span></div>" +
      "<div class='txt'>" + esc(n.text) + "</div>" +
      s.fields.map(function (f) { return fieldRowHTML(n, f); }).join("") + "</div>";
  }

  function render() {
    var s = sc();
    el.narratives.innerHTML = s.narratives.map(narrativeHTML).join("");
    el.pareto.innerHTML = paretoSVG();

    var total = 0, belowThreshold = 0, cleared = 0;
    s.narratives.forEach(function (n) {
      s.fields.forEach(function (f) {
        total++;
        var conf = correctProb(n, f), key = reviewKey(n, f);
        if (conf < s.reviewThreshold) { belowThreshold++; if (ui.reviewed[key]) cleared++; }
      });
    });
    el.tally.innerHTML =
      "<div class='t'>Fields coded <b>" + total + "</b></div>" +
      "<div class='t'>Below review threshold <b>" + belowThreshold + "</b></div>" +
      "<div class='t'>Cleared by a human <b>" + cleared + " / " + belowThreshold + "</b></div>" +
      "<div class='t'>Overall model accuracy at this training size <b>" + (accFactor(ui.trainSize) * 100).toFixed(0) + "%</b></div>";

    el.trainVal.textContent = ui.trainSize;
  }

  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    var s = scenarios[id];
    ui = { trainSize: s.trainSize.default, seed: 7, reviewed: {} };
    if (el.scenario.value !== id) el.scenario.value = id;
    el.trainInp.min = s.trainSize.min; el.trainInp.max = s.trainSize.max; el.trainInp.value = ui.trainSize;

    el.callouts.innerHTML = [
      ["Speed and volume", s.callouts.volume],
      ["Training size moves accuracy", s.callouts.trainingSize],
      ["Wrong codes distort the aggregate", s.callouts.distortion],
      ["Text quality is a fairness issue", s.callouts.textQuality],
      ["The review queue", s.callouts.reviewQueue]
    ].map(function (c) { return "<div class='callout'><b>" + c[0] + ".</b> " + esc(c[1]) + "</div>"; }).join("");

    el.static.innerHTML =
      "<details class='drawer' open><summary>How this works (Day 3 &middot; Topic 1; also Day 1 T2)</summary><div class='dbody'>" +
      "<p><b>What it is.</b> " + esc(s.notes.what) + "</p>" +
      "<p><b>The maths.</b> " + esc(s.notes.math) + "</p>" +
      "<p><b>What is real in this demo.</b> " + esc(s.notes.real) + "</p></div></details>";

    render();
    try { localStorage.setItem("s10.scenario", id); } catch (e) {}
  }

  function build() {
    el.scenario = document.getElementById("scenario"); el.theme = document.getElementById("theme");
    el.trainInp = document.getElementById("trainInp"); el.trainVal = document.getElementById("trainVal");
    el.narratives = document.getElementById("narratives"); el.pareto = document.getElementById("pareto");
    el.tally = document.getElementById("tally"); el.callouts = document.getElementById("callouts"); el.static = document.getElementById("static");

    manifest.forEach(function (m) {
      if (!scenarios[m.id]) return;
      var o = document.createElement("option"); o.value = m.id; o.textContent = m.label; el.scenario.appendChild(o);
    });
    el.scenario.addEventListener("change", function () { loadScenario(el.scenario.value); });
    el.trainInp.addEventListener("input", function () { ui.trainSize = +el.trainInp.value; render(); });
    document.getElementById("reseedBtn").addEventListener("click", function () { ui.seed = (ui.seed + 1) >>> 0; render(); });
    document.getElementById("resetReviewBtn").addEventListener("click", function () { ui.reviewed = {}; render(); });

    el.narratives.addEventListener("click", function (e) {
      var b = e.target.closest("button.review");
      if (!b) return;
      ui.reviewed[reviewKey({ id: b.getAttribute("data-n") }, b.getAttribute("data-f"))] = true;
      render();
    });

    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) { if (t === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t); el.theme.textContent = "Theme: " + t; }
    var cur = "system"; try { cur = localStorage.getItem("s10.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () { cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]; applyTheme(cur); try { localStorage.setItem("s10.theme", cur); } catch (e) {} });

    var start = manifest[0] && manifest[0].id;
    try { var st = localStorage.getItem("s10.scenario"); if (st && scenarios[st]) start = st; } catch (e) {}
    loadScenario(start);
  }
  build();
})();
