/* ============================================================================
   S9 — AI-assisted HAZOP co-pilot.  Demo logic.

   No model runs. Every deviation's candidate causes, consequences, expected
   safeguards and site-specific "human catch" are PRE-AUTHORED. Live and real:
   your verification checklist, your own team's additions, the review gate,
   and the running HAZOP worksheet + tallies.
   ============================================================================ */
(function () {
  "use strict";

  var S9 = window.HSE_S9 || {};
  var scenarios = S9.scenarios || {};
  var manifest = S9.manifest ||
    Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });

  var el = {}, ui = null, curId = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function sc() { return scenarios[curId]; }
  function deviation(id) { return sc().deviations.filter(function (d) { return d.id === id; })[0]; }

  function stateFor(devId) {
    if (!ui.perDev[devId]) ui.perDev[devId] = { flagDecisions: {}, safeChecks: {}, teamAdds: [], revealed: false, reviewed: false };
    return ui.perDev[devId];
  }
  function gapCount(dev) { return dev.aiSafeguards.filter(function (s) { return s.status !== "present-verified"; }).length; }
  function teamCount(dev, st) { return st.teamAdds.length + dev.humanAdds.causes.length + dev.humanAdds.safeguards.length; }

  /* --------------------------------------------------------------- render -- */
  function render() {
    var s = sc(), dev = deviation(ui.devId), st = stateFor(ui.devId);

    el.devstatement.innerHTML =
      "<span class='devtag'>" + esc(dev.guideWord) + " / " + esc(dev.parameter) + "</span>" +
      "<div class='devstatement'>" + esc(dev.statement) + "</div>";

    /* -------- AI pane -------- */
    var causesHTML = dev.aiCauses.map(function (c, i) {
      if (!c.reviewFlag) return "<li>" + esc(c.text) + "</li>";
      var dec = st.flagDecisions[i];
      return "<li class='flag'>" + esc(c.text) +
        "<div class='flagnote'>&#9888; " + esc(c.flagNote) + "</div>" +
        "<div class='flagbtns'>" +
        "<button data-flag='" + i + "' data-d='accept' aria-pressed='" + (dec === "accept") + "'>Accept</button>" +
        "<button data-flag='" + i + "' data-d='reject' aria-pressed='" + (dec === "reject") + "'>Reject</button>" +
        "</div></li>";
    }).join("");
    var consHTML = dev.aiConsequences.map(function (c) { return "<li>" + esc(c.text) + "</li>"; }).join("");
    var safeHTML = dev.aiSafeguards.map(function (sg, i) {
      var checked = !!st.safeChecks[i];
      var cls = sg.status === "present-verified" ? "v" : sg.status === "present-unverified" ? "u" : "m";
      var pillTxt = sg.status === "present-verified" ? "verified" : sg.status === "present-unverified" ? "unverified" : "missing";
      var lbl = sg.status === "missing" ? "I've raised an action to install / confirm this" : "I've verified this myself";
      return "<div class='safeguard'><div class='sh'><span>" + esc(sg.text) + "</span><span class='pill " + cls + "'>" + pillTxt + "</span></div>" +
        (sg.note ? "<div class='snote'>" + esc(sg.note) + "</div>" : "") +
        "<label class='chk'><input type='checkbox' data-safe='" + i + "' " + (checked ? "checked" : "") + "> " + lbl + "</label></div>";
    }).join("");

    el.left.innerHTML =
      "<h2>AI co-pilot suggests</h2>" +
      "<h3>Candidate causes</h3><ul class='itemlist'>" + causesHTML + "</ul>" +
      "<h3>Candidate consequences</h3><ul class='itemlist'>" + consHTML + "</ul>" +
      "<h3>Expected safeguards</h3>" + safeHTML;

    /* -------- team pane -------- */
    var teamHTML = st.teamAdds.map(function (t, i) {
      return "<li>" + esc(t) + " <button class='ghost' data-rm='" + i + "' style='float:right;padding:1px 8px'>&times;</button></li>";
    }).join("");
    var revealHTML;
    if (st.revealed) {
      var hc = dev.humanAdds.causes.length ? "<div>Causes:</div><ul>" + dev.humanAdds.causes.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" : "";
      var hs = dev.humanAdds.safeguards.length ? "<div>Safeguard verification:</div><ul>" + dev.humanAdds.safeguards.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" : "";
      revealHTML = "<div class='reveal'><div class='rh'>What a site team caught</div>" + hc + hs +
        "<div class='summary'>" + esc(dev.humanAdds.summary) + "</div></div>";
    } else {
      revealHTML = "<button class='revealbtn ghost' id='revealBtn' type='button'>Reveal what a site team caught</button>";
    }

    var flaggedIdx = dev.aiCauses.map(function (c, i) { return c.reviewFlag ? i : -1; }).filter(function (i) { return i >= 0; });
    var flagPending = flaggedIdx.filter(function (i) { return !st.flagDecisions[i]; }).length;
    var uncheckedSafe = dev.aiSafeguards.filter(function (sg, i) { return !st.safeChecks[i]; }).length;
    var needsReveal = !st.revealed;
    var blocked = flagPending > 0 || uncheckedSafe > 0 || needsReveal;

    var gateHTML;
    if (st.reviewed) {
      gateHTML = "<div class='gate ok'><span class='status'>&#10003; Reviewed and added to the worksheet.</span></div>";
    } else {
      var missing = [];
      if (needsReveal) missing.push("look at what the site team caught");
      if (flagPending > 0) missing.push(flagPending + " AI suggestion(s) to accept/reject");
      if (uncheckedSafe > 0) missing.push(uncheckedSafe + " safeguard(s) to verify or action");
      gateHTML = "<div class='gate'>" +
        "<span class='status'>" + (missing.length ? "Still needed: " + esc(missing.join("; ")) + "." : "Ready to close out.") + "</span>" +
        "<button class='primary' id='gateBtn' " + (blocked ? "disabled" : "") + " type='button'>Mark this deviation reviewed</button></div>";
    }

    el.right.innerHTML =
      "<h2>Your team's pass</h2>" +
      "<div class='addrow'><input type='text' id='addInput' placeholder='Add a cause, consequence or safeguard note your team spotted...'>" +
      "<button id='addBtn' type='button'>Add</button></div>" +
      "<ul class='itemlist teamlist'>" + teamHTML + "</ul>" +
      revealHTML + gateHTML;

    renderWorksheet();
  }

  function renderWorksheet() {
    var s = sc();
    var reviewed = s.deviations.filter(function (d) { return ui.perDev[d.id] && ui.perDev[d.id].reviewed; });
    var totalGaps = 0, totalTeam = 0;
    var rows = reviewed.map(function (d) {
      var st = ui.perDev[d.id];
      var gaps = gapCount(d);
      var rejected = Object.keys(st.flagDecisions).filter(function (k) { return st.flagDecisions[k] === "reject"; }).length;
      var tc = teamCount(d, st);
      totalGaps += gaps; totalTeam += tc;
      return "<tr><td>" + esc(d.guideWord + " / " + d.parameter) +
        "<div style='color:var(--ink-soft);font-size:.78rem'>" + esc(d.statement) + "</div></td>" +
        "<td class='num'>" + d.aiCauses.length + "</td><td class='num'>" + d.aiConsequences.length + "</td>" +
        "<td class='num'>" + gaps + "</td><td class='num'>" + tc + "</td><td class='num'>" + rejected + "</td></tr>";
    }).join("");

    el.worksheet.innerHTML =
      "<h2>HAZOP worksheet so far</h2>" +
      "<div class='tallies'>" +
      "<span class='t'>Deviations reviewed <b>" + reviewed.length + " / " + s.deviations.length + "</b></span>" +
      "<span class='t'>Safeguard gaps raised <b>" + totalGaps + "</b></span>" +
      "<span class='t'>Your team's own additions <b>" + totalTeam + "</b></span></div>" +
      (rows
        ? "<table class='worksheet'><thead><tr><th>Deviation</th><th>AI causes</th><th>AI consequences</th>" +
          "<th>Safeguard gaps</th><th>Team additions</th><th>AI causes rejected</th></tr></thead><tbody>" + rows + "</tbody></table>"
        : "<div style='font-size:.86rem;color:var(--ink-soft)'>No deviations marked reviewed yet.</div>");
  }

  /* -------------------------------------------------------------- wiring -- */
  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    var s = scenarios[id];
    ui = { devId: s.deviations[0].id, perDev: {} };
    if (el.scenario.value !== id) el.scenario.value = id;

    el.node.innerHTML = "<div class='nn'>" + esc(s.node) + "</div><div class='nc'>" + esc(s.nodeContext) + "</div>";
    el.screened.innerHTML = "<div>Screened out (not credible for this node):</div><table>" +
      s.screenedOut.map(function (x) {
        return "<tr><td class='gw'>" + esc(x.gw) + " / " + esc(x.param) + "</td><td>" + esc(x.reason) + "</td></tr>";
      }).join("") + "</table>";

    el.devpick.innerHTML = "<label class='field' for='devSel'>Deviation</label><select id='devSel'>" +
      s.deviations.map(function (d) {
        return "<option value='" + d.id + "'>" + esc(d.guideWord + " / " + d.parameter + " — " + d.statement) + "</option>";
      }).join("") + "</select>";
    document.getElementById("devSel").addEventListener("change", function (e) { ui.devId = e.target.value; render(); });

    el.callouts.innerHTML = [
      ["Breadth, fast", s.callouts.breadth],
      ["Local knowledge", s.callouts.localKnowledge],
      ["A narrow, checkable space", s.callouts.narrowSpace],
      ["Verify, don't just identify", s.callouts.verifyNotIdentify],
      ["Still needs the room", s.callouts.stillNeedsTheRoom]
    ].map(function (c) { return "<div class='callout'><b>" + c[0] + ".</b> " + esc(c[1]) + "</div>"; }).join("");

    el.static.innerHTML =
      "<details class='drawer' open><summary>How this works (Day 2 &middot; Topic 6; also Topic 2)</summary><div class='dbody'>" +
      "<p><b>What it is.</b> " + esc(s.notes.what) + "</p>" +
      "<p><b>Credible deviations.</b> " + esc(s.notes.credible) + "</p>" +
      "<p><b>The review gate.</b> " + esc(s.notes.gate) + "</p>" +
      "<p><b>What is real in this demo.</b> " + esc(s.notes.real) + "</p>" +
      "</div></details>";

    render();
    try { localStorage.setItem("s9.scenario", id); } catch (e) {}
  }

  function build() {
    el.scenario = document.getElementById("scenario");
    el.theme = document.getElementById("theme");
    el.node = document.getElementById("node");
    el.screened = document.getElementById("screened");
    el.devpick = document.getElementById("devpick");
    el.devstatement = document.getElementById("devstatement");
    el.left = document.getElementById("left");
    el.right = document.getElementById("right");
    el.worksheet = document.getElementById("worksheet");
    el.callouts = document.getElementById("callouts");
    el.static = document.getElementById("static");

    manifest.forEach(function (m) {
      if (!scenarios[m.id]) return;
      var o = document.createElement("option");
      o.value = m.id; o.textContent = m.label;
      el.scenario.appendChild(o);
    });
    el.scenario.addEventListener("change", function () { loadScenario(el.scenario.value); });

    /* delegated handlers — attached once, survive el.left/el.right re-renders */
    el.left.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-flag]");
      if (!b) return;
      stateFor(ui.devId).flagDecisions[+b.getAttribute("data-flag")] = b.getAttribute("data-d");
      render();
    });
    el.left.addEventListener("change", function (e) {
      var c = e.target.closest("input[data-safe]");
      if (!c) return;
      stateFor(ui.devId).safeChecks[+c.getAttribute("data-safe")] = c.checked;
      render();
    });
    el.right.addEventListener("click", function (e) {
      if (e.target.closest("#addBtn")) {
        var inp = document.getElementById("addInput"), v = inp.value.trim();
        if (v) { stateFor(ui.devId).teamAdds.push(v); render(); }
        return;
      }
      var rm = e.target.closest("button[data-rm]");
      if (rm) { stateFor(ui.devId).teamAdds.splice(+rm.getAttribute("data-rm"), 1); render(); return; }
      if (e.target.closest("#revealBtn")) { stateFor(ui.devId).revealed = true; render(); return; }
      var gb = e.target.closest("#gateBtn");
      if (gb && !gb.disabled) { stateFor(ui.devId).reviewed = true; render(); }
    });
    el.right.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target && e.target.id === "addInput") {
        e.preventDefault();
        document.getElementById("addBtn").click();
      }
    });

    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) {
      if (t === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      el.theme.textContent = "Theme: " + t;
    }
    var cur = "system";
    try { cur = localStorage.getItem("s9.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () {
      cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      applyTheme(cur);
      try { localStorage.setItem("s9.theme", cur); } catch (e) {}
    });

    var start = manifest[0] && manifest[0].id;
    try { var st = localStorage.getItem("s9.scenario"); if (st && scenarios[st]) start = st; } catch (e) {}
    loadScenario(start);
  }

  build();
})();
