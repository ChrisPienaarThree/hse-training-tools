/* ============================================================================
   S11 — AI-assisted incident investigation.  Demo logic.

   No model runs. The narrative, every drafted section, the similar-incident
   search results and the repository are PRE-AUTHORED. Live and real:
   checking a case reference against the repository, your review checkboxes,
   the include/exclude decision, and the finalize gate.
   ============================================================================ */
(function () {
  "use strict";

  var S11 = window.HSE_S11 || {};
  var scenarios = S11.scenarios || {};
  var manifest = S11.manifest ||
    Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });

  var CHECK_KEYS = ["timeline", "immediate", "root", "contributing", "actions", "exec"];
  var el = {}, ui = null, curId = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function sc() { return scenarios[curId]; }

  function draftBadge(text) { return "<div class='draftbadge'>" + esc(text) + "</div>"; }
  function chk(key, label) {
    var on = ui.checks[key];
    return "<label class='reviewchk'><input type='checkbox' data-chk='" + key + "' " + (on ? "checked" : "") + "> " + esc(label) + "</label>";
  }

  /* --------------------------------------------------------------- sections */
  function sectionTimeline(s) {
    var rows = s.timeline.map(function (t) {
      return "<li><span class='t'>" + esc(t.time) + "</span><span>" + esc(t.event) +
        "<span class='tag " + (t.inferred ? "inferred" : "stated") + "'>" + (t.inferred ? "inferred" : "stated") + "</span>" +
        (t.note ? "<span class='note'>" + esc(t.note) + "</span>" : "") + "</span></li>";
    }).join("");
    return "<div class='card'>" + draftBadge("Draft — investigator must verify") +
      "<h2>Timeline</h2><ul class='tline'>" + rows + "</ul>" +
      chk("timeline", "I have reviewed this timeline, including the inferred entries, against the evidence.") + "</div>";
  }
  function sectionCauses(s) {
    var rows = s.immediateCauses.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
    return "<div class='card'>" + draftBadge("Draft") + "<h2>Immediate causes</h2><ul class='itemlist'>" + rows + "</ul>" +
      chk("immediate", "I have reviewed the immediate causes.") + "</div>";
  }
  function sectionRoot(s) {
    var rc = s.rootCauses.map(function (r) { return "<div class='rc'><div class='cat'>" + esc(r.category) + "</div>" + esc(r.text) + "</div>"; }).join("");
    var whys = "<ol class='whys'>" + s.fiveWhys.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ol>";
    return "<div class='card'>" + draftBadge("Draft") + "<h2>Root causes</h2>" + rc +
      "<h3>Five whys</h3>" + whys +
      chk("root", "I have reviewed the root-cause categorisation and the five-whys chain.") + "</div>";
  }
  function sectionContrib(s) {
    var rows = s.contributingFactors.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
    return "<div class='card'>" + draftBadge("Draft") + "<h2>Contributing factors</h2><ul class='itemlist'>" + rows + "</ul>" +
      chk("contributing", "I have reviewed the contributing factors.") + "</div>";
  }
  function sectionActions(s) {
    var rows = s.correctiveActions.map(function (a) {
      return "<tr><td>" + esc(a.text) + "</td><td>" + esc(a.rootCauseLink) + "</td><td>" + esc(a.timeframe) + "</td></tr>";
    }).join("");
    return "<div class='card'>" + draftBadge("Draft") + "<h2>Draft corrective actions</h2>" +
      "<table class='actionstbl'><thead><tr><th>Action</th><th>Linked root cause</th><th>Timeframe</th></tr></thead><tbody>" + rows + "</tbody></table>" +
      chk("actions", "I have reviewed these actions — each still needs an owner assigned before it leaves draft.") + "</div>";
  }
  function sectionExec(s) {
    return "<div class='card'>" + draftBadge("Draft") + "<h2>Executive summary</h2>" +
      "<div class='execbox'>" + esc(s.execSummaryDraft) + "</div>" +
      chk("exec", "I have reviewed and, where needed, corrected this summary.") + "</div>";
  }
  function sectionSimilar(s) {
    var items = s.similarIncidents.map(function (item, i) {
      var st = ui.simState[i], verifyHtml;
      if (!st.checked) {
        verifyHtml = "<div class='verify'><button data-verify='" + i + "' type='button'>Check repository</button></div>";
      } else if (st.verdict === "real") {
        var repo = s.repository.filter(function (r) { return r.ref === item.ref; })[0];
        verifyHtml = "<div class='verdict real'>&#10003; Verified &mdash; matches repository record: <b>" + esc(repo.title) +
          "</b> (" + esc(repo.date) + "). " + esc(repo.summary) + "</div>";
      } else {
        verifyHtml = "<div class='verdict fake'>&#10007; No record found for " + esc(item.ref) + " in the repository.</div>";
      }
      var incHtml = st.checked
        ? "<label class='inc'><input type='checkbox' data-inc='" + i + "' " + (st.include ? "checked" : "") + "> Include in report</label>"
        : "";
      return "<div class='simcard" + (st.checked && !st.include ? " excluded" : "") + "'>" +
        "<div class='sh'><span class='ref'>" + esc(item.ref) + "</span></div>" +
        "<div>" + esc(item.desc) + "</div><div class='sim'>Why the AI matched it: " + esc(item.similarity) + "</div>" +
        verifyHtml + incHtml + "</div>";
    }).join("");
    return "<div class='card'>" + draftBadge("Draft — verify against the repository") +
      "<h2>Similar past incidents (AI search)</h2>" + items + "</div>";
  }

  function renderGate(s) {
    if (ui.finalized) {
      var excluded = ui.simState.filter(function (st) { return st.checked && !st.include; }).length;
      var kept = s.similarIncidents.length - excluded;
      el.gate.innerHTML = "<div class='gate ok'><span class='status'>&#10003; Report " + esc(s.incidentRef) + " finalized.</span>" +
        kept + " of " + s.similarIncidents.length + " AI-drafted similar incidents retained; " + excluded +
        " removed as unverifiable or not relevant. All sections reviewed by the investigator.</div>";
      return;
    }
    var checksMissing = CHECK_KEYS.filter(function (k) { return !ui.checks[k]; }).length;
    var simPending = ui.simState.filter(function (st) { return !st.checked; }).length;
    var fakeIncluded = ui.simState.filter(function (st) { return st.checked && st.verdict === "fake" && st.include; }).length;
    var blocked = checksMissing > 0 || simPending > 0 || fakeIncluded > 0;
    var missing = [];
    if (checksMissing > 0) missing.push(checksMissing + " section review checkbox(es)");
    if (simPending > 0) missing.push(simPending + " similar-incident(s) not yet checked against the repository");
    if (fakeIncluded > 0) missing.push(fakeIncluded + " unverifiable similar incident still marked 'include in report'");
    el.gate.innerHTML = "<div class='gate'>" +
      "<span class='status'>" + (missing.length ? "Still needed: " + esc(missing.join("; ")) + "." : "Ready to finalize.") + "</span>" +
      "<button class='primary' id='finalizeBtn' type='button' " + (blocked ? "disabled" : "") + ">Finalize investigation report</button></div>";
  }

  function render() {
    var s = sc();
    el.sections.innerHTML =
      sectionTimeline(s) + sectionCauses(s) + sectionRoot(s) + sectionContrib(s) +
      sectionActions(s) + sectionExec(s) + sectionSimilar(s);
    renderGate(s);
  }

  /* -------------------------------------------------------------- wiring -- */
  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    var s = scenarios[id];
    ui = {
      checks: { timeline: false, immediate: false, root: false, contributing: false, actions: false, exec: false },
      simState: s.similarIncidents.map(function () { return { checked: false, verdict: null, include: true }; }),
      finalized: false
    };
    if (el.scenario.value !== id) el.scenario.value = id;

    el.narrative.innerHTML = "<div class='ref'>" + esc(s.incidentRef) + " &mdash; investigation draft</div>" +
      "<p>" + esc(s.narrative) + "</p>";

    el.callouts.innerHTML = [
      ["The COMET pattern", s.callouts.comet],
      ["Draft, everywhere", s.callouts.draftEverywhere],
      ["The fabricated case", s.callouts.fabricatedCase],
      ["Inferred vs stated", s.callouts.inferredVsStated],
      ["Still a human's judgement", s.callouts.humanJudgement]
    ].map(function (c) { return "<div class='callout'><b>" + c[0] + ".</b> " + esc(c[1]) + "</div>"; }).join("");

    el.static.innerHTML =
      "<details class='drawer' open><summary>How this works (Day 3 &middot; Topic 2)</summary><div class='dbody'>" +
      "<p><b>What it is.</b> " + esc(s.notes.what) + "</p>" +
      "<p><b>The finalize gate.</b> " + esc(s.notes.gate) + "</p>" +
      "<p><b>What is real in this demo.</b> " + esc(s.notes.real) + "</p>" +
      "</div></details>";

    render();
    try { localStorage.setItem("s11.scenario", id); } catch (e) {}
  }

  function build() {
    el.scenario = document.getElementById("scenario");
    el.theme = document.getElementById("theme");
    el.narrative = document.getElementById("narrative");
    el.sections = document.getElementById("sections");
    el.gate = document.getElementById("gate");
    el.callouts = document.getElementById("callouts");
    el.static = document.getElementById("static");

    manifest.forEach(function (m) {
      if (!scenarios[m.id]) return;
      var o = document.createElement("option");
      o.value = m.id; o.textContent = m.label;
      el.scenario.appendChild(o);
    });
    el.scenario.addEventListener("change", function () { loadScenario(el.scenario.value); });

    el.sections.addEventListener("change", function (e) {
      var c = e.target.closest("input[data-chk]");
      if (c) { ui.checks[c.getAttribute("data-chk")] = c.checked; render(); return; }
      var inc = e.target.closest("input[data-inc]");
      if (inc) { ui.simState[+inc.getAttribute("data-inc")].include = inc.checked; render(); }
    });
    el.sections.addEventListener("click", function (e) {
      var v = e.target.closest("button[data-verify]");
      if (!v) return;
      var idx = +v.getAttribute("data-verify");
      var s = sc(), item = s.similarIncidents[idx];
      var real = s.repository.some(function (r) { return r.ref === item.ref; });
      ui.simState[idx].checked = true;
      ui.simState[idx].verdict = real ? "real" : "fake";
      render();
    });
    el.gate.addEventListener("click", function (e) {
      var b = e.target.closest("#finalizeBtn");
      if (b && !b.disabled) { ui.finalized = true; renderGate(sc()); }
    });

    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) {
      if (t === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      el.theme.textContent = "Theme: " + t;
    }
    var cur = "system";
    try { cur = localStorage.getItem("s11.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () {
      cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      applyTheme(cur);
      try { localStorage.setItem("s11.theme", cur); } catch (e) {}
    });

    var start = manifest[0] && manifest[0].id;
    try { var st = localStorage.getItem("s11.scenario"); if (st && scenarios[st]) start = st; } catch (e) {}
    loadScenario(start);
  }

  build();
})();
