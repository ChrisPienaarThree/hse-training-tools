/* ============================================================================
   S3 — Grounded vs ungrounded.  Demo logic.

   No model runs. Both answers, and every claim verdict/note, are pre-authored
   in the dataset files. This script tallies the claims, renders the two panes,
   wires the citation chips and the review gate, and keeps the scoreboard.
   ============================================================================ */
(function () {
  "use strict";

  var S3 = window.HSE_S3 || {};
  var scenarios = S3.scenarios || {};
  var manifest = S3.manifest ||
    Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });

  var el = {};
  var ui = null;
  var curId = null;

  var WRONG = ["unsupported", "contradicts", "fabricated"];
  var PILL = {
    supported: "quoted", partly: "part invented", unsupported: "unsupported",
    contradicts: "contradicts source", fabricated: "fabricated ref",
    hedge: "bounded", gap: "outside snippet", inference: "inference — check"
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function isWrong(v) { return WRONG.indexOf(v) >= 0; }
  function needsAction(c, side) {
    return isWrong(c.verdict) || c.verdict === "partly" || (side === "gr" && c.verdict === "inference");
  }
  function tally(claims) {
    var t = { total: claims.length, supported: 0, partly: 0, wrong: 0, info: 0, infer: 0 };
    claims.forEach(function (c) {
      if (c.verdict === "supported") t.supported++;
      else if (c.verdict === "partly") t.partly++;
      else if (isWrong(c.verdict)) t.wrong++;
      else if (c.verdict === "hedge" || c.verdict === "gap") t.info++;
      else if (c.verdict === "inference") t.infer++;
    });
    t.hallucPct = t.total ? Math.round((t.wrong + 0.5 * t.partly) / t.total * 100) : 0;
    return t;
  }

  /* --------------------------------------------------------- pane pieces -- */
  function claimRow(c, idx, side) {
    var acked = side === "un" ? !!ui.ackUn[idx] : !!ui.ackGr[idx];
    var na = needsAction(c, side);
    var chip = c.cite ? " <span class='cite' data-para='" + c.cite + "'>&para;" + c.cite + "</span>" : "";
    var label = c.verdict === "inference" ? "Acknowledge inference" : "Mark externally verified";
    var btn = na
      ? "<div class='act'><button data-ack='" + side + ":" + idx + "'>" + (acked ? "&#10003; done" : esc(label)) + "</button></div>"
      : "";
    return "<li class='claim" + (acked ? " done" : "") + "' data-v='" + c.verdict + "'>" +
      "<div class='top'><span class='pill'>" + esc(PILL[c.verdict] || c.verdict) + "</span>" + chip + "</div>" +
      "<div class='ctext'>" + esc(c.text) + "</div>" +
      "<div class='note'>" + esc(c.note) + "</div>" + btn + "</li>";
  }
  function proseBlock(claims) {
    return "<div class='prose'>" + claims.map(function (c) {
      return "<span class='s' data-v='" + c.verdict + "'>" + esc(c.text) + "</span>";
    }).join(" ") + "</div>";
  }
  function meter(t, side, sc) {
    var pct = t.hallucPct;
    if (side === "un") {
      return "<div class='meter'><div class='track'><i class='ung' style='width:" + pct + "%'></i></div>" +
        "<div class='cap'><b>" + (t.wrong + t.partly) + " of " + t.total + "</b> lines are wrong or part-invented (" + pct + "%). " +
        "Independent base rate for this familiarity: <b>" + esc(sc.ungrounded.baseRate[ui.fam]) + "</b> &mdash; " +
        "lower, but the model never marks which lines.</div></div>";
    }
    return "<div class='meter'><div class='track'><i class='grd' style='width:" + pct + "%'></i></div>" +
      "<div class='cap'><b>" + t.supported + " of " + t.total + "</b> lines quoted from the extract with a clause reference. " +
      "Flagged for a human: <b>" + t.infer + "</b> inference line" + (t.infer === 1 ? "" : "s") + ". " +
      "Wrong or invented: <b>" + (t.wrong + t.partly) + "</b>.</div></div>";
  }
  function gate(side, claims, t) {
    var need, done, effort;
    if (side === "un") {
      need = t.wrong + t.partly;
      done = claims.filter(function (c, i) { return needsAction(c, "un") && ui.ackUn[i]; }).length;
      effort = "&#8776; " + (need * 4) + " min external verification (~4 min/line). Lines that contradict a standard " +
        "the model never had cannot really be closed here at all.";
    } else {
      need = t.wrong + t.partly + t.infer;
      done = claims.filter(function (c, i) { return needsAction(c, "gr") && ui.ackGr[i]; }).length;
      effort = "&#8776; " + Math.max(1, Math.round(need * 0.5)) + " min: open each cited clause and confirm.";
    }
    var approved = side === "un" ? ui.approvedUn : ui.approvedGr;
    if (approved) {
      return "<div class='gate ok'>&#10003; Approved &mdash; <b>" + need + "</b> line" + (need === 1 ? "" : "s") +
        " signed off" + (side === "un" ? " on manual external check" : " against the cited clauses") + ". Caveats recorded.</div>";
    }
    var blocked = done < need;
    var status = need === 0
      ? "Nothing flagged &mdash; still read it once against the source."
      : blocked
        ? (need - done) + " of " + need + " flagged line" + (need - done === 1 ? "" : "s") + " still to " +
          (side === "un" ? "check against a standard the model never saw" : "confirm against the cited clause") + "."
        : "All " + need + " flagged line" + (need === 1 ? "" : "s") + " cleared.";
    return "<div class='gate" + (blocked ? " blocked" : "") + "'>" +
      "<span class='status'>" + status + "</span>" +
      "<div class='effort'>" + effort + "</div>" +
      "<button data-approve='" + side + "'" + (blocked ? " disabled" : "") + ">Approve for use</button></div>";
  }

  function sourceBox(sc) {
    var n = sc.source.paragraphs.length;
    var snip = ui.src === "snippet" ? sc.source.snippetParas : n;
    var html = "";
    sc.source.paragraphs.forEach(function (p, i) {
      var num = i + 1;
      if (ui.src === "snippet" && num === snip + 1) {
        html += "<div class='withheld-mark'>&para;" + (snip + 1) + " onward &mdash; not supplied to the model</div>";
      }
      var cls = "para" + (num > snip ? " withheld" : "") + (ui.hl === num ? " hl" : "");
      html += "<div class='" + cls + "'><span class='pn'>&para;" + num + "</span><span>" + esc(p) + "</span></div>";
    });
    return "<div class='srcbox'>" + html + "</div>";
  }

  function pane(side, sc) {
    var isUn = side === "un";
    var claims = isUn ? sc.ungrounded.variants[ui.fam].claims
                      : (ui.src === "full" ? sc.grounded.full : sc.grounded.snippet);
    var t = tally(claims);
    var prose = isUn ? ui.proseUn : ui.proseGr;
    var shape = isUn
      ? "No source text in the prompt &mdash; the model answers from training.<br>Familiarity: <b>" +
        esc(sc.ungrounded.variants[ui.fam].familiarity) + "</b>"
      : (ui.src === "full"
          ? "The full extract is pasted into the prompt; the model is told to answer only from it."
          : "Only paragraphs 1&ndash;" + sc.source.snippetParas + " are pasted into the prompt.");
    return "<section class='pane' data-kind='" + (isUn ? "ung" : "grd") + "'>" +
      "<header><div class='kind'>" + (isUn ? "Ungrounded" : "Grounded") + "</div>" +
        "<div class='shape'>" + shape + "</div></header>" +
      "<div class='body'>" +
        (isUn ? "" : sourceBox(sc)) +
        meter(t, side, sc) +
        (prose ? proseBlock(claims) : "<ul class='claims'>" +
          claims.map(function (c, i) { return claimRow(c, i, side); }).join("") + "</ul>") +
        "<button class='togglelink' data-prose='" + side + "'>" +
          (prose ? "show claim-by-claim audit" : "read as a paragraph") + "</button>" +
        gate(side, claims, t) +
      "</div></section>";
  }

  /* ----------------------------------------------------------- scoreboard -- */
  function effortText(side, t) {
    return side === "un"
      ? "~" + ((t.wrong + t.partly) * 4) + " min, external"
      : "~" + Math.max(1, Math.round((t.wrong + t.partly + t.infer) * 0.5)) + " min, in-source";
  }
  function wrongCell(t) { return t.wrong + (t.partly ? " (+" + t.partly + " partial)" : ""); }

  function scoreboard(sc) {
    var un = tally(sc.ungrounded.variants[ui.fam].claims);
    var gf = tally(sc.grounded.full);
    var gs = tally(sc.grounded.snippet);
    var rows = [
      ["Answer lines", un.total, gf.total, gs.total],
      ["Correct / supported", un.supported, gf.supported, gs.supported],
      ["Correctly says &ldquo;not in the source&rdquo;", un.info, gf.info, gs.info],
      ["Inference &mdash; needs a human tick", un.infer, gf.infer, gs.infer],
      ["Wrong, contradictory or fabricated", wrongCell(un), wrongCell(gf), wrongCell(gs)],
      ["Hallucination-ish rate", "<span class='big'>" + un.hallucPct + "%</span>",
        "<span class='big'>" + gf.hallucPct + "%</span>", "<span class='big'>" + gs.hallucPct + "%</span>"],
      ["Reviewer effort to sign off", effortText("un", un), effortText("gr", gf), effortText("gr", gs)]
    ];
    return "<div class='scoreboard'><h2>Scoreboard &mdash; same model, same question</h2>" +
      "<table><thead><tr><th></th>" +
        "<th>Ungrounded (familiarity " + (ui.fam + 1) + "/3)</th>" +
        "<th>Grounded &mdash; full</th><th>Grounded &mdash; snippet</th></tr></thead><tbody>" +
      rows.map(function (r) {
        return "<tr><th>" + r[0] + "</th><td>" + r[1] + "</td><td>" + r[2] + "</td><td>" + r[3] + "</td></tr>";
      }).join("") +
      "</tbody></table>" +
      "<p class='sub' style='margin:10px 0 0'>The only thing that changed between the columns is whether the " +
      "source text was in the prompt, and how much of it.</p></div>";
  }

  /* -------------------------------------------------------------- render -- */
  function paint() {
    var sc = scenarios[curId];
    var showUn = ui.view !== "grd", showGr = ui.view !== "ung";
    var panesCls = (showUn && showGr) ? "panes" : "panes one";
    el.stage.innerHTML =
      "<div class='" + panesCls + "'>" +
        (showUn ? pane("un", sc) : "") +
        (showGr ? pane("gr", sc) : "") +
      "</div>" +
      scoreboard(sc);

    if (ui.hl != null) {
      var h = el.stage.querySelector(".para.hl");
      if (h && h.scrollIntoView) h.scrollIntoView({ block: "nearest" });
    }

    el.qtext.textContent = sc.question;
    /* sync controls */
    setSeg(el.viewSeg, ui.view);
    setSeg(el.srcSeg, ui.src);
    el.fam.value = ui.fam;
  }

  function renderStatic(sc) {
    var n = sc.notes;
    el.static.innerHTML =
      "<details class='drawer' open><summary>How this works (Day 1 &middot; Topic 2a; also Day 3 T2, Day 4 T1/T6)</summary><div class='dbody'>" +
        "<h3>Retrieval grounding</h3><p>" + esc(n.grounding) + "</p>" +
        "<h3>A verifiable output format</h3><p>" + esc(n.verifiableFormat) + "</p>" +
        "<h3>The mandatory review gate</h3><p>" + esc(n.reviewGate) + "</p>" +
        "<h3>Hallucination rate</h3><p><span class='indep'>Independent evidence.</span> " + esc(n.hallucination) + "</p>" +
        "<h3>What is real in this demo</h3><p>Nothing is generated here. Both answers and every verdict are " +
          "pre-authored so the lesson is stable. The tallies, the review-gate logic and the scoreboard are computed live.</p>" +
      "</div></details>";
  }

  /* -------------------------------------------------------------- wiring -- */
  function setSeg(seg, val) {
    Array.prototype.forEach.call(seg.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === val));
    });
  }

  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    ui = {
      view: "both", fam: 1, src: "full",
      ackUn: {}, ackGr: {}, proseUn: false, proseGr: false,
      hl: null, approvedUn: false, approvedGr: false
    };
    if (el.scenario.value !== id) el.scenario.value = id;
    el.fam.max = scenarios[id].ungrounded.variants.length - 1;
    renderStatic(scenarios[id]);
    paint();
    try { localStorage.setItem("s3.scenario", id); } catch (e) {}
  }

  function build() {
    el.scenario = document.getElementById("scenario");
    el.theme = document.getElementById("theme");
    el.qtext = document.getElementById("qtext");
    el.controls = document.getElementById("controls");
    el.stage = document.getElementById("stage");
    el.static = document.getElementById("static");

    manifest.forEach(function (m) {
      if (!scenarios[m.id]) return;
      var o = document.createElement("option");
      o.value = m.id; o.textContent = m.label;
      el.scenario.appendChild(o);
    });

    el.controls.innerHTML =
      "<div><label class='field'>View</label>" +
        "<div class='seg' id='viewSeg'>" +
          "<button data-v='both' aria-pressed='true'>Side by side</button>" +
          "<button data-v='ung' aria-pressed='false'>Ungrounded</button>" +
          "<button data-v='grd' aria-pressed='false'>Grounded</button>" +
        "</div></div>" +
      "<div><label class='field' for='fam'>Topic familiarity (ungrounded)</label>" +
        "<div class='rangewrap'><span style='font-size:.75rem;color:var(--ink-soft)'>common</span>" +
        "<input type='range' id='fam' min='0' max='2' step='1'>" +
        "<span style='font-size:.75rem;color:var(--ink-soft)'>niche</span></div>" +
        "<div class='hint'>swaps the ungrounded answer &amp; its base-rate estimate</div></div>" +
      "<div><label class='field'>Source given to the grounded model</label>" +
        "<div class='seg' id='srcSeg'>" +
          "<button data-v='full' aria-pressed='true'>Full extract</button>" +
          "<button data-v='snippet' aria-pressed='false'>Snippet only</button>" +
        "</div>" +
        "<div class='hint'>&ldquo;snippet&rdquo; withholds the later paragraphs</div></div>";

    el.viewSeg = document.getElementById("viewSeg");
    el.srcSeg = document.getElementById("srcSeg");
    el.fam = document.getElementById("fam");

    el.scenario.addEventListener("change", function () { loadScenario(el.scenario.value); });
    Array.prototype.forEach.call(el.viewSeg.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () { ui.view = b.getAttribute("data-v"); paint(); });
    });
    Array.prototype.forEach.call(el.srcSeg.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () {
        ui.src = b.getAttribute("data-v"); ui.ackGr = {}; ui.approvedGr = false; ui.hl = null; paint();
      });
    });
    el.fam.addEventListener("input", function () {
      ui.fam = +el.fam.value; ui.ackUn = {}; ui.approvedUn = false; ui.proseUn = false; paint();
    });

    /* delegated clicks inside the stage */
    el.stage.addEventListener("click", function (e) {
      var cite = e.target.closest(".cite");
      if (cite) { ui.hl = +cite.getAttribute("data-para"); paint(); return; }
      var ack = e.target.closest("button[data-ack]");
      if (ack) {
        var parts = ack.getAttribute("data-ack").split(":");
        var store = parts[0] === "un" ? ui.ackUn : ui.ackGr;
        var k = +parts[1];
        if (store[k]) delete store[k]; else store[k] = true;
        paint(); return;
      }
      var pr = e.target.closest("button[data-prose]");
      if (pr) {
        if (pr.getAttribute("data-prose") === "un") ui.proseUn = !ui.proseUn;
        else ui.proseGr = !ui.proseGr;
        paint(); return;
      }
      var ap = e.target.closest("button[data-approve]");
      if (ap) {
        if (ap.getAttribute("data-approve") === "un") ui.approvedUn = true;
        else ui.approvedGr = true;
        paint(); return;
      }
    });

    /* theme: system -> light -> dark */
    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) {
      if (t === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      el.theme.textContent = "Theme: " + t;
    }
    var cur = "system";
    try { cur = localStorage.getItem("s3.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () {
      cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      applyTheme(cur);
      try { localStorage.setItem("s3.theme", cur); } catch (e) {}
    });

    var start = manifest[0] && manifest[0].id;
    try { var s = localStorage.getItem("s3.scenario"); if (s && scenarios[s]) start = s; } catch (e) {}
    loadScenario(start);
  }

  build();
})();
