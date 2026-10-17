/* ============================================================================
   S4 — Predictive-model mechanics sandbox.  Demo logic.

   No model was trained. The coefficients, the tree, the stumps and the feature
   means/SDs are PRE-AUTHORED in the dataset files. Everything shown is computed
   live from the slider values by the real maths below:
     regression : sigmoid(intercept + Σ coef·x)
     tree       : traverse {f, op, thr, yes, no} to a {p, n} leaf
     ensemble   : sigmoid(base + Σ stump)   stump = (x[f] >= thr) ? yes : no
     anomaly    : z = (x - mean)/sd ; flag if rms(z) > tRms or max|z| > tMax
   ============================================================================ */
(function () {
  "use strict";

  var S4 = window.HSE_S4 || {};
  var scenarios = S4.scenarios || {};
  var manifest = S4.manifest ||
    Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });

  var el = {};
  var ui = null;
  var curId = null;

  var MODELS = ["regression", "tree", "ensemble", "anomaly"];
  var MNAME = { regression: "Regression", tree: "Decision tree", ensemble: "Ensemble", anomaly: "Anomaly detector" };
  var MTAG = {
    regression: "one fixed weight per factor",
    tree: "one readable yes/no path",
    ensemble: "many weak rules, post-hoc explanation",
    anomaly: "distance from normal — no labels"
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
  function pct(p) { return (p * 100).toFixed(1) + "%"; }
  function sgn(n) { return (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(2); }
  function trunc(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function sc() { return scenarios[curId]; }
  function feat(key) { return sc().features.filter(function (f) { return f.key === key; })[0]; }
  function zscore(key, val) { var f = feat(key); return (val - f.mean) / f.sd; }

  /* ---------------------------------------------------------------- maths -- */
  function regression(x) {
    var r = sc().regression, z = r.intercept, terms = [];
    sc().features.forEach(function (f) {
      var c = r.coef[f.key] || 0, contrib = c * x[f.key];
      z += contrib;
      terms.push({ key: f.key, label: f.label, coef: c, val: x[f.key], contrib: contrib });
    });
    return { p: sigmoid(z), z: z, terms: terms };
  }
  function treePath(x) {
    var node = sc().tree.root, path = [];
    while (node.p === undefined) {
      var val = x[node.f], go = val >= node.thr ? "yes" : "no";
      path.push({ node: node, branch: go, val: val });
      node = node[go];
    }
    path.push({ node: node, branch: null, leaf: true });
    return path;
  }
  function stumpOut(s, val) { return (val >= s.thr) ? s.yes : s.no; }
  function ensemble(x) {
    var e = sc().ensemble, z = e.base, sum = 0, fired = [];
    e.stumps.forEach(function (s) {
      var yes = x[s.f] >= s.thr, out = yes ? s.yes : s.no;
      sum += out; fired.push({ s: s, yes: yes, out: out });
    });
    z += sum;
    var contrib = sc().features.map(function (f) {
      var cur = 0, ref = 0;
      e.stumps.forEach(function (s) {
        if (s.f !== f.key) return;
        cur += stumpOut(s, x[f.key]);
        ref += stumpOut(s, f.mean);
      });
      return { key: f.key, label: f.label, contrib: cur - ref };
    });
    return { p: sigmoid(z), z: z, base: e.base, sum: sum, fired: fired, contrib: contrib };
  }
  function anomaly(x) {
    var a = sc().anomaly, rows = [], ss = 0, maxZ = 0, maxKey = "";
    sc().features.forEach(function (f) {
      var z = zscore(f.key, x[f.key]);
      rows.push({ key: f.key, label: f.label, z: z });
      ss += z * z;
      if (Math.abs(z) > maxZ) { maxZ = Math.abs(z); maxKey = f.label; }
    });
    var rms = Math.sqrt(ss / rows.length);
    var flagged = rms > a.thresholdRms || maxZ > a.thresholdMax;
    return { rows: rows, rms: rms, maxZ: maxZ, maxKey: maxKey, flagged: flagged,
             tRms: a.thresholdRms, tMax: a.thresholdMax };
  }

  function predOf(model, x) {
    if (model === "regression") return regression(x).p;
    if (model === "tree") return treePath(x).slice(-1)[0].node.p;
    if (model === "ensemble") return ensemble(x).p;
    return null;
  }

  /* ------------------------------------------------------------ rendering -- */
  function divergingBars(items, unit) {
    var maxAbs = items.reduce(function (m, it) { return Math.max(m, Math.abs(it.contrib)); }, 0.001);
    return "<div class='contrib'>" + items.slice().sort(function (a, b) {
      return Math.abs(b.contrib) - Math.abs(a.contrib);
    }).map(function (it) {
      var w = Math.abs(it.contrib) / maxAbs * 46;
      var style = it.contrib >= 0 ? "left:50%;width:" + w + "%" : "left:" + (50 - w) + "%;width:" + w + "%";
      return "<div class='row'><span>" + esc(it.label) + "</span>" +
        "<span class='track'><span class='mid'></span><i class='" + (it.contrib < 0 ? "neg" : "") + "' style='" + style + "'></i></span>" +
        "<span class='val'>" + sgn(it.contrib) + (unit || "") + "</span></div>";
    }).join("") + "</div>";
  }

  function detailRegression(x) {
    var r = regression(x), m = sc().metrics.regression;
    var calc = "z  =  intercept + Σ(weight × value)\n" +
      "    =  " + sc().regression.intercept.toFixed(2) + "  " +
      r.terms.filter(function (t) { return t.coef; }).map(function (t) {
        return (t.contrib >= 0 ? "+ " : "− ") + Math.abs(t.contrib).toFixed(2);
      }).join("  ") +
      "\n    =  " + r.z.toFixed(2) + "\n" +
      "p  =  sigmoid(z)  =  " + pct(r.p);
    var rows = r.terms.map(function (t) {
      return "<tr class='" + (t.coef ? "active" : "") + "'><td>" + esc(t.label) + "</td>" +
        "<td>" + (t.coef ? t.coef : "—") + "</td><td>" + t.val + "</td>" +
        "<td>" + (t.coef ? sgn(t.contrib) : "—") + "</td></tr>";
    }).join("");
    return "<p class='note'>" + esc(sc().notes.regression) + "</p>" +
      "<div class='calc'>" + esc(calc) + "</div>" +
      "<h3>Fixed weights &amp; this case's contribution (log-odds)</h3>" +
      "<table class='coeftab'><thead><tr><th>Feature</th><th>weight</th><th>your value</th><th>contribution</th></tr></thead><tbody>" +
      rows + "</tbody></table>" +
      "<h3>Same, as a picture</h3>" + divergingBars(r.terms) +
      "<p class='note' style='margin-top:8px'><b>Explainability.</b> " + esc(m.explain) + "</p>";
  }

  function layoutTree(root) {
    var nodes = [], edges = [], leaf = { v: 0 }, maxDepth = 0;
    function rec(n, depth) {
      maxDepth = Math.max(maxDepth, depth);
      if (n.p !== undefined) {
        var lo = { n: n, depth: depth, x: leaf.v++, leaf: true }; nodes.push(lo); return lo;
      }
      var L = rec(n.yes, depth + 1), R = rec(n.no, depth + 1);
      var o = { n: n, depth: depth, x: (L.x + R.x) / 2, leaf: false };
      edges.push({ from: o, to: L, br: "yes" }); edges.push({ from: o, to: R, br: "no" });
      nodes.push(o); return o;
    }
    rec(root, 0);
    return { nodes: nodes, edges: edges, cols: leaf.v, maxDepth: maxDepth };
  }
  function detailTree(x) {
    var path = treePath(x), m = sc().metrics.tree;
    var onNode = path.map(function (s) { return s.node; });
    var branchAt = function (n) { for (var i = 0; i < path.length; i++) if (path[i].node === n) return path[i].branch; return null; };
    var lay = layoutTree(sc().tree.root);
    var colW = 118, rowH = 62, W = lay.cols * colW, H = (lay.maxDepth + 1) * rowH + 10;
    var cx = function (o) { return o.x * colW + colW / 2; };
    var cy = function (o) { return o.depth * rowH + 22; };
    var svg = "<svg viewBox='0 0 " + W + " " + H + "' preserveAspectRatio='xMidYMin meet'>";
    lay.edges.forEach(function (e) {
      var on = onNode.indexOf(e.from.n) >= 0 && branchAt(e.from.n) === e.br;
      svg += "<path class='edge" + (on ? " onpath" : "") + "' d='M" + cx(e.from) + " " + (cy(e.from) + 14) +
        " L" + cx(e.to) + " " + (cy(e.to) - 14) + "'/>";
      svg += "<text class='edgelabel' x='" + ((cx(e.from) + cx(e.to)) / 2) + "' y='" + ((cy(e.from) + cy(e.to)) / 2) + "'>" + e.br + "</text>";
    });
    lay.nodes.forEach(function (o) {
      var on = onNode.indexOf(o.n) >= 0;
      var l1, l2;
      if (o.leaf) { l1 = "p = " + Math.round(o.n.p * 100) + "%"; l2 = "n = " + o.n.n; }
      else { l1 = trunc(feat(o.n.f).label, 15); l2 = "≥ " + o.n.thr; }
      svg += "<g class='node" + (o.leaf ? " leaf" : "") + (on ? " onpath" : "") + "'>" +
        "<rect x='" + (cx(o) - 52) + "' y='" + (cy(o) - 14) + "' width='104' height='28' rx='5'/>" +
        "<text x='" + cx(o) + "' y='" + (cy(o) - 1) + "' text-anchor='middle'>" + esc(l1) + "</text>" +
        "<text x='" + cx(o) + "' y='" + (cy(o) + 10) + "' text-anchor='middle'>" + esc(l2) + "</text></g>";
    });
    svg += "</svg>";
    var trace = path.filter(function (s) { return !s.leaf; }).map(function (s) {
      return esc(trunc(feat(s.node.f).label, 22)) + " = " + s.val + (s.branch === "yes" ? " ≥ " : " < ") + s.node.thr +
        " → " + s.branch;
    }).join("  ;  ");
    var leaf = path.slice(-1)[0].node;
    return "<p class='note'>" + esc(sc().notes.tree) + "</p>" +
      "<div class='tree treewrap'>" + svg + "</div>" +
      "<div class='calc'>" + trace + "  →  leaf  p = " + Math.round(leaf.p * 100) + "%  (n = " + leaf.n + ")</div>" +
      "<p class='note' style='margin-top:8px'><b>Explainability.</b> " + esc(m.explain) + "</p>";
  }

  function detailEnsemble(x) {
    var e = ensemble(x), m = sc().metrics.ensemble;
    var up = e.fired.filter(function (f) { return f.out > 0; }).length;
    var calc = "z = " + e.z.toFixed(2) + "  =  " + e.base.toFixed(2) + " (base)  " +
      (e.sum >= 0 ? "+ " : "− ") + Math.abs(e.sum).toFixed(2) + " (sum of " + e.fired.length + " rules)\n" +
      "p = sigmoid(z) = " + pct(e.p);
    var list = e.fired.map(function (f) {
      var s = f.s;
      return "<li class='" + (f.yes ? "fired-yes" : "fired-no") + "'>" +
        "<span>" + esc(trunc(feat(s.f).label, 22)) + " ≥ " + s.thr + (f.yes ? "  ✓" : "  ✗") + "</span>" +
        "<span class='p " + (f.out < 0 ? "neg" : "") + "'>" + sgn(f.out) + "</span></li>";
    }).join("");
    return "<p class='note'>" + esc(sc().notes.ensemble) + "</p>" +
      "<div class='calc'>" + esc(calc) + "</div>" +
      "<p class='note' style='margin:8px 0 0'>" + up + " of " + e.fired.length + " rules pushed the score up, " +
      (e.fired.length - up) + " pushed it down.</p>" +
      "<h3>Per-feature contribution &mdash; approximate attribution (real tools use SHAP)</h3>" + divergingBars(e.contrib) +
      "<h3>The rules, and what each did for this case</h3><ul class='stumps'>" + list + "</ul>" +
      "<p class='note' style='margin-top:8px'><b>Explainability.</b> " + esc(m.explain) + "</p>";
  }

  function detailAnomaly(x) {
    var a = anomaly(x), m = sc().metrics.anomaly, cfg = sc().anomaly;
    var fx = feat(cfg.scatterX), fy = feat(cfg.scatterY);
    var mapX = function (v) { return 40 + (v - fx.min) / (fx.max - fx.min) * 240; };
    var mapY = function (v) { return 190 - (v - fy.min) / (fy.max - fy.min) * 170; };
    var cloud = cfg.cloud.map(function (p) {
      return "<circle class='cloud' cx='" + mapX(p[0]).toFixed(1) + "' cy='" + mapY(p[1]).toFixed(1) + "' r='3'/>";
    }).join("");
    var px = mapX(x[cfg.scatterX]), py = mapY(x[cfg.scatterY]);
    var svg = "<svg viewBox='0 0 300 214'>" +
      "<line x1='40' y1='190' x2='288' y2='190' stroke='var(--line-strong)'/>" +
      "<line x1='40' y1='190' x2='40' y2='16' stroke='var(--line-strong)'/>" +
      cloud +
      "<circle class='pt' cx='" + px.toFixed(1) + "' cy='" + py.toFixed(1) + "' r='6'/>" +
      "<text class='axl' x='164' y='210' text-anchor='middle'>" + esc(trunc(fx.label, 30)) + "</text>" +
      "<text class='axl' x='6' y='12'>" + esc(trunc(fy.label, 24)) + " ↑</text>" +
      "</svg>";
    var maxAbs = 4;
    var zb = a.rows.map(function (r) {
      var out = Math.abs(r.z) >= 2;
      var w = Math.min(Math.abs(r.z), maxAbs) / maxAbs * 46;
      var style = r.z >= 0 ? "left:50%;width:" + w + "%" : "left:" + (50 - w) + "%;width:" + w + "%";
      return "<div class='row'><span>" + esc(r.label) + "</span>" +
        "<span class='track'><span class='mid'></span><i class='" + (out ? "out" : "") + "' style='" + style + "'></i></span>" +
        "<span class='val'>" + (r.z >= 0 ? "+" : "−") + Math.abs(r.z).toFixed(1) + "</span></div>";
    }).join("");
    var verdict = a.flagged
      ? "<div class='verdict flag'><b>Outlier.</b> This case sits outside the training distribution " +
        "(overall z = " + a.rms.toFixed(2) + " vs " + a.tRms + "; largest single z = " + a.maxZ.toFixed(1) +
        " on &ldquo;" + esc(a.maxKey) + "&rdquo; vs " + a.tMax + "). " +
        "The predictions above may be extrapolating &mdash; treat their numbers with caution.</div>"
      : "<div class='verdict ok'><b>Typical.</b> Within the range the models were built on " +
        "(overall z = " + a.rms.toFixed(2) + ", largest " + a.maxZ.toFixed(1) + "). No distribution warning.</div>";
    return "<p class='note'>" + esc(sc().notes.anomaly) + "</p>" +
      "<div class='scatter'>" + svg + "</div>" +
      "<h3>Distance from &ldquo;normal&rdquo;, per feature (z-score)</h3><div class='zbars'>" + zb + "</div>" +
      verdict +
      "<p class='note' style='margin-top:8px'><b>Explainability.</b> " + esc(m.explain) + "</p>";
  }

  function detail(x) {
    if (ui.model === "regression") return detailRegression(x);
    if (ui.model === "tree") return detailTree(x);
    if (ui.model === "ensemble") return detailEnsemble(x);
    return detailAnomaly(x);
  }

  function scoreboard(x) {
    var mt = sc().metrics;
    var preds = [
      pct(regression(x).p),
      Math.round(treePath(x).slice(-1)[0].node.p * 100) + "%",
      pct(ensemble(x).p),
      anomaly(x).flagged ? "OUTLIER" : "typical"
    ];
    var textRows = [
      ["Backtest AUC (authored)", [mt.regression.auc, mt.tree.auc, mt.ensemble.auc, mt.anomaly.auc]],
      ["How you explain ONE decision", [mt.regression.explain, mt.tree.explain, mt.ensemble.explain, mt.anomaly.explain]],
      ["Labelled outcome data needed?", [mt.regression.data, mt.tree.data, mt.ensemble.data, mt.anomaly.data]],
      ["Main failure mode", [mt.regression.failure, mt.tree.failure, mt.ensemble.failure, mt.anomaly.failure]],
      ["What to ask the vendor", [mt.regression.ask, mt.tree.ask, mt.ensemble.ask, mt.anomaly.ask]]
    ];
    var predRow = "<tr><th>Prediction for this case</th>" +
      preds.map(function (p) { return "<td><span class='big'>" + esc(p) + "</span></td>"; }).join("") + "</tr>";
    var body = predRow + textRows.map(function (r) {
      return "<tr><th>" + r[0] + "</th>" +
        r[1].map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>";
    }).join("");
    return "<div class='scoreboard'><h2>Same data, four models &mdash; the trade-off</h2>" +
      "<table><thead><tr><th></th><th>Regression</th><th>Decision tree</th><th>Ensemble</th>" +
      "<th>Anomaly detector</th></tr></thead><tbody>" + body + "</tbody></table></div>";
  }

  /* -------------------------------------------------------- derived paint -- */
  function renderDerived() {
    var x = ui.values;

    /* case bar */
    el.casebar.innerHTML = sc().cases.map(function (c) {
      return "<button data-case='" + esc(c.name) + "' aria-pressed='" + (c.name === ui.caseName) + "'>" + esc(c.name) + "</button>";
    }).join("") +
    (sc().cases.some(function (c) { return c.name === ui.caseName; }) ? "" :
      "<button aria-pressed='true' disabled>" + esc(ui.caseName) + "</button>");

    /* model cards */
    el.cards.innerHTML = MODELS.map(function (mo) {
      var big, cls = "";
      if (mo === "anomaly") {
        var a = anomaly(x);
        big = a.flagged ? "OUTLIER" : "typical";
        cls = a.flagged ? " flag" : "";
        big += "<div class='mx'>overall z = " + a.rms.toFixed(2) + "</div>";
      } else {
        big = mo === "tree" ? Math.round(predOf("tree", x) * 100) + "%" : pct(predOf(mo, x));
        big += "<div class='mx'>" + esc(MTAG[mo]) + "</div>";
      }
      var auc = sc().metrics[mo].auc;
      return "<button class='mcard' data-m='" + mo + "' aria-selected='" + (ui.model === mo) + "'>" +
        "<div class='mn'>" + esc(MNAME[mo]) + "</div>" +
        "<div class='mp" + cls + "'>" + big + "</div>" +
        "<div class='auc'>AUC " + esc(auc) + "</div></button>";
    }).join("");

    /* detail */
    el.detail.setAttribute("data-m", ui.model);
    el.detail.innerHTML = "<h2>" + esc(MNAME[ui.model]) + "</h2>" + detail(x);

    /* scoreboard */
    el.score.innerHTML = scoreboard(x);
  }

  function syncSliders() {
    sc().features.forEach(function (f) {
      var wrap = el.feats.querySelector("[data-feat='" + f.key + "']");
      if (!wrap) return;
      var val = ui.values[f.key];
      wrap.querySelector("input").value = val;
      wrap.querySelector(".fv").textContent = val;
      var z = zscore(f.key, val), out = Math.abs(z) >= 2;
      var zEl = wrap.querySelector(".z");
      zEl.textContent = "z = " + (z >= 0 ? "+" : "−") + Math.abs(z).toFixed(1);
      zEl.className = "z" + (out ? " out" : "");
    });
  }

  function buildSliders() {
    el.feats.innerHTML = sc().features.map(function (f) {
      return "<div class='feat' data-feat='" + f.key + "'>" +
        "<div class='fh'><span>" + esc(f.label) + "</span><span class='fv'></span></div>" +
        "<input type='range' min='" + f.min + "' max='" + f.max + "' step='" + f.step + "'>" +
        "<span class='z'></span></div>";
    }).join("");
    sc().features.forEach(function (f) {
      var wrap = el.feats.querySelector("[data-feat='" + f.key + "']");
      wrap.querySelector("input").addEventListener("input", function (e) {
        ui.values[f.key] = +e.target.value;
        ui.caseName = "Custom";
        syncSliders();
        renderDerived();
      });
    });
    syncSliders();
  }

  /* -------------------------------------------------------------- wiring -- */
  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    var s = scenarios[id];
    ui = { values: Object.assign({}, s.cases[0].values), caseName: s.cases[0].name, model: "regression" };
    if (el.scenario.value !== id) el.scenario.value = id;
    el.target.innerHTML = "<div class='lbl'>The prediction target</div><div class='t'>" + esc(s.target) + "</div>";
    el.static.innerHTML =
      "<details class='drawer' open><summary>How this works (Day 1 &middot; Topic 2b)</summary><div class='dbody'>" +
      ["regression", "tree", "ensemble", "anomaly"].map(function (k) {
        return "<h3>" + esc(MNAME[k]) + "</h3><p>" + esc(s.notes[k]) + "</p>";
      }).join("") +
      "<h3>The trade-off</h3><p>" + esc(s.notes.explainability) + "</p>" +
      "<h3>What is real in this demo</h3><p>The coefficients, the tree, the stumps and the feature " +
      "means/SDs are pre-authored. Every prediction, contribution and z-score on the page is computed " +
      "live from the sliders by the standard maths &mdash; sigmoid, tree traversal, a sum of rules, z-scores.</p>" +
      "</div></details>";
    buildSliders();
    renderDerived();
    try { localStorage.setItem("s4.scenario", id); } catch (e) {}
  }

  function build() {
    el.scenario = document.getElementById("scenario");
    el.theme = document.getElementById("theme");
    el.target = document.getElementById("target");
    el.casebar = document.getElementById("casebar");
    el.feats = document.getElementById("feats");
    el.cards = document.getElementById("cards");
    el.detail = document.getElementById("detail");
    el.score = document.getElementById("score");
    el.static = document.getElementById("static");

    manifest.forEach(function (m) {
      if (!scenarios[m.id]) return;
      var o = document.createElement("option");
      o.value = m.id; o.textContent = m.label;
      el.scenario.appendChild(o);
    });
    el.scenario.addEventListener("change", function () { loadScenario(el.scenario.value); });

    el.casebar.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-case]");
      if (!b) return;
      var c = sc().cases.filter(function (cc) { return cc.name === b.getAttribute("data-case"); })[0];
      if (!c) return;
      ui.values = Object.assign({}, c.values);
      ui.caseName = c.name;
      syncSliders();
      renderDerived();
    });
    el.cards.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-m]");
      if (!b) return;
      ui.model = b.getAttribute("data-m");
      renderDerived();
    });

    /* theme */
    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) {
      if (t === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      el.theme.textContent = "Theme: " + t;
    }
    var cur = "system";
    try { cur = localStorage.getItem("s4.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () {
      cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      applyTheme(cur);
      try { localStorage.setItem("s4.theme", cur); } catch (e) {}
    });

    var start = manifest[0] && manifest[0].id;
    try { var st = localStorage.getItem("s4.scenario"); if (st && scenarios[st]) start = st; } catch (e) {}
    loadScenario(start);
  }

  build();
})();
