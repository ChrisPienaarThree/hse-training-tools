/* ============================================================================
   S1 — Four kinds of AI, one incident.  Demo logic.
   All "AI output" is read from the pre-authored dataset files. Nothing here
   runs a model. The controls step between authored states; they do not compute.
   ============================================================================ */
(function () {
  "use strict";

  var S1 = window.HSE_S1 || {};
  var scenarios = S1.scenarios || {};
  var manifest = S1.manifest || Object.keys(scenarios).map(function (id) {
    return { id: id, label: (scenarios[id] && scenarios[id].label) || id };
  });

  var el = {
    scenario: document.getElementById("scenario"),
    theme: document.getElementById("theme"),
    situation: document.getElementById("situation"),
    grid: document.getElementById("grid"),
    synthesis: document.getElementById("synthesis")
  };

  /* per-render UI state, reset when the scenario changes */
  var ui;

  /* --------------------------------------------------------------- helpers -- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pct(n) { return Math.round(n * 100); }
  function fmt(n, d) { return Number(n).toFixed(d == null ? 2 : d); }
  function band(word) {
    var w = String(word).toLowerCase();
    if (w.indexOf("low") === 0) return "low";
    if (w.indexOf("moderate") === 0) return "mod";
    return "hi";
  }
  function elx(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ------------------------------------------------------------- situation -- */
  function renderSituation(sc) {
    el.situation.innerHTML =
      '<div class="headline">' + esc(sc.situation.headline) + "</div>" +
      "<ul>" + sc.situation.facts.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" +
      '<div class="feeds-into">The same situation now goes to four different AIs: ' +
        '<span style="border-color:var(--vision);color:var(--vision)">a camera image</span>' +
        '<span style="border-color:var(--pred);color:var(--pred)">site metrics</span>' +
        '<span style="border-color:var(--nlp);color:var(--nlp)">the written narrative</span>' +
        '<span style="border-color:var(--gen);color:var(--gen)">a drafting prompt</span>' +
      "</div>";
  }

  /* ---------------------------------------------------- panel scaffolding -- */
  function panel(kind, kindLabel, engine, dayMap) {
    var p = elx("section", "panel");
    p.setAttribute("data-kind", kind);
    p.innerHTML =
      "<header><div class='kind'>" + esc(kindLabel) + "</div>" +
      "<div class='engine'>" + esc(engine) + "</div></header>" +
      "<div class='body'></div>";
    var body = p.querySelector(".body");
    body.appendChild(elx("div", "panel-content"));
    var dm = elx("div", "daymap", "Maps to: " + esc(dayMap));
    body.appendChild(dm);
    return { root: p, content: body.querySelector(".panel-content") };
  }

  function drawer(v) {
    return "<details class='drawer'><summary>How you would actually validate this</summary>" +
      "<div class='dbody'>" +
      "<p><span class='lbl'>Method.</span> " + esc(v.method) + "</p>" +
      (v.independentNote ? "<p><span class='indep'>Independent evidence.</span> " + esc(v.independentNote) + "</p>" : "") +
      "<p><span class='lbl'>Human in the loop.</span> " + esc(v.humanRole) + "</p>" +
      "</div></details>";
  }
  function failureBox(text) {
    return "<div class='failure'><b>How it fails</b><br>" + esc(text) + "</div>";
  }

  /* --------------------------------------------------------------- VISION -- */
  function renderVision(sc, mount) {
    var d = sc.vision;
    var ci = ui.visionCond;
    var cond = d.conditions[ci];
    var m = cond.matrix;
    var prec = m.tp + m.fp ? m.tp / (m.tp + m.fp) : 0;
    var rec = m.tp + m.fn ? m.tp / (m.tp + m.fn) : 0;
    var far = m.fp + m.tn ? m.fp / (m.fp + m.tn) : 0;

    var boxes = ui.visionBoxes ? cond.detections.map(function (det) {
      if (!det.box) return "";
      var cls = "box" + (det.alert ? " alert" : "") + (det.falsePositive ? " fp" : "");
      var b = det.box;
      return "<div class='" + cls + "' style='left:" + b[0] + "%;top:" + b[1] + "%;width:" + b[2] + "%;height:" + b[3] + "%'>" +
        "<span>" + esc(det.label) + " " + fmt(det.conf, 2) + "</span></div>";
    }).join("") : "";

    var list = cond.detections.map(function (det) {
      var tag = det.falsePositive ? "<span class='tag-fp'>false positive</span>"
             : det.alert ? "<span class='tag-alert'>ALERT</span>" : "";
      return "<li><span>" + esc(det.label) + "</span><span>" + fmt(det.conf, 2) + " " + tag + "</span>" +
        "<span class='bar'><i style='width:" + pct(det.conf) + "%'></i></span></li>";
    }).join("");

    mount.innerHTML =
      "<div class='ctl'><span>Image conditions</span>" +
        "<input type='range' min='0' max='" + (d.conditions.length - 1) + "' value='" + ci + "' id='vcond'>" +
        "<label class='switch'><input type='checkbox' id='vbox' " + (ui.visionBoxes ? "checked" : "") + "> boxes</label>" +
      "</div>" +
      "<div style='font-size:.82rem;color:var(--ink-soft);margin-bottom:6px'>" + esc(cond.name) + "</div>" +
      "<div class='scene'><img src='" + esc("data/" + sc.id + "/" + d.sceneImage) + "' alt='synthetic scene'>" +
        boxes + "</div>" +
      "<div class='cap'>" + esc(d.sceneCaption) + "</div>" +
      "<ul class='detlist'>" + list + "</ul>" +

      "<div style='margin-top:12px;font-size:.8rem;color:var(--ink-soft)'>Confusion matrix — headline alert, on a labelled test set</div>" +
      "<div class='cm'>" +
        "<div class='hd'></div><div class='hd'>predicted&nbsp;hazard</div><div class='hd'>predicted&nbsp;clear</div>" +
        "<div class='hd'>actual hazard</div><div class='tp'>TP " + m.tp + "</div><div class='fn'>FN " + m.fn + "</div>" +
        "<div class='hd'>actual clear</div><div class='fp'>FP " + m.fp + "</div><div class='tn'>TN " + m.tn + "</div>" +
      "</div>" +
      "<div class='metrics'>" +
        "<span class='m'>precision <b>" + fmt(prec, 2) + "</b></span>" +
        "<span class='m'>recall <b>" + fmt(rec, 2) + "</b></span>" +
        "<span class='m'>false-alarm rate <b>" + fmt(far, 3) + "</b></span>" +
      "</div>" +
      "<div style='font-size:.8rem;color:var(--amber);margin-top:4px'>" + esc(cond.alertFatigueNote) + "</div>" +

      drawer(d.validation) +
      failureBox(d.failure);

    mount.querySelector("#vcond").addEventListener("input", function (e) {
      ui.visionCond = +e.target.value; renderVision(sc, mount);
    });
    mount.querySelector("#vbox").addEventListener("change", function (e) {
      ui.visionBoxes = e.target.checked; renderVision(sc, mount);
    });
  }

  /* ----------------------------------------------------------- PREDICTIVE -- */
  function renderPredictive(sc, mount) {
    var d = sc.predictive;
    var si = ui.predState;
    var st = d.states[si];
    var maxAbs = d.features.reduce(function (mx, f) { return Math.max(mx, Math.abs(f.contribution)); }, 0.001);

    var feats = d.features.map(function (f) {
      return "<li><span>" + esc(f.name) + "</span><span>" + esc(f.value) + "</span></li>";
    }).join("");

    var contrib = d.features.slice().sort(function (a, b) {
      return Math.abs(b.contribution) - Math.abs(a.contribution);
    }).map(function (f) {
      var w = Math.abs(f.contribution) / maxAbs * 48;
      var style = f.contribution >= 0
        ? "left:50%;width:" + w + "%"
        : "left:" + (50 - w) + "%;width:" + w + "%";
      return "<div class='row'><span>" + esc(f.name) + "</span>" +
        "<span class='track'><span class='mid'></span>" +
        "<i class='" + (f.contribution < 0 ? "neg" : "") + "' style='" + style + "'></i></span></div>";
    }).join("");

    mount.innerHTML =
      "<div class='ctl'><span>Scenario state</span>" +
        "<input type='range' min='0' max='" + (d.states.length - 1) + "' value='" + si + "' id='pstate'>" +
      "</div>" +
      "<div style='font-size:.82rem;color:var(--ink-soft);margin-bottom:8px'>" + esc(st.name) + "</div>" +
      "<div style='font-size:.8rem;color:var(--ink-soft)'>" + esc(d.target) + "</div>" +
      "<div class='prob'><span class='n'>" + pct(st.probability) + "%</span>" +
        "<span class='pill " + band(st.band) + "'>" + esc(st.band) + "</span></div>" +
      "<div class='state-note'>" + esc(st.note) + "</div>" +

      "<div style='font-size:.8rem;color:var(--ink-soft);margin-bottom:4px'>Features in</div>" +
      "<ul class='feat'>" + feats + "</ul>" +
      "<div class='contrib'><div style='color:var(--ink-soft);margin-bottom:4px'>" +
        "Why this score (weight of each factor — green pulls risk down)</div>" + contrib + "</div>" +

      drawer(d.validation) +
      failureBox(d.failure);

    mount.querySelector("#pstate").addEventListener("input", function (e) {
      ui.predState = +e.target.value; renderPredictive(sc, mount);
    });
  }

  /* ------------------------------------------------------------------ NLP -- */
  function renderNlp(sc, mount) {
    var d = sc.nlp;
    var variant = ui.nlpVariant; // "clean" | "poor"
    var thr = d.lowConfidenceThreshold;

    var rows = d.codes.map(function (c) {
      var cell = c[variant];
      var low = cell.conf < thr;
      var rc = cell.miscode ? "miscode" : (low ? "low" : "");
      var flag = cell.miscode
        ? "<div class='miscode-flag'>miscoded vs the clean write-up</div>"
        : (low ? "<div class='review-flag'>&rarr; below " + fmt(thr, 2) + ", route to a human coder</div>" : "");
      return "<tr class='" + rc + "'><td>" + esc(c.field) + "</td>" +
        "<td>" + esc(cell.value) + flag + "</td>" +
        "<td class='conf'>" + fmt(cell.conf, 2) + "</td></tr>";
    }).join("");

    mount.innerHTML =
      "<div class='ctl'><span>Narrative</span>" +
        "<span class='seg'>" +
          "<button data-v='clean' aria-pressed='" + (variant === "clean") + "'>written up properly</button>" +
          "<button data-v='poor' aria-pressed='" + (variant === "poor") + "'>as actually written</button>" +
        "</span></div>" +
      "<div class='narr'>" + esc(d.narratives[variant]) + "</div>" +
      "<table class='codes'><thead><tr><th>Field</th><th>Model's code</th><th>Conf.</th></tr></thead>" +
        "<tbody>" + rows + "</tbody></table>" +
      "<div class='chips'>" + d.contributingTags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" +
      drawer(d.validation) +
      failureBox(d.failure);

    Array.prototype.forEach.call(mount.querySelectorAll(".seg button"), function (b) {
      b.addEventListener("click", function () { ui.nlpVariant = b.getAttribute("data-v"); renderNlp(sc, mount); });
    });
  }

  /* ----------------------------------------------------------- GENERATIVE -- */
  function highlightIssues(paragraph, issues) {
    var html = esc(paragraph);
    (issues || []).forEach(function (iss) {
      var needle = esc(iss.text);
      var idx = html.indexOf(needle);
      if (idx === -1) return;
      var title = iss.tag + " — " + iss.why;
      html = html.slice(0, idx) +
        "<mark title=\"" + esc(title) + "\">" + needle + "</mark>" +
        html.slice(idx + needle.length);
    });
    return html;
  }

  function renderGenerative(sc, mount) {
    var d = sc.generative;
    var oi = ui.genOut;
    var out = d.outputs[oi];

    var draft = out.body.map(function (p) {
      return "<p>" + highlightIssues(p, out.issues) + "</p>";
    }).join("");

    var issues = (out.issues && out.issues.length)
      ? "<ul class='issue-list'>" + out.issues.map(function (i) {
          return "<li><span class='t'>" + esc(i.tag) + ".</span> " + esc(i.why) + "</li>";
        }).join("") + "</ul>"
      : "<div style='font-size:.82rem;color:var(--green);margin-top:8px'>No planted defects at this setting — but you still verify every line before use.</div>";

    var checks = d.reviewChecklist.map(function (c, i) {
      var on = ui.genChecks[i];
      return "<li><label><input type='checkbox' data-i='" + i + "' " + (on ? "checked" : "") + "> " + esc(c) + "</label></li>";
    }).join("");
    var allChecked = ui.genChecks.every(Boolean);

    mount.innerHTML =
      "<div class='ctl'><span>Creativity (temperature)</span>" +
        "<input type='range' min='0' max='" + (d.outputs.length - 1) + "' value='" + oi + "' id='gtemp'>" +
      "</div>" +
      "<div style='font-size:.82rem;color:var(--ink-soft);margin-bottom:8px'>" + esc(out.temperature) + "</div>" +
      "<div class='prompt'>" + esc(d.prompt) + "</div>" +
      "<div class='draft'>" + draft + "</div>" +
      issues +
      "<div style='font-size:.8rem;color:var(--amber);margin-top:10px'>" + esc(d.hallucinationRate) + "</div>" +

      "<div style='font-size:.8rem;color:var(--ink-soft);margin-top:12px'>Reviewer sign-off gate</div>" +
      "<ul class='checklist'>" + checks + "</ul>" +
      "<div class='signoff'>" +
        (ui.genSigned
          ? "<span class='done'>&#10003; Signed off &mdash; safe to circulate</span>"
          : "<button id='gsign' " + (allChecked ? "" : "disabled") + ">Sign off &amp; release</button>") +
      "</div>" +

      drawer(d.validation) +
      failureBox(d.failure);

    mount.querySelector("#gtemp").addEventListener("input", function (e) {
      ui.genOut = +e.target.value;
      ui.genSigned = false;
      ui.genChecks = d.reviewChecklist.map(function () { return false; }); // a new draft needs a fresh review
      renderGenerative(sc, mount);
    });
    Array.prototype.forEach.call(mount.querySelectorAll(".checklist input"), function (c) {
      c.addEventListener("change", function () {
        ui.genChecks[+c.getAttribute("data-i")] = c.checked;
        ui.genSigned = false;
        renderGenerative(sc, mount);
      });
    });
    var sign = mount.querySelector("#gsign");
    if (sign) sign.addEventListener("click", function () { ui.genSigned = true; renderGenerative(sc, mount); });
  }

  /* ------------------------------------------------------------ synthesis -- */
  function renderSynthesis(sc) {
    var rows = sc.synthesis.rows;
    var head = "<thead><tr><th></th><th>Computer vision</th><th>Predictive model</th><th>NLP classifier</th><th>Generative (LLM)</th></tr></thead>";
    var bodyRows = rows.map(function (r) {
      return "<tr><th>" + esc(r[0]) + "</th>" +
        r.slice(1).map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>";
    }).join("");
    el.synthesis.innerHTML =
      "<h2>One incident, four tools &mdash; the buyer's checklist</h2>" +
      "<p class='sub' style='margin:0 0 8px'>The takeaway: &ldquo;AI for HSE&rdquo; is never one thing. Each family has its own input, its own output, its own way to be validated, and its own way to fail.</p>" +
      "<table>" + head + "<tbody>" + bodyRows + "</tbody></table>";
  }

  /* --------------------------------------------------------------- driver -- */
  function load(id) {
    var sc = scenarios[id];
    if (!sc) return;

    ui = {
      visionCond: 0, visionBoxes: true,
      predState: 0,
      nlpVariant: "clean",
      genOut: 0, genChecks: sc.generative.reviewChecklist.map(function () { return false; }), genSigned: false
    };

    renderSituation(sc);

    el.grid.innerHTML = "";
    var pV = panel("vision", "Computer vision", sc.vision.engine, sc.vision.dayMap);
    var pP = panel("pred", "Predictive model", sc.predictive.engine, sc.predictive.dayMap);
    var pN = panel("nlp", "NLP classifier", sc.nlp.engine, sc.nlp.dayMap);
    var pG = panel("gen", "Generative (LLM)", sc.generative.engine, sc.generative.dayMap);
    [pV, pP, pN, pG].forEach(function (p) { el.grid.appendChild(p.root); });

    renderVision(sc, pV.content);
    renderPredictive(sc, pP.content);
    renderNlp(sc, pN.content);
    renderGenerative(sc, pG.content);
    renderSynthesis(sc);

    try { localStorage.setItem("s1.scenario", id); } catch (e) {}
  }

  /* scenario picker */
  manifest.forEach(function (m) {
    if (!scenarios[m.id]) return;
    var o = document.createElement("option");
    o.value = m.id; o.textContent = m.label;
    el.scenario.appendChild(o);
  });
  el.scenario.addEventListener("change", function () { load(el.scenario.value); });

  var start = manifest[0] && manifest[0].id;
  try {
    var saved = localStorage.getItem("s1.scenario");
    if (saved && scenarios[saved]) start = saved;
  } catch (e) {}
  el.scenario.value = start;
  load(start);

  /* theme toggle: system -> light -> dark -> system */
  var THEMES = ["system", "light", "dark"];
  function applyTheme(t) {
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    el.theme.textContent = "Theme: " + t;
  }
  var curTheme = "system";
  try { curTheme = localStorage.getItem("s1.theme") || "system"; } catch (e) {}
  applyTheme(curTheme);
  el.theme.addEventListener("click", function () {
    curTheme = THEMES[(THEMES.indexOf(curTheme) + 1) % THEMES.length];
    applyTheme(curTheme);
    try { localStorage.setItem("s1.theme", curTheme); } catch (e) {}
  });
})();
