/* ============================================================================
   S8 — Dynamic bowtie / barrier status.  Demo logic.

   No model runs. Threat frequencies, each barrier's nominal PFD, its
   degraded/overdue behaviour and the one common-cause pairing per scenario
   are PRE-AUTHORED — the standard shape of a Layer of Protection Analysis
   (LOPA). Live and real: the PFD for each barrier's current status, the
   series-product maths, the static ("as approved") comparison, the ratio,
   and the risk-matrix placement.
   ============================================================================ */
(function () {
  "use strict";

  var S8 = window.HSE_S8 || {};
  var scenarios = S8.scenarios || {};
  var manifest = S8.manifest ||
    Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });

  var STATUSES = ["healthy", "degraded", "overdue", "bypassed"];
  var SNAME = { healthy: "Healthy", degraded: "Degraded", overdue: "Overdue", bypassed: "Bypassed" };
  var LIK = ["Rare", "Unlikely", "Possible", "Likely", "Frequent"];
  var SEV = ["Minor", "Moderate", "Serious", "Major", "Catastrophic"];

  var el = {}, ui = null, curId = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function trunc(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function sc() { return scenarios[curId]; }

  /* --------------------------------------------------------------- maths -- */
  function barrierPFD(b, status, weeks) {
    if (status === "healthy") return b.nominalPFD;
    if (status === "degraded") return clamp(b.nominalPFD * b.degradedMult, 0, 1);
    if (status === "overdue") return clamp(b.nominalPFD * (1 + b.overdueGrowthPerWk * weeks), 0, 1);
    return 1.0; /* bypassed */
  }
  function seriesPFD(list, forceHealthy) {
    var p = 1;
    list.forEach(function (b) {
      var st = forceHealthy ? "healthy" : ui.status[b.key];
      var wk = forceHealthy ? 0 : ui.weeks;
      p *= barrierPFD(b, st, wk);
    });
    return p;
  }
  function threatTotal() { return sc().threats.reduce(function (a, t) { return a + t.freqPerYr; }, 0); }
  function consequenceFreq(forceHealthy) {
    var top = threatTotal() * seriesPFD(sc().prevention, forceHealthy);
    return top * seriesPFD(sc().mitigation, forceHealthy);
  }
  function likelihoodBand(freq) {
    if (freq < 1e-6) return 0;
    if (freq < 1e-4) return 1;
    if (freq < 1e-2) return 2;
    if (freq < 1) return 3;
    return 4;
  }
  function tone(li, si) {
    var s = li + si;
    return s <= 2 ? 0 : s <= 4 ? 1 : s <= 6 ? 2 : s <= 7 ? 3 : 4;
  }
  function fmtFreq(f) { return f.toExponential(2) + " /yr"; }
  function fmtReturnPeriod(y) {
    if (!isFinite(y)) return "∞";
    if (y >= 1e6) return "1 in " + (y / 1e6).toFixed(2) + "M yrs";
    if (y >= 1e3) return "1 in " + Math.round(y).toLocaleString() + " yrs";
    if (y >= 1) return "1 in " + y.toFixed(1) + " yrs";
    if (y >= 1 / 365) return "1 in " + Math.round(y * 365) + " days";
    return "1 in " + Math.max(1, Math.round(y * 365 * 24)) + " hrs";
  }

  /* ------------------------------------------------------------- bowtie SVG */
  function wrapText(text, cx, cy, maxChars) {
    var words = text.split(" "), l1 = "", l2 = "";
    words.forEach(function (w) {
      if (!l1 || (l1 + " " + w).trim().length <= maxChars) l1 = (l1 + " " + w).trim();
      else l2 = (l2 + " " + w).trim();
    });
    if (l2) return "<text x='" + cx + "' y='" + (cy - 3) + "' text-anchor='middle'>" + esc(l1) + "</text>" +
      "<text x='" + cx + "' y='" + (cy + 9) + "' text-anchor='middle'>" + esc(trunc(l2, maxChars + 4)) + "</text>";
    return "<text x='" + cx + "' y='" + (cy + 3) + "' text-anchor='middle'>" + esc(l1) + "</text>";
  }
  function hexSVG(cx, cy, r) {
    var pts = [];
    for (var a = 0; a < 6; a++) { var ang = Math.PI / 6 + a * Math.PI / 3; pts.push((cx + r * Math.cos(ang)).toFixed(1) + "," + (cy + r * Math.sin(ang)).toFixed(1)); }
    return "<polygon points='" + pts.join(" ") + "'/>";
  }
  function gateSVG(b, cx, gy, w, h) {
    var status = ui.status[b.key];
    var pfd = barrierPFD(b, status, ui.weeks);
    var x = cx - w / 2;
    var cc = b.commonCauseWith ? "<text class='cc' x='" + cx + "' y='" + (gy + 15) + "' text-anchor='middle'>⚠</text>" : "";
    return "<g class='gate " + status + "' data-k='" + b.key + "'>" +
      "<rect x='" + x + "' y='" + gy + "' width='" + w + "' height='" + h + "'/>" +
      "<text x='" + cx + "' y='" + (gy - 6) + "' text-anchor='middle'>" + esc(trunc(b.label, 15)) + "</text>" +
      cc +
      "<text class='pfd' x='" + cx + "' y='" + (gy + h + 12) + "' text-anchor='middle'>PFD " + pfd.toExponential(1) + "</text>" +
      "</g>";
  }
  function xAt(i, n, s0, s1) { return n <= 1 ? (s0 + s1) / 2 : s0 + (s1 - s0) * i / (n - 1); }
  function bowtieSVG() {
    var s = sc(), T = s.threats, P = s.prevention, M = s.mitigation;
    var cy = 150, threatX0 = 8, threatW = 128, threatH = 34;
    var throat1X = 172, pStartX = 214, pEndX = 428, gateW = 40, gateH = 130, gateY = cy - gateH / 2;
    var teX = 478, teR = 38;
    var mStartX = 548, mEndX = 758, cqX = 800, cqW = 92, cqH = 60;
    var svg = "<svg viewBox='0 0 900 300' preserveAspectRatio='xMidYMid meet'>";
    T.forEach(function (t, i) {
      var ty = cy + (i - (T.length - 1) / 2) * (threatH + 24);
      svg += "<g class='bt-threat'><rect x='" + threatX0 + "' y='" + (ty - threatH / 2) + "' width='" + threatW + "' height='" + threatH + "' rx='4'/>" +
        wrapText(t.label, threatX0 + threatW / 2, ty, 16) + "</g>";
      svg += "<path class='bt-line' d='M" + (threatX0 + threatW) + " " + ty + " L" + throat1X + " " + cy + "'/>";
    });
    svg += "<path class='bt-line' d='M" + throat1X + " " + cy + " L" + (teX - teR) + " " + cy + "'/>";
    P.forEach(function (b, i) { svg += gateSVG(b, xAt(i, P.length, pStartX, pEndX), gateY, gateW, gateH); });
    svg += "<g class='bt-te'>" + hexSVG(teX, cy, teR) + "</g>" +
      "<text class='bt-te' x='" + teX + "' y='" + (cy + teR + 15) + "' text-anchor='middle'>TOP EVENT</text>";
    svg += "<path class='bt-line' d='M" + (teX + teR) + " " + cy + " L" + mEndX + " " + cy + "'/>";
    M.forEach(function (b, i) { svg += gateSVG(b, xAt(i, M.length, mStartX, mEndX), gateY, gateW, gateH); });
    svg += "<path class='bt-line' d='M" + mEndX + " " + cy + " L" + cqX + " " + cy + "'/>";
    svg += "<g class='bt-cq'><rect x='" + cqX + "' y='" + (cy - cqH / 2) + "' width='" + cqW + "' height='" + cqH + "' rx='4'/>" +
      wrapText(s.consequence.label, cqX + cqW / 2, cy, 14) + "</g>";
    return svg + "</svg>";
  }

  /* ------------------------------------------------------------- matrix ---- */
  function matrixHTML(liveLi, si, staticLi) {
    var rows = "";
    for (var sevVal = 5; sevVal >= 1; sevVal--) {
      var si2 = sevVal - 1;
      var cells = "";
      for (var li = 0; li <= 4; li++) {
        var t = tone(li, si2);
        var isLive = (li === liveLi && si2 === si);
        var isStat = (li === staticLi && si2 === si);
        var dots = (isStat ? "<span class='dot stat'></span>" : "") + (isLive ? "<span class='dot live'></span>" : "");
        cells += "<div class='cell t" + t + "'>" + dots + "</div>";
      }
      rows += cells;
    }
    return rows;
  }

  /* -------------------------------------------------------------- render -- */
  function paint() {
    var s = sc();
    var liveCq = consequenceFreq(false), staticCq = consequenceFreq(true);
    var ratio = liveCq / staticCq;
    var si = s.consequence.severity - 1;
    var liveLi = likelihoodBand(liveCq), staticLi = likelihoodBand(staticCq);
    var rtone = ratio < 3 ? "ok" : ratio < 15 ? "warn" : "bad";

    el.bowtie.innerHTML = bowtieSVG();

    el.tiles.innerHTML =
      "<div class='tile'><div class='tl'>Live residual risk</div>" +
        "<div class='big " + (liveLi >= 3 ? "bad" : liveLi === 2 ? "warn" : "ok") + "'>" + fmtReturnPeriod(1 / liveCq) + "</div>" +
        "<div class='small'>" + fmtFreq(liveCq) + " &nbsp;·&nbsp; " + LIK[liveLi] + " / " + SEV[si] + "</div></div>" +
      "<div class='tile'><div class='tl'>As-approved (static) risk</div>" +
        "<div class='big ok'>" + fmtReturnPeriod(1 / staticCq) + "</div>" +
        "<div class='small'>" + fmtFreq(staticCq) + " &nbsp;·&nbsp; " + LIK[staticLi] + " / " + SEV[si] + "</div></div>" +
      "<div class='tile'><div class='tl'>Live vs the static assessment</div>" +
        "<div class='big " + rtone + "'>" + (ratio < 1.05 ? "1.0×" : ratio.toFixed(ratio < 10 ? 1 : 0) + "×") + "</div>" +
        "<div class='small'>" + (ratio < 1.05 ? "matches the approved bowtie" : "higher likelihood than the paper assumes") + "</div></div>";

    el.matrix.innerHTML = matrixHTML(liveLi, si, staticLi);

    /* live-update the PFD readout on each barrier card */
    sc().prevention.concat(sc().mitigation).forEach(function (b) {
      var card = el.barriers.querySelector("[data-k='" + b.key + "']");
      if (!card) return;
      var pfd = barrierPFD(b, ui.status[b.key], ui.weeks);
      card.querySelector(".pfdline").textContent = "PFD now " + pfd.toExponential(2) + " (nominal " + b.nominalPFD.toExponential(2) + ")";
    });

    el.weeksVal.textContent = ui.weeks + " wk";
  }

  function barrierCard(b, side) {
    var seg = STATUSES.map(function (st) {
      return "<button data-s='" + st + "' aria-pressed='" + (ui.status[b.key] === st) + "'>" + SNAME[st] + "</button>";
    }).join("");
    return "<div class='barrier' data-k='" + b.key + "' data-side='" + side + "'>" +
      "<div class='bh'><span>" + esc(b.label) + "</span></div>" +
      (b.commonCauseWith ? "<div class='cc-tag'>⚠ shares a dependency with another barrier &mdash; see note below</div>" : "") +
      "<div class='pfdline'></div>" +
      "<div class='seg'>" + seg + "</div></div>";
  }

  /* -------------------------------------------------------------- wiring -- */
  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    var s = scenarios[id];
    ui = { status: {}, weeks: 0 };
    s.prevention.concat(s.mitigation).forEach(function (b) { ui.status[b.key] = "healthy"; });
    if (el.scenario.value !== id) el.scenario.value = id;

    el.eventline.innerHTML = "<div class='te'>Top event: " + esc(s.topEvent) + "</div>" +
      "<div class='cq'>Worst credible consequence: " + esc(s.consequence.label) + " (" + SEV[s.consequence.severity - 1] + ")</div>";

    el.barriers.innerHTML =
      "<h3 class='side'>Prevention barriers (threat &rarr; top event)</h3>" +
      s.prevention.map(function (b) { return barrierCard(b, "prevention"); }).join("") +
      "<h3 class='side'>Mitigation barriers (top event &rarr; consequence)</h3>" +
      s.mitigation.map(function (b) { return barrierCard(b, "mitigation"); }).join("");

    Array.prototype.forEach.call(el.barriers.querySelectorAll(".barrier"), function (card) {
      var key = card.getAttribute("data-k");
      Array.prototype.forEach.call(card.querySelectorAll(".seg button"), function (btn) {
        btn.addEventListener("click", function () {
          ui.status[key] = btn.getAttribute("data-s");
          Array.prototype.forEach.call(card.querySelectorAll(".seg button"), function (bb) {
            bb.setAttribute("aria-pressed", String(bb === btn));
          });
          paint();
        });
      });
    });

    el.ccnote.innerHTML = "<b>Common-cause caution.</b> " + esc(s.commonCauseNote);

    el.ops.innerHTML =
      "<div class='row'><div class='rh'><span>" + esc(s.digitalTwin.reviewLabel) + " &mdash; weeks since</span><span id='weeksVal'>0 wk</span></div>" +
      "<input type='range' id='weeksInp' min='0' max='52' step='1' value='0'></div>" +
      "<div class='btns'><button class='ghost' id='resetBtn' type='button'>Reset to as-approved</button></div>";
    el.weeksInp = document.getElementById("weeksInp");
    el.weeksVal = document.getElementById("weeksVal");
    el.weeksInp.addEventListener("input", function () { ui.weeks = +el.weeksInp.value; paint(); });
    document.getElementById("resetBtn").addEventListener("click", function () {
      s.prevention.concat(s.mitigation).forEach(function (b) { ui.status[b.key] = "healthy"; });
      ui.weeks = 0;
      el.weeksInp.value = 0;
      Array.prototype.forEach.call(el.barriers.querySelectorAll(".barrier"), function (card) {
        Array.prototype.forEach.call(card.querySelectorAll(".seg button"), function (bb) {
          bb.setAttribute("aria-pressed", String(bb.getAttribute("data-s") === "healthy"));
        });
      });
      paint();
    });

    el.callouts.innerHTML = [
      ["Static vs dynamic", s.callouts.staticVsDynamic],
      ["Common cause", s.callouts.commonCause],
      ["Matrix banding hides ratios", s.callouts.matrixBanding],
      ["Data quality", s.callouts.dataQuality],
      ["Not a replacement", s.callouts.notAReplacement]
    ].map(function (c) { return "<div class='callout'><b>" + c[0] + ".</b> " + esc(c[1]) + "</div>"; }).join("");

    el.static.innerHTML =
      "<details class='drawer' open><summary>How this works (Day 2 &middot; Topic 5)</summary><div class='dbody'>" +
      "<p><b>The bowtie.</b> " + esc(s.notes.what) + "</p>" +
      "<p><b>Simplification.</b> " + esc(s.notes.dynamic) + "</p>" +
      "<p><b>Weeks since review.</b> " + esc(s.notes.review) + "</p>" +
      "<p><b>The risk matrix.</b> " + esc(s.notes.matrix) + "</p>" +
      "<p><b>The digital-twin pitch.</b> " + esc(s.digitalTwin.value) + "</p>" +
      "<p><b>Its caveat.</b> " + esc(s.digitalTwin.caveat) + "</p>" +
      "<p><b>What is real in this demo.</b> " + esc(s.notes.real) + "</p>" +
      "</div></details>";

    paint();
    try { localStorage.setItem("s8.scenario", id); } catch (e) {}
  }

  function build() {
    el.scenario = document.getElementById("scenario");
    el.theme = document.getElementById("theme");
    el.eventline = document.getElementById("eventline");
    el.tiles = document.getElementById("tiles");
    el.bowtie = document.getElementById("bowtie");
    el.barriers = document.getElementById("barriers");
    el.ccnote = document.getElementById("ccnote");
    el.ops = document.getElementById("ops");
    el.matrix = document.getElementById("matrix");
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
    try { cur = localStorage.getItem("s8.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () {
      cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      applyTheme(cur);
      try { localStorage.setItem("s8.theme", cur); } catch (e) {}
    });

    var start = manifest[0] && manifest[0].id;
    try { var st = localStorage.getItem("s8.scenario"); if (st && scenarios[st]) start = st; } catch (e) {}
    loadScenario(start);
  }

  build();
})();
