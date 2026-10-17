/* ============================================================================
   S14 — Behavioural-safety observation analytics.  Demo logic.

   No model runs. The theme/location/shift vocabulary, base weights,
   location-theme bias and the merge pair are PRE-AUTHORED. Live and real:
   the seeded weighted sampling of every observation, every count and chart,
   and the as-recorded-vs-true comparison.
   ============================================================================ */
(function () {
  "use strict";
  var S14 = window.HSE_S14 || {};
  var scenarios = S14.scenarios || {};
  var manifest = S14.manifest || Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });
  var el = {}, ui = null, curId = null;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sc() { return scenarios[curId]; }
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash2(a, b) { return (Math.imul(a >>> 0, 2654435761) ^ Math.imul(b >>> 0, 40503)) >>> 0; }
  function weightedPick(rng, items, weightOf) {
    var total = 0, i; var ws = items.map(function (it) { var w = weightOf(it); total += w; return w; });
    var r = rng() * total, acc = 0;
    for (i = 0; i < items.length; i++) { acc += ws[i]; if (r <= acc) return items[i]; }
    return items[items.length - 1];
  }

  function sample() {
    var s = sc(), rng = mulberry32(hash2(ui.seed, 1));
    var out = [];
    for (var i = 0; i < ui.sampleSize; i++) {
      var loc = weightedPick(rng, s.locations, function (l) { return l.weight; });
      var theme = weightedPick(rng, s.themes, function (t) { return t.weight * ((loc.biasThemes && loc.biasThemes[t.key]) || 1); });
      var shift = weightedPick(rng, s.shifts, function (sh) { return sh.weight; });
      var week = Math.floor(rng() * s.weeks);
      out.push({ loc: loc.key, theme: theme.key, shift: shift.key, week: week });
    }
    return out;
  }
  function countBy(rows, key) { var c = {}; rows.forEach(function (r) { c[r[key]] = (c[r[key]] || 0) + 1; }); return c; }
  function recordedLoc(row) {
    var dq = sc().dataQuality;
    return (ui.mergeOn && row.loc === dq.mergeB) ? dq.mergeA : row.loc;
  }

  function barsSVG(pairs, labelOf, maxVal) {
    var W = 480, H = 30 * pairs.length + 10, bw = W - 140;
    var rows = pairs.map(function (p, i) {
      var y = i * 30 + 8;
      var wA = Math.max(1, p.a / maxVal * bw), wB = Math.max(1, p.b / maxVal * bw);
      return "<text x='0' y='" + (y + 10) + "' font-size='10' fill='var(--ink)'>" + esc(labelOf(p.key)) + "</text>" +
        "<rect class='b' x='130' y='" + y + "' width='" + wB.toFixed(1) + "' height='9'/>" +
        "<text x='" + (130 + wB + 4) + "' y='" + (y + 9) + "' font-size='9' fill='var(--amber)'>" + p.b + "</text>" +
        "<rect class='a' x='130' y='" + (y + 11) + "' width='" + wA.toFixed(1) + "' height='9'/>" +
        "<text x='" + (130 + wA + 4) + "' y='" + (y + 20) + "' font-size='9' fill='var(--blue)'>" + p.a + "</text>";
    }).join("");
    return "<svg viewBox='0 0 " + W + " " + H + "' preserveAspectRatio='xMidYMid meet'>" + rows + "</svg>";
  }
  function themeBarsSVG(counts, themes) {
    var maxV = Math.max(1, Math.max.apply(null, themes.map(function (t) { return counts[t.key] || 0; })));
    var pairs = themes.map(function (t) { return { key: t.key, a: counts[t.key] || 0, b: counts[t.key] || 0 }; });
    return barsSVG(pairs, function (k) { var t = themes.filter(function (x) { return x.key === k; })[0]; return t.label; }, maxV);
  }

  function render() {
    var s = sc(), rows = sample();
    var themeCounts = countBy(rows, "theme");
    var trueLocCounts = countBy(rows, "loc");
    var recCounts = {}; rows.forEach(function (r) { var k = recordedLoc(r); recCounts[k] = (recCounts[k] || 0) + 1; });

    var maxLoc = Math.max(1, s.locations.reduce(function (m, l) { return Math.max(m, trueLocCounts[l.key] || 0, recCounts[l.key] || 0); }, 0));
    var locPairs = s.locations.map(function (l) { return { key: l.key, a: trueLocCounts[l.key] || 0, b: recCounts[l.key] || 0 }; })
      .filter(function (p) { return !(ui.mergeOn && p.key === s.dataQuality.mergeB && p.b === 0); });
    el.locBars.innerHTML = barsSVG(locPairs, function (k) { var l = s.locations.filter(function (x) { return x.key === k; })[0]; return l.label; }, maxLoc);
    el.themeBars.innerHTML = themeBarsSVG(themeCounts, s.themes);

    var topRec = s.locations.reduce(function (best, l) { var c = recCounts[l.key] || 0; return c > best.c ? { key: l.key, c: c, label: l.label } : best; }, { c: -1 });
    var topTrue = s.locations.reduce(function (best, l) { var c = trueLocCounts[l.key] || 0; return c > best.c ? { key: l.key, c: c, label: l.label } : best; }, { c: -1 });
    el.topline.innerHTML = "Top location <b>as recorded</b>: " + esc(topRec.label) + " (" + topRec.c + ") &nbsp;&middot;&nbsp; top location <b style='color:var(--blue)'>true split</b>: " + esc(topTrue.label) + " (" + topTrue.c + ")" +
      (topRec.key !== topTrue.key ? " &mdash; <span style='color:var(--red);font-weight:700'>they disagree</span>" : "");

    var weekCounts = countBy(rows, "week"); var maxW = 1;
    var weekBars = "";
    for (var w = 0; w < s.weeks; w++) { var c = weekCounts[w] || 0; maxW = Math.max(maxW, c); }
    for (w = 0; w < s.weeks; w++) {
      var c2 = weekCounts[w] || 0, h = c2 / maxW * 40;
      weekBars += "<rect x='" + (w * 22 + 4) + "' y='" + (48 - h) + "' width='16' height='" + h + "' fill='var(--purple)'/>";
    }
    el.trend.innerHTML = "<svg viewBox='0 0 " + (s.weeks * 22 + 6) + " 56' preserveAspectRatio='xMidYMid meet'>" + weekBars +
      "<text x='2' y='54' font-size='8' fill='var(--ink-soft)'>wk1</text><text x='" + (s.weeks * 22 - 16) + "' y='54' font-size='8' fill='var(--ink-soft)'>wk" + s.weeks + "</text></svg>";

    el.sampleVal.textContent = ui.sampleSize;
  }

  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    var s = scenarios[id];
    ui = { sampleSize: s.sampleSize.default, seed: 7, mergeOn: false };
    if (el.scenario.value !== id) el.scenario.value = id;
    el.context.textContent = s.context;
    el.sampleInp.min = s.sampleSize.min; el.sampleInp.max = s.sampleSize.max; el.sampleInp.value = ui.sampleSize;
    el.mergeChk.checked = false;
    el.mergeLabel.textContent = "Merge " + s.locations.filter(function (l) { return l.key === s.dataQuality.mergeA; })[0].label +
      " & " + s.locations.filter(function (l) { return l.key === s.dataQuality.mergeB; })[0].label + " (poor form-filling)";

    el.callouts.innerHTML = [
      ["Speed at volume", s.callouts.speed], ["The hotspot is real structure", s.callouts.hotspotReal],
      ["Data quality manufactures a hotspot", s.callouts.dataQuality], ["Volume is not judgement", s.callouts.volumeNotJudgement],
      ["A trend needs context", s.callouts.trend]
    ].map(function (c) { return "<div class='callout'><b>" + c[0] + ".</b> " + esc(c[1]) + "</div>"; }).join("");

    el.static.innerHTML = "<details class='drawer' open><summary>How this works (Day 2 &middot; Topic 1; also Day 3 T1)</summary><div class='dbody'>" +
      "<p><b>What it is.</b> " + esc(s.notes.what) + "</p><p><b>Data quality.</b> " + esc(s.notes.quality) + "</p>" +
      "<p><b>What is real in this demo.</b> " + esc(s.notes.real) + "</p></div></details>";

    render();
    try { localStorage.setItem("s14.scenario", id); } catch (e) {}
  }

  function build() {
    ["scenario", "theme", "context", "sampleInp", "sampleVal", "mergeChk", "mergeLabel",
     "locBars", "themeBars", "topline", "trend", "callouts", "static"].forEach(function (id) { el[id] = document.getElementById(id); });

    manifest.forEach(function (m) { if (!scenarios[m.id]) return; var o = document.createElement("option"); o.value = m.id; o.textContent = m.label; el.scenario.appendChild(o); });
    el.scenario.addEventListener("change", function () { loadScenario(el.scenario.value); });
    el.sampleInp.addEventListener("input", function () { ui.sampleSize = +el.sampleInp.value; render(); });
    el.mergeChk.addEventListener("change", function () { ui.mergeOn = el.mergeChk.checked; render(); });
    document.getElementById("reseedBtn").addEventListener("click", function () { ui.seed = (ui.seed + 1) >>> 0; render(); });

    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) { if (t === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t); el.theme.textContent = "Theme: " + t; }
    var cur = "system"; try { cur = localStorage.getItem("s14.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () { cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]; applyTheme(cur); try { localStorage.setItem("s14.theme", cur); } catch (e) {} });

    var start = manifest[0] && manifest[0].id;
    try { var st = localStorage.getItem("s14.scenario"); if (st && scenarios[st]) start = st; } catch (e) {}
    loadScenario(start);
  }
  build();
})();
