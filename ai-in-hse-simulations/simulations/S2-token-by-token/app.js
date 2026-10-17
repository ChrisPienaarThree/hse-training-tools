/* ============================================================================
   S2 — LLM token-by-token generator.  Demo logic.

   No model runs. The candidate tokens and their `logit` values are pre-authored
   in the dataset files. What IS real here: the tokeniser, the
   softmax-with-temperature, the top-k truncation and the seeded sampling — so
   the sliders genuinely reshape the distribution and change the pick.
   ============================================================================ */
(function () {
  "use strict";

  var S2 = window.HSE_S2 || {};
  var scenarios = S2.scenarios || {};
  var manifest = S2.manifest ||
    Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });

  var el = {};
  var ui = null;
  var curId = null;

  /* ------------------------------------------------------------- maths etc -- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function softmax(logits, T) {
    var t = Math.max(T, 0.01);
    var scaled = logits.map(function (z) { return z / t; });
    var mx = Math.max.apply(null, scaled);
    var ex = scaled.map(function (s) { return Math.exp(s - mx); });
    var sum = ex.reduce(function (a, b) { return a + b; }, 0);
    return ex.map(function (e) { return e / sum; });
  }
  function argmax(a) { var mi = 0; for (var i = 1; i < a.length; i++) if (a[i] > a[mi]) mi = i; return mi; }
  function sampleIdx(probs, r) { var acc = 0; for (var i = 0; i < probs.length; i++) { acc += probs[i]; if (r < acc) return i; } return probs.length - 1; }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function entropyNorm(probs) {
    if (probs.length < 2) return 0;
    var h = 0;
    probs.forEach(function (p) { if (p > 0) h -= p * Math.log(p); });
    return h / Math.log(probs.length);
  }

  /* crude illustrative sub-word tokeniser (deterministic). Not a real BPE. */
  function tokenize(text) {
    if (!text) return [];
    var out = [];
    var runs = text.match(/\s+|\S+/g) || [];
    var pending = "";
    runs.forEach(function (r) {
      if (/^\s+$/.test(r)) { pending = " "; return; }
      var lead = pending; pending = "";
      var m = r.match(/^(\S*?)([.,;:!?)\]}"']+)$/);
      if (m && m[1]) { pushWord(out, lead, m[1]); for (var i = 0; i < m[2].length; i++) out.push(m[2][i]); }
      else if (m && !m[1]) { for (var j = 0; j < r.length; j++) out.push((j === 0 ? lead : "") + r[j]); }
      else { pushWord(out, lead, r); }
    });
    return out;
  }
  function pushWord(out, lead, w) {
    if (w.length > 9) {
      var k = 0, first = true;
      while (k < w.length) { out.push((first ? lead : "") + w.slice(k, k + 6)); k += 6; first = false; }
    } else out.push(lead + w);
  }
  function showTok(t) {
    return t.replace(/ /g, "<span class='sp'>·</span>");
  }

  /* --------------------------------------------------------------- context -- */
  function blocksNow(sc) {
    return [
      { id: "sys", label: "system prompt", tokens: tokenize(sc.system) },
      { id: "ref", label: "reference",     tokens: tokenize(sc.reference.title + "\n" + sc.reference.lines.join("\n")) },
      { id: "q",   label: "question",      tokens: tokenize(sc.question) },
      { id: "out", label: "generated",     tokens: ui.chosen.slice() }
    ];
  }
  function computeContext(sc) {
    var blocks = blocksNow(sc);
    var flat = [];
    blocks.forEach(function (b) { b.tokens.forEach(function (t) { flat.push(b.id); }); });
    var total = flat.length;
    var winStart = Math.max(0, total - ui.ctx);
    var gi = 0;
    blocks.forEach(function (b) {
      var start = gi, end = gi + b.tokens.length;
      var vis = 0;
      for (var i = start; i < end; i++) if (i >= winStart) vis++;
      b.status = vis === 0 ? "evicted" : vis === b.tokens.length ? "in" : "partial";
      b.visStart = start;
      gi = end;
    });
    ui._blocks = blocks;
    ui._winStart = winStart;
    ui._total = total;
    ui._refStatus = blocks[1].status;
  }

  /* ---------------------------------------------------------- distribution -- */
  function distribution(sc) {
    var step = sc.steps[ui.stepIdx];
    if (!step) return null;
    var refIn = ui._refStatus === "in";
    var cands = (refIn ? step.grounded : (step.ungrounded || step.grounded)).slice();
    cands.sort(function (a, b) { return b.logit - a.logit; });
    var k = Math.min(ui.topK, cands.length);
    var kept = cands.slice(0, k);
    var probs = softmax(kept.map(function (c) { return c.logit; }), ui.temp);
    var chosenIdx;
    if (ui.decoding === "greedy") chosenIdx = argmax(probs);
    else {
      var rng = mulberry32(((ui.seed >>> 0) ^ Math.imul(ui.stepIdx + 1, 2654435761)) >>> 0);
      chosenIdx = sampleIdx(probs, rng());
    }
    return { kept: kept, probs: probs, chosenIdx: chosenIdx, refIn: refIn,
             isFact: ui.stepIdx === sc.factStep, hasUngrounded: !!step.ungrounded };
  }

  function stepOnce() {
    var sc = scenarios[curId];
    if (ui.stepIdx >= sc.steps.length) return false;
    computeContext(sc);
    var d = distribution(sc);
    var tok = d.kept[d.chosenIdx].t;
    ui.chosen.push(tok);
    if (ui.stepIdx === sc.factStep) { ui.factRefIn = d.refIn; ui.factTok = tok; }
    ui.stepIdx++;
    return true;
  }
  function stopAuto() {
    if (ui.timer) { clearInterval(ui.timer); ui.timer = null; }
  }

  /* ------------------------------------------------------------- rendering -- */
  function paint() {
    var sc = scenarios[curId];
    computeContext(sc);
    var complete = ui.stepIdx >= sc.steps.length;
    var d = complete ? null : distribution(sc);

    /* --- prompt + context strip --- */
    var chips = "";
    ui._blocks.forEach(function (b) {
      b.tokens.forEach(function (t, i) {
        var evd = (b.visStart + i) < ui._winStart;
        chips += "<span class='tok " + b.id + (evd ? " evicted" : "") + "'>" + showTok(esc(t)) + "</span>";
      });
    });
    var badge = function (s) { return "<span class='badge " + s + "'>" + s.toUpperCase() + "</span>"; };
    el.stageL.innerHTML =
      "<h2>Prompt &amp; context window</h2>" +
      "<div class='ctxmeta'>" +
        "<span>context window <b>" + ui.ctx + "</b> / " + ui._maxCtx + " tokens</span>" +
        "<span>system " + badge(ui._blocks[0].status) + "</span>" +
        "<span>reference " + badge(ui._blocks[1].status) + "</span>" +
        "<span>question " + badge(ui._blocks[2].status) + "</span>" +
      "</div>" +
      "<div class='ctxstrip'><div class='tokens'>" + chips + "</div></div>" +
      "<div class='cap'>Struck-through tokens are outside the context window &mdash; the model cannot attend to them. " +
        "The fact step uses the <b>grounded</b> candidate set only while the reference reads <b>IN</b>; " +
        "otherwise it uses the <b>ungrounded</b> set.</div>" +
      "<div class='legend'>" +
        "<span><i style='background:var(--sys)'></i>system</span>" +
        "<span><i style='background:var(--ref)'></i>reference</span>" +
        "<span><i style='background:var(--q)'></i>question</span>" +
        "<span><i style='background:var(--out)'></i>generated</span>" +
      "</div>";

    /* --- bars + output + explain + verdict --- */
    var barsHtml;
    if (complete) {
      barsHtml = "<div class='stepline'>Generation complete &mdash; " + sc.steps.length +
        " tokens. Press <b>Reset</b> to run again.</div>";
    } else {
      var maxP = Math.max.apply(null, d.probs);
      var rows = d.kept.map(function (c, i) {
        var p = d.probs[i];
        var isKey = c.t.trim() === sc.reference.keyToken;
        return "<div class='bar" + (i === d.chosenIdx ? " chosen" : "") + (isKey ? " iskey" : "") + "'>" +
          "<span class='lbl'>" + showTok(esc(c.t)) + "</span>" +
          "<span class='track'><i style='width:" + Math.max(2, Math.round(p / maxP * 100)) + "%'></i></span>" +
          "<span class='pctv'>" + (p * 100).toFixed(1) + "%</span>" +
        "</div>";
      }).join("");
      var flat = entropyNorm(d.probs);
      var flatWord = flat < 0.35 ? "peaked" : flat < 0.75 ? "mixed" : "near-uniform";
      barsHtml =
        "<div class='stepline'>Step <b>" + (ui.stepIdx + 1) + "</b> of " + sc.steps.length +
          " &mdash; predicting the next token" +
          (d.isFact ? " &nbsp;<b style='color:var(--red)'>◀ fact-bearing step</b>" : "") + "<br>" +
          "candidate set: <b>" + (d.refIn ? "grounded" : "ungrounded") + "</b>" +
          (d.isFact && !d.refIn ? " &mdash; the real value is no longer the top token" : "") +
        "</div>" +
        "<div class='bars'>" + rows + "</div>" +
        "<div class='entropy'>distribution flatness <span class='em'>" + flat.toFixed(2) +
          "</span> (" + flatWord + ") &nbsp;·&nbsp; top-k = " + ui.topK + " of " +
          (d.refIn ? sc.steps[ui.stepIdx].grounded.length : (sc.steps[ui.stepIdx].ungrounded || sc.steps[ui.stepIdx].grounded).length) +
          " &nbsp;·&nbsp; temperature = " + ui.temp.toFixed(2) + "</div>";
    }

    var text = ui.chosen.join("").replace(/^ /, "");
    var outHtml = "<div class='output'>" + esc(text) + (complete ? "" : "<span class='cursor'></span>") + "</div>";

    var ex = explain(sc, complete);

    var verdict = "";
    if (complete) {
      var got = (ui.factTok || "").trim().replace(/[^0-9A-Za-z]/g, "");
      var want = sc.reference.keyToken.replace(/[^0-9A-Za-z]/g, "");
      if (got === want) {
        verdict = "<div class='verdict good'><b>Grounded &amp; correct</b>" +
          "The output states the reference value (“" + esc(sc.reference.keyFact) + "”). " +
          "The reference was in the context window and the temperature was low enough that the top token &mdash; " +
          "the one copied from the source &mdash; won.</div>";
      } else {
        verdict = "<div class='verdict bad'><b>Hallucination</b>" +
          "The model generated “" + esc((ui.factTok || "").trim()) + " …” where the reference says “" +
          esc(sc.reference.keyFact) + "”. " +
          (ui.factRefIn
            ? "The reference was in context, but temperature / sampling pushed the pick off the correct top token."
            : "The reference had been evicted from the context window, so the real value was simply not available and the model produced a plausible-sounding number with the same confidence.") +
          "</div>";
      }
    }

    el.stageR.innerHTML =
      "<h2>Next-token prediction</h2>" + barsHtml +
      "<h2 style='margin-top:16px'>Output so far</h2>" + outHtml +
      "<div class='explain'>" + ex + "</div>" + verdict;

    /* --- control state --- */
    el.step.disabled = complete;
    el.auto.disabled = complete;
    el.auto.textContent = ui.timer ? "Pause" : "Auto-run";
    el.seed.disabled = ui.decoding !== "sample";
    el.reroll.disabled = ui.decoding !== "sample";
    el.tempVal.textContent = ui.temp.toFixed(2);
    el.topkVal.textContent = ui.topK;
    el.ctxVal.textContent = ui.ctx;
  }

  function explain(sc, complete) {
    var t = ui.temp;
    var s1 = "<b>Temperature " + t.toFixed(2) + ".</b> " + (
      t < 0.45 ? "The distribution is sharp: the top token dominates, so generation is near-deterministic and copies whatever is in context."
      : t < 0.95 ? "Moderately peaked: the top token usually wins, but lower-ranked tokens have a real chance."
      : "Flattened: low-probability tokens are now viable, so the model improvises and can add detail that is not grounded.");
    var s2 = "<b>Top-k " + ui.topK + ".</b> " + (
      ui.topK <= 2 ? "Only the " + ui.topK + " highest-logit tokens are considered at all &mdash; temperature has almost no room to act."
      : ui.topK >= 10 ? "A wide candidate pool is in play before sampling."
      : "The candidate pool is trimmed to the " + ui.topK + " most likely tokens before the softmax.");
    var s3 = "<b>Context.</b> " + (
      ui._refStatus === "in" ? "The reference is fully in the window, so the real value is available to copy at the fact step."
      : ui._refStatus === "partial" ? "The reference is only partly in the window &mdash; the line carrying the fact may already be gone."
      : "The reference has been evicted: at the fact step the model cannot see the real value and must guess.");
    var s4 = "<b>Decoding.</b> " + (
      ui.decoding === "greedy" ? "Greedy &mdash; always take the argmax, so temperature only changes the result if it re-orders the top tokens."
      : "Sample (seed " + ui.seed + ") &mdash; draw from the distribution, so both temperature and the seed affect the pick.");
    return s1 + "<br>" + s2 + "<br>" + s3 + "<br>" + s4;
  }

  var EMB = [
    { w: "hazard", x: 17, y: 24 }, { w: "risk", x: 27, y: 17 }, { w: "danger", x: 21, y: 34 },
    { w: "glove", x: 73, y: 21 }, { w: "helmet", x: 83, y: 29 }, { w: "PPE", x: 69, y: 34 },
    { w: "permit", x: 44, y: 73 }, { w: "authorise", x: 56, y: 80 }, { w: "signature", x: 37, y: 83 },
    { w: "ppm", x: 85, y: 63 }, { w: "limit", x: 77, y: 72 }, { w: "exposure", x: 68, y: 62 }
  ];
  function renderStatic(sc) {
    var n = sc.notes;
    var dots = EMB.map(function (e) {
      return "<circle cx='" + e.x + "' cy='" + e.y + "' r='1.6'/>" +
        "<text x='" + (e.x + 3) + "' y='" + (e.y + 1) + "'>" + esc(e.w) + "</text>";
    }).join("");
    el.static.innerHTML =
      "<details class='drawer' open><summary>How this works (Day 1 &middot; Topic 2a)</summary><div class='dbody'>" +
        "<h3>Autoregressive generation</h3><p>" + esc(n.autoregressive) + "</p>" +
        "<h3>Embeddings</h3><p>" + esc(n.embeddings) + "</p>" +
        "<div class='embed'><svg viewBox='0 0 100 100' preserveAspectRatio='xMidYMid meet'>" + dots + "</svg>" +
          "<div class='cap'>Illustrative only &mdash; related HSE terms drawn close together. Real embeddings have hundreds of dimensions.</div></div>" +
        "<h3>Temperature</h3><p>" + esc(n.temperature) + "</p>" +
        "<h3>Context window</h3><p>" + esc(n.contextWindow) + "</p>" +
        "<h3>Hallucination</h3><p><span class='indep'>Independent evidence.</span> " + esc(n.hallucination) + "</p>" +
        "<h3>Keeping it grounded</h3><p>" + esc(sc.grounding) + "</p>" +
        "<h3>What is real in this demo</h3><p>The tokeniser, the softmax-with-temperature, the top-k cut and the seeded " +
          "sampling all run for real on the numbers you see. The <em>logits</em> themselves are pre-authored so the " +
          "lesson is reproducible &mdash; no language model runs on this page.</p>" +
      "</div></details>";
  }

  /* ---------------------------------------------------------------- wiring -- */
  function maxCtxFor(sc) {
    return tokenize(sc.system).length +
      tokenize(sc.reference.title + "\n" + sc.reference.lines.join("\n")).length +
      tokenize(sc.question).length + sc.steps.length + 4;
  }

  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    var sc = scenarios[id];
    var maxCtx = maxCtxFor(sc);
    var minCtx = 8; /* low enough to fully evict the reference (and then some) for the demo */
    ui = {
      temp: 0.30, topK: 8, ctx: maxCtx, decoding: "sample", seed: 7,
      stepIdx: 0, chosen: [], timer: null, factRefIn: null, factTok: null,
      _maxCtx: maxCtx
    };
    el.temp.value = ui.temp;
    el.topk.value = ui.topK;
    el.ctx.min = minCtx; el.ctx.max = maxCtx; el.ctx.value = maxCtx;
    el.seed.value = ui.seed;
    setDecoding("sample");
    if (el.scenario.value !== id) el.scenario.value = id;
    renderStatic(sc);
    paint();
    try { localStorage.setItem("s2.scenario", id); } catch (e) {}
  }

  function setDecoding(dmode) {
    ui.decoding = dmode;
    Array.prototype.forEach.call(el.decSeg.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-d") === dmode));
    });
  }

  function build() {
    el.scenario = document.getElementById("scenario");
    el.theme = document.getElementById("theme");
    el.controls = document.getElementById("controls");
    el.stageL = document.getElementById("stageL");
    el.stageR = document.getElementById("stageR");
    el.static = document.getElementById("static");

    manifest.forEach(function (m) {
      if (!scenarios[m.id]) return;
      var o = document.createElement("option");
      o.value = m.id; o.textContent = m.label;
      el.scenario.appendChild(o);
    });

    el.controls.innerHTML =
      "<div class='ctl'><label class='field' for='temp'>Temperature</label>" +
        "<div class='rangewrap'><input type='range' id='temp' min='0.1' max='1.5' step='0.05'>" +
        "<span class='val' id='tempVal'>0.30</span></div>" +
        "<div class='hint'>low = faithful / repetitive &nbsp;&middot;&nbsp; high = inventive</div></div>" +
      "<div class='ctl'><label class='field' for='topk'>Top-k</label>" +
        "<div class='rangewrap'><input type='range' id='topk' min='1' max='12' step='1'>" +
        "<span class='val' id='topkVal'>8</span></div>" +
        "<div class='hint'>how many candidate tokens are considered</div></div>" +
      "<div class='ctl'><label class='field' for='ctx'>Context window (tokens)</label>" +
        "<div class='rangewrap'><input type='range' id='ctx' min='8' max='200' step='1'>" +
        "<span class='val' id='ctxVal'>0</span></div>" +
        "<div class='hint'>drag left to push the reference out of view</div></div>" +
      "<div class='ctl'><label class='field'>Decoding</label>" +
        "<div class='seg' id='decSeg'>" +
          "<button data-d='greedy' aria-pressed='false'>greedy</button>" +
          "<button data-d='sample' aria-pressed='true'>sample</button>" +
        "</div>" +
        "<div class='hint'>greedy = always the top token</div></div>" +
      "<div class='ctl'><label class='field' for='seed'>Sample seed</label>" +
        "<div class='rangewrap'><input type='number' id='seed' min='0' step='1' style='width:8ch'>" +
        "<button class='ghost' id='reroll' type='button'>re-roll</button></div>" +
        "<div class='hint'>changes which token sampling draws</div></div>" +
      "<div class='ctl'><label class='field'>Run</label>" +
        "<div class='runbtns'>" +
          "<button class='primary' id='step' type='button'>Generate next token</button>" +
          "<button id='auto' type='button'>Auto-run</button>" +
          "<button class='ghost' id='reset' type='button'>Reset</button>" +
        "</div></div>";

    el.temp = document.getElementById("temp");
    el.topk = document.getElementById("topk");
    el.ctx = document.getElementById("ctx");
    el.seed = document.getElementById("seed");
    el.decSeg = document.getElementById("decSeg");
    el.reroll = document.getElementById("reroll");
    el.step = document.getElementById("step");
    el.auto = document.getElementById("auto");
    el.reset = document.getElementById("reset");
    el.tempVal = document.getElementById("tempVal");
    el.topkVal = document.getElementById("topkVal");
    el.ctxVal = document.getElementById("ctxVal");

    el.scenario.addEventListener("change", function () { stopAuto(); loadScenario(el.scenario.value); });
    el.temp.addEventListener("input", function () { ui.temp = +el.temp.value; el.tempVal.textContent = ui.temp.toFixed(2); paint(); });
    el.topk.addEventListener("input", function () { ui.topK = +el.topk.value; el.topkVal.textContent = ui.topK; paint(); });
    el.ctx.addEventListener("input", function () { ui.ctx = +el.ctx.value; el.ctxVal.textContent = ui.ctx; paint(); });
    el.seed.addEventListener("input", function () { ui.seed = Math.max(0, +el.seed.value || 0); paint(); });
    el.reroll.addEventListener("click", function () { ui.seed = (ui.seed + 1) >>> 0; el.seed.value = ui.seed; paint(); });
    Array.prototype.forEach.call(el.decSeg.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () { setDecoding(b.getAttribute("data-d")); paint(); });
    });
    el.step.addEventListener("click", function () { stepOnce(); paint(); });
    el.reset.addEventListener("click", function () { stopAuto(); ui.stepIdx = 0; ui.chosen = []; ui.factTok = null; ui.factRefIn = null; paint(); });
    el.auto.addEventListener("click", function () {
      if (ui.timer) { stopAuto(); paint(); return; }
      ui.timer = setInterval(function () { if (!stepOnce()) { stopAuto(); } paint(); }, 650);
      paint();
    });

    /* theme: system -> light -> dark */
    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) {
      if (t === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      el.theme.textContent = "Theme: " + t;
    }
    var cur = "system";
    try { cur = localStorage.getItem("s2.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () {
      cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      applyTheme(cur);
      try { localStorage.setItem("s2.theme", cur); } catch (e) {}
    });

    var start = manifest[0] && manifest[0].id;
    try { var s = localStorage.getItem("s2.scenario"); if (s && scenarios[s]) start = s; } catch (e) {}
    loadScenario(start);
  }

  /* this script is loaded at the end of <body>, so the DOM it needs already exists */
  build();
})();
