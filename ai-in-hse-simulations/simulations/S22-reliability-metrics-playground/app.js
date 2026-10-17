/* ============================================================================
   S22 — AI reliability metrics playground.  Demo logic.

   No model runs. The population size, default prevalence/separation/drift
   rate and the framing labels are PRE-AUTHORED. Everything else is real:
   every case's score is a seeded random draw, every confusion-matrix count,
   every metric, the swept ROC curve and its AUC, and the recalibrated
   threshold are computed live from the sliders.
   ============================================================================ */
(function () {
  "use strict";

  var S22 = window.HSE_S22 || {};
  var scenarios = S22.scenarios || {};
  var manifest = S22.manifest ||
    Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });

  var el = {}, ui = null, curId = null, Z = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function n2(x) { return x == null ? "&ndash;" : x.toFixed(2); }
  function n3(x) { return x == null ? "&ndash;" : x.toFixed(3); }
  function sc() { return scenarios[curId]; }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash2(a, b) { return (Math.imul(a >>> 0, 2654435761) ^ Math.imul(b >>> 0, 40503)) >>> 0; }
  function gauss(rng) {
    var u = Math.max(rng(), 1e-9), v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* --------------------------------------------------------------- model -- */
  function genZ(seed) {
    var n = 1000, rngP = mulberry32(hash2(seed, 1)), rngN = mulberry32(hash2(seed, 2));
    var zp = [], zn = [];
    for (var i = 0; i < n; i++) { zp.push(gauss(rngP)); zn.push(gauss(rngN)); }
    return { pos: zp, neg: zn };
  }
  function population() {
    var d = sc().defaults, n = d.n;
    var nPos = Math.round(n * ui.prevalencePct / 100), nNeg = n - nPos;
    var sep = ui.separation, drift = sc().driftPerWeek * ui.weeks;
    var posScores = Z.pos.slice(0, nPos).map(function (z) { return clamp(0.5 + sep / 2 + z * 0.15, 0, 1); });
    var negScores = Z.neg.slice(0, nNeg).map(function (z) { return clamp(0.5 - sep / 2 + drift + z * 0.15, 0, 1); });
    return { posScores: posScores, negScores: negScores, nPos: nPos, nNeg: nNeg, n: n };
  }
  function confusionAt(pop, thr) {
    var TP = pop.posScores.filter(function (s) { return s >= thr; }).length;
    var FP = pop.negScores.filter(function (s) { return s >= thr; }).length;
    return { TP: TP, FP: FP, FN: pop.nPos - TP, TN: pop.nNeg - FP };
  }
  function metricsOf(cm, n) {
    var acc = (cm.TP + cm.TN) / n;
    var prec = (cm.TP + cm.FP) ? cm.TP / (cm.TP + cm.FP) : null;
    var rec = (cm.TP + cm.FN) ? cm.TP / (cm.TP + cm.FN) : null;
    var spec = (cm.TN + cm.FP) ? cm.TN / (cm.TN + cm.FP) : null;
    var far = (cm.FP + cm.TN) ? cm.FP / (cm.FP + cm.TN) : null;
    var f1 = (prec != null && rec != null && (prec + rec) > 0) ? 2 * prec * rec / (prec + rec) : null;
    return { acc: acc, prec: prec, rec: rec, spec: spec, far: far, f1: f1 };
  }
  function rocSweep(pop) {
    var pts = [];
    for (var t = 0; t <= 1.0001; t += 0.02) {
      var tt = Math.min(t, 1), cm = confusionAt(pop, tt);
      pts.push({ t: tt, fpr: pop.nNeg ? cm.FP / pop.nNeg : 0, tpr: pop.nPos ? cm.TP / pop.nPos : 0 });
    }
    return pts;
  }
  function aucOf(pts) {
    var s = pts.slice().sort(function (a, b) { return a.fpr - b.fpr; });
    var area = 0;
    for (var i = 1; i < s.length; i++) area += (s[i].fpr - s[i - 1].fpr) * (s[i].tpr + s[i - 1].tpr) / 2;
    return area;
  }
  function bestThreshold(pts) {
    var best = pts[0], bestJ = -1;
    pts.forEach(function (p) { var j = p.tpr - p.fpr; if (j > bestJ) { bestJ = j; best = p; } });
    return best.t;
  }
  function histBins(scores, bins) {
    var c = new Array(bins).fill(0);
    scores.forEach(function (s) { c[Math.min(bins - 1, Math.floor(s * bins))]++; });
    return c;
  }

  /* --------------------------------------------------------------- render -- */
  function histSVG(pop) {
    var bins = 24, W = 480, H = 150, base = 130;
    var negC = histBins(pop.negScores, bins), posC = histBins(pop.posScores, bins);
    var maxC = Math.max(1, negC.reduce(function (a, b) { return Math.max(a, b); }, 0), posC.reduce(function (a, b) { return Math.max(a, b); }, 0));
    var bw = W / bins;
    var bars = "";
    for (var i = 0; i < bins; i++) {
      var hN = negC[i] / maxC * base, hP = posC[i] / maxC * base;
      bars += "<rect class='neg' x='" + (i * bw + 1).toFixed(1) + "' y='" + (base - hN).toFixed(1) + "' width='" + (bw - 2).toFixed(1) + "' height='" + hN.toFixed(1) + "'/>";
      bars += "<rect class='pos' x='" + (i * bw + 1).toFixed(1) + "' y='" + (base - hP).toFixed(1) + "' width='" + (bw - 2).toFixed(1) + "' height='" + hP.toFixed(1) + "'/>";
    }
    var thrX = ui.threshold * W;
    return "<svg viewBox='0 0 " + W + " " + (H) + "' preserveAspectRatio='xMidYMid meet'>" + bars +
      "<line class='thr' x1='" + thrX.toFixed(1) + "' y1='4' x2='" + thrX.toFixed(1) + "' y2='" + base + "'/>" +
      "<text x='" + Math.min(W - 60, thrX + 4) + "' y='14' font-size='10' fill='var(--ink-soft)'>threshold " + ui.threshold.toFixed(2) + "</text>" +
      "</svg>";
  }
  function matrixHTML(cm) {
    return "<div class='matrix'>" +
      "<div class='hd'></div><div class='hd'>predicted: " + esc(sc().eventNoun) + "</div><div class='hd'>predicted: none</div>" +
      "<div class='hd'>actually positive</div><div class='tp'>TP " + cm.TP + "</div><div class='fn'>FN " + cm.FN + "</div>" +
      "<div class='hd'>actually negative</div><div class='fp'>FP " + cm.FP + "</div><div class='tn'>TN " + cm.TN + "</div>" +
      "</div>";
  }
  function metsHTML(m) {
    return "<div class='mets'>" +
      "<div class='m'>accuracy<b>" + n2(m.acc) + "</b></div>" +
      "<div class='m'>precision<b>" + n2(m.prec) + "</b></div>" +
      "<div class='m'>recall<b>" + n2(m.rec) + "</b></div>" +
      "<div class='m'>specificity<b>" + n2(m.spec) + "</b></div>" +
      "<div class='m'>false-alarm rate<b>" + n3(m.far) + "</b></div>" +
      "<div class='m'>F1<b>" + n2(m.f1) + "</b></div></div>";
  }
  function baselineHTML(pop, baseAcc) {
    return "<div class='baseline'>If you never flagged anything — " + esc(sc().alwaysNegativeNote) + " — accuracy would read " +
      "<b>" + (baseAcc * 100).toFixed(1) + "%</b> with <b>0.00</b> recall. That is the accuracy paradox: a rare event " +
      "(" + pop.nPos + " of " + pop.n + " cases here) lets a useless detector look almost perfect on accuracy alone.</div>";
  }
  function rocSVG(pts, curFpr, curTpr) {
    var W = 200, H = 200, pad = 22;
    var X = function (fpr) { return pad + fpr * (W - pad - 10); };
    var Y = function (tpr) { return (H - pad) - tpr * (H - pad - 10); };
    var path = pts.slice().sort(function (a, b) { return a.fpr - b.fpr; })
      .map(function (p, i) { return (i ? "L" : "M") + X(p.fpr).toFixed(1) + " " + Y(p.tpr).toFixed(1); }).join(" ");
    return "<svg viewBox='0 0 " + W + " " + H + "' preserveAspectRatio='xMidYMid meet'>" +
      "<line class='diag' x1='" + X(0) + "' y1='" + Y(0) + "' x2='" + X(1) + "' y2='" + Y(1) + "'/>" +
      "<path class='curve' d='" + path + "'/>" +
      "<circle class='pt' cx='" + X(curFpr).toFixed(1) + "' cy='" + Y(curTpr).toFixed(1) + "' r='4.5'/>" +
      "<text x='" + pad + "' y='" + (H - 6) + "'>FPR &rarr;</text>" +
      "<text x='2' y='" + (pad - 6) + "'>TPR</text>" +
      "</svg>";
  }

  function render() {
    var pop = population(), cm = confusionAt(pop, ui.threshold), m = metricsOf(cm, pop.n);
    var pts = rocSweep(pop), auc = aucOf(pts);
    var curFpr = pop.nNeg ? cm.FP / pop.nNeg : 0, curTpr = pop.nPos ? cm.TP / pop.nPos : 0;

    el.hist.innerHTML = histSVG(pop);
    el.matrix.innerHTML = matrixHTML(cm);
    el.mets.innerHTML = metsHTML(m);
    el.baseline.innerHTML = baselineHTML(pop, pop.nNeg / pop.n);
    el.roc.innerHTML = rocSVG(pts, curFpr, curTpr);
    el.auc.innerHTML = "AUC &asymp; <b>" + auc.toFixed(3) + "</b>";

    el.prevVal.textContent = ui.prevalencePct + "%";
    el.sepVal.textContent = ui.separation.toFixed(1);
    el.thrVal.textContent = ui.threshold.toFixed(2);
    el.weeksVal.textContent = ui.weeks + " wk";
    Array.prototype.forEach.call(el.presets.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", String(+b.getAttribute("data-pct") === ui.prevalencePct));
    });
  }

  /* -------------------------------------------------------------- wiring -- */
  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    var s = scenarios[id], d = s.defaults;
    ui = { prevalencePct: d.prevalencePct, separation: d.separation, threshold: d.threshold, weeks: 0, seed: 7 };
    Z = genZ(ui.seed);
    if (el.scenario.value !== id) el.scenario.value = id;

    el.context.innerHTML = "<b>" + esc(s.posLabel) + "</b> vs <b>" + esc(s.negLabel) + "</b> &mdash; " + esc(s.context);

    el.presets.innerHTML = s.prevalencePresets.map(function (p) {
      return "<button data-pct='" + p.pct + "' type='button'>" + esc(p.label) + "</button>";
    }).join("");

    el.prevInp.value = ui.prevalencePct;
    el.sepInp.value = ui.separation;
    el.thrInp.value = ui.threshold;
    el.weeksInp.value = ui.weeks;

    el.callouts.innerHTML = [
      ["The vocabulary", s.callouts.vocabulary],
      ["The accuracy paradox", s.callouts.accuracyParadox],
      ["Threshold isn't a fix", s.callouts.tradeCurve],
      ["Drift is invisible", s.callouts.driftInvisible],
      ["One playground, every trust meter", s.callouts.tieback]
    ].map(function (c) { return "<div class='callout'><b>" + c[0] + ".</b> " + esc(c[1]) + "</div>"; }).join("");

    el.static.innerHTML =
      "<details class='drawer' open><summary>How this works (Day 5 &middot; Topic 4)</summary><div class='dbody'>" +
      "<p><b>What a 'case' is.</b> " + esc(s.notes.what) + "</p>" +
      "<p><b>Prevalence.</b> " + esc(s.notes.prevalence) + "</p>" +
      "<p><b>Drift.</b> " + esc(s.notes.drift) + "</p>" +
      "<p><b>What is real in this demo.</b> " + esc(s.notes.real) + "</p>" +
      "</div></details>";

    render();
    try { localStorage.setItem("s22.scenario", id); } catch (e) {}
  }

  function build() {
    el.scenario = document.getElementById("scenario");
    el.theme = document.getElementById("theme");
    el.context = document.getElementById("context");
    el.presets = document.getElementById("presets");
    el.prevInp = document.getElementById("prevInp"); el.prevVal = document.getElementById("prevVal");
    el.sepInp = document.getElementById("sepInp"); el.sepVal = document.getElementById("sepVal");
    el.thrInp = document.getElementById("thrInp"); el.thrVal = document.getElementById("thrVal");
    el.weeksInp = document.getElementById("weeksInp"); el.weeksVal = document.getElementById("weeksVal");
    el.matrix = document.getElementById("matrix");
    el.mets = document.getElementById("mets");
    el.baseline = document.getElementById("baseline");
    el.hist = document.getElementById("hist");
    el.roc = document.getElementById("roc");
    el.auc = document.getElementById("auc");
    el.callouts = document.getElementById("callouts");
    el.static = document.getElementById("static");

    manifest.forEach(function (m) {
      if (!scenarios[m.id]) return;
      var o = document.createElement("option");
      o.value = m.id; o.textContent = m.label;
      el.scenario.appendChild(o);
    });
    el.scenario.addEventListener("change", function () { loadScenario(el.scenario.value); });

    el.presets.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-pct]");
      if (!b) return;
      ui.prevalencePct = +b.getAttribute("data-pct");
      el.prevInp.value = ui.prevalencePct;
      render();
    });
    el.prevInp.addEventListener("input", function () { ui.prevalencePct = +el.prevInp.value; render(); });
    el.sepInp.addEventListener("input", function () { ui.separation = +el.sepInp.value; render(); });
    el.thrInp.addEventListener("input", function () { ui.threshold = +el.thrInp.value; render(); });
    el.weeksInp.addEventListener("input", function () { ui.weeks = +el.weeksInp.value; render(); });

    document.getElementById("recalBtn").addEventListener("click", function () {
      var pop = population(), pts = rocSweep(pop);
      ui.threshold = bestThreshold(pts);
      el.thrInp.value = ui.threshold;
      render();
    });
    document.getElementById("resetBtn").addEventListener("click", function () {
      var d = sc().defaults;
      ui.prevalencePct = d.prevalencePct; ui.separation = d.separation; ui.threshold = d.threshold; ui.weeks = 0;
      el.prevInp.value = ui.prevalencePct; el.sepInp.value = ui.separation; el.thrInp.value = ui.threshold; el.weeksInp.value = 0;
      render();
    });
    document.getElementById("reseedBtn").addEventListener("click", function () {
      ui.seed = (ui.seed + 1) >>> 0; Z = genZ(ui.seed); render();
    });

    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) {
      if (t === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      el.theme.textContent = "Theme: " + t;
    }
    var cur = "system";
    try { cur = localStorage.getItem("s22.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () {
      cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      applyTheme(cur);
      try { localStorage.setItem("s22.theme", cur); } catch (e) {}
    });

    var start = manifest[0] && manifest[0].id;
    try { var st = localStorage.getItem("s22.scenario"); if (st && scenarios[st]) start = st; } catch (e) {}
    loadScenario(start);
  }

  build();
})();
