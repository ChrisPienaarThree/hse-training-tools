/* ============================================================================
   S6 — Ergonomic pose-estimation / lifting risk.  Demo logic.

   No pose model runs. The input ranges, the REBA lookup tables and the NIOSH
   multiplier tables are PRE-AUTHORED (standard published rubrics). Live and
   real: the joint-angle derivation, every band lookup, the REBA score, the
   NIOSH recommended weight limit and the lifting index — all computed from the
   sliders and checkable by hand.
   ============================================================================ */
(function () {
  "use strict";

  var S6 = window.HSE_S6 || {};
  var scenarios = S6.scenarios || {};
  var manifest = S6.manifest ||
    Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });

  var DUR = ["≤ 1 h", "≤ 2 h", "≤ 8 h"];
  var CPL = ["Good", "Fair", "Poor"];
  var el = {}, ui = null, curId = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function rad(d) { return d * Math.PI / 180; }
  function r1(x) { return (Math.round(x * 10) / 10).toFixed(1); }
  function r2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
  function sc() { return scenarios[curId]; }

  /* ------------------------------------------------- joint-angle derivation */
  function deriveAngles(v) {
    var b = sc().postureBias || {};
    var V = v.Vorigin_cm;
    var Hfrac = clamp((v.H_cm - 20) / 43, 0, 1);
    var loadFrac = clamp(v.load_kg / 25, 0, 1);
    var over = clamp((V - 100) / 75, 0, 1);
    var low = clamp((75 - V) / 75, 0, 1);
    var a = {
      trunk: clamp(5 + low * 62 + Hfrac * 22 + loadFrac * 8 + (b.trunk || 0), 0, 90),
      knee: clamp(low * 80 + (b.knee || 0), 0, 110),
      shoulder: clamp(8 + over * 115 + Hfrac * 28 + (b.shoulder || 0), 0, 170),
      neck: clamp(8 + low * 22 + over * 14 + (b.neck || 0), 0, 45),
      elbow: clamp(95 + Hfrac * 25 - low * 8 + (b.elbow || 0), 55, 140),
      wrist: clamp(6 + Hfrac * 14 + (v.coupling_idx === 2 ? 8 : 0) + (b.wrist || 0), 0, 40),
      twist: v.asym_deg
    };
    return a;
  }
  function angleErr() {
    var base = { trunk: 4, knee: 5, shoulder: 5, neck: 4, elbow: 6, wrist: 8 };
    var m = ui.view === "oblique" ? 2.3 : 1;
    var occ = ui.occluded ? { trunk: 3, knee: 6, shoulder: 2, neck: 3, elbow: 8, wrist: 10 } : {};
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = Math.round(base[k] * m + (occ[k] || 0)); });
    return out;
  }

  /* --------------------------------------------------------- REBA scoring -- */
  function bandTrunk(a, tw) { var s = a < 5 ? 1 : a < 20 ? 2 : a < 60 ? 3 : 4; if (tw >= 15) s += 1; return Math.min(s, 5); }
  function bandNeck(a, tw) { var s = a < 20 ? 1 : 2; if (tw >= 25) s += 1; return Math.min(s, 3); }
  function bandLegs(kn) { return Math.min(1 + (kn > 60 ? 2 : kn > 30 ? 1 : 0), 4); }
  function bandUA(a) { var s = a < 20 ? 1 : a < 45 ? 2 : a < 90 ? 3 : 4; if (a > 100) s += 1; return Math.min(s, 6); }
  function bandLA(el) { return (el >= 60 && el <= 100) ? 1 : 2; }
  function bandWr(a) { var s = a < 15 ? 1 : 2; if (a > 25) s += 1; return Math.min(s, 3); }

  function reba(ang, v) {
    var R = sc().reba;
    var trunk = bandTrunk(ang.trunk, ang.twist), neck = bandNeck(ang.neck, ang.twist), legs = bandLegs(ang.knee);
    var tA = R.tableA[(neck - 1) * 20 + (trunk - 1) * 4 + (legs - 1)];
    var force = (v.load_kg < 5 ? 0 : v.load_kg <= 10 ? 1 : 2) + (v.shock ? 1 : 0);
    var A = tA + force;
    var ua = bandUA(ang.shoulder), la = bandLA(ang.elbow), wr = bandWr(ang.wrist);
    var tB = R.tableB[(ua - 1) * 6 + (la - 1) * 3 + (wr - 1)];
    var coupling = v.coupling_idx;
    var B = tB + coupling;
    var tC = R.tableC[clamp(A, 1, 12) - 1][clamp(B, 1, 12) - 1];
    var activity = (v.static_hold ? 1 : 0) + (v.freq_per_min > 4 ? 1 : 0) + (v.shock ? 1 : 0);
    var score = tC + activity;
    var lvl = R.actionLevels.filter(function (L) { return score >= L.lo && score <= Math.max(L.hi, 15) && score <= L.hi; })[0]
           || R.actionLevels[R.actionLevels.length - 1];
    return {
      trunk: trunk, neck: neck, legs: legs, tA: tA, force: force, A: A,
      ua: ua, la: la, wr: wr, tB: tB, coupling: coupling, B: B,
      tC: tC, activity: activity, score: score, level: lvl
    };
  }
  function rebaScore(ang, v) { return reba(ang, v).score; }

  /* ---------------------------------------------------------------- NIOSH -- */
  function niosh(v) {
    var n = sc().niosh;
    var HM = v.H_cm > 63 ? 0 : 25 / clamp(v.H_cm, 25, 63);
    var VM = v.Vorigin_cm > 175 ? 0 : clamp(1 - 0.003 * Math.abs(v.Vorigin_cm - 75), 0, 1);
    var D = Math.max(25, Math.abs(v.Vorigin_cm - v.Vdest_cm));
    var DM = D > 175 ? 0 : clamp(0.82 + 4.5 / D, 0, 1);
    var AM = v.asym_deg > 135 ? 0 : clamp(1 - 0.0032 * v.asym_deg, 0, 1);
    var row = n.fmTable[0];
    n.fmTable.forEach(function (r) { if (r[0] <= v.freq_per_min) row = r; });
    var vLo = v.Vorigin_cm < 75 ? 0 : 1;
    var FM = row[v.duration_idx + 1][vLo];
    var CM = (n.cmTable[CPL[v.coupling_idx]] || [1, 1])[vLo];
    var RWL = n.LC * HM * VM * DM * AM * FM * CM;
    var LI = RWL > 0 ? v.load_kg / RWL : Infinity;
    var band = LI <= 1 ? { t: "ok", m: "Acceptable manual-handling demand for most healthy workers." }
            : LI <= 2 ? { t: "warn", m: "Raised risk for some workers — redesign advisable." }
            : LI <= 3 ? { t: "bad", m: "Substantial risk — redesign is a priority." }
            : { t: "bad", m: "Very high risk — should not be performed manually as designed." };
    return { HM: HM, VM: VM, DM: DM, AM: AM, FM: FM, CM: CM, LC: n.LC, RWL: RWL, LI: LI, band: band, D: D };
  }

  /* ------------------------------------------------------------- skeleton -- */
  function figure(ang) {
    var ax = 150, ay = 210, shin = 42, thigh = 42, torso = 54, ua = 30, fa = 28, neck = 12, headR = 8;
    var lowK = clamp(ang.knee / 110, 0, 1);
    var hipX = ax + lowK * 8, hipY = ay - (shin + thigh) + lowK * 46;
    var kneeX = (ax + hipX) / 2 + lowK * 12, kneeY = ay - shin + lowK * 20;
    var S = { x: hipX + torso * Math.sin(rad(ang.trunk)), y: hipY - torso * Math.cos(rad(ang.trunk)) };
    var Hd = { x: S.x + (neck + headR) * Math.sin(rad(ang.trunk + ang.neck * 0.5)),
               y: S.y - (neck + headR) * Math.cos(rad(ang.trunk + ang.neck * 0.5)) };
    var tArm = ang.shoulder;
    var E = { x: S.x + ua * Math.sin(rad(tArm)), y: S.y + ua * Math.cos(rad(tArm)) };
    var tFore = tArm + (180 - ang.elbow);
    var W = { x: E.x + fa * Math.sin(rad(tFore)), y: E.y + fa * Math.cos(rad(tFore)) };
    return { A: { x: ax, y: ay }, K: { x: kneeX, y: kneeY }, Hp: { x: hipX, y: hipY }, S: S, Hd: Hd, E: E, W: W, headR: headR };
  }
  function bones(f, cls) {
    var L = function (a, b) { return "<line class='" + cls + "' x1='" + a.x.toFixed(1) + "' y1='" + a.y.toFixed(1) + "' x2='" + b.x.toFixed(1) + "' y2='" + b.y.toFixed(1) + "'/>"; };
    return L(f.A, f.K) + L(f.K, f.Hp) + L(f.Hp, f.S) + L(f.S, f.Hd) + L(f.S, f.E) + L(f.E, f.W);
  }
  function skeletonSVG(ang, err) {
    var f = figure(ang);
    var gp = figure({
      trunk: ang.trunk + err.trunk, knee: ang.knee + err.knee, shoulder: ang.shoulder + err.shoulder,
      neck: ang.neck + err.neck, elbow: ang.elbow + err.elbow, wrist: ang.wrist + err.wrist, twist: ang.twist
    });
    var gm = figure({
      trunk: ang.trunk - err.trunk, knee: Math.max(0, ang.knee - err.knee), shoulder: ang.shoulder - err.shoulder,
      neck: Math.max(0, ang.neck - err.neck), elbow: ang.elbow - err.elbow, wrist: ang.wrist - err.wrist, twist: ang.twist
    });
    var lw = 10 + clamp( (ui.v.load_kg / 30), 0, 1) * 16;
    var svg = "<svg viewBox='0 0 300 240' preserveAspectRatio='xMidYMid meet'>";
    svg += "<line class='sk-ground' x1='40' y1='210' x2='260' y2='210'/>";
    svg += bones(gp, "sk-ghost") + bones(gm, "sk-ghost");
    svg += bones(f, "sk-bone");
    [f.A, f.K, f.Hp, f.S, f.E, f.W].forEach(function (p) { svg += "<circle class='sk-joint' cx='" + p.x.toFixed(1) + "' cy='" + p.y.toFixed(1) + "' r='3.2'/>"; });
    svg += "<circle class='sk-head' cx='" + f.Hd.x.toFixed(1) + "' cy='" + f.Hd.y.toFixed(1) + "' r='" + f.headR + "'/>";
    svg += "<rect class='sk-load' x='" + (f.W.x - lw / 2).toFixed(1) + "' y='" + (f.W.y - 4).toFixed(1) + "' width='" + lw.toFixed(1) + "' height='" + (lw * 0.7).toFixed(1) + "' rx='2'/>";
    svg += "<text class='sk-ang' x='" + (f.Hp.x + 8).toFixed(1) + "' y='" + f.Hp.y.toFixed(1) + "'>trunk " + Math.round(ang.trunk) + "°</text>";
    svg += "<text class='sk-ang' x='" + (f.K.x + 8).toFixed(1) + "' y='" + f.K.y.toFixed(1) + "'>knee " + Math.round(ang.knee) + "°</text>";
    svg += "<text class='sk-ang' x='" + (f.S.x + 8).toFixed(1) + "' y='" + f.S.y.toFixed(1) + "'>shldr " + Math.round(ang.shoulder) + "°</text>";
    return svg + "</svg>";
  }

  /* ------------------------------------------------------------- rendering */
  function paintDerived() {
    var v = ui.v, s = sc();
    var ang = deriveAngles(v), err = angleErr();
    var R = reba(ang, v), N = niosh(v);

    /* score range under CV uncertainty */
    var lo = rebaScore({ trunk: ang.trunk - err.trunk, knee: Math.max(0, ang.knee - err.knee), shoulder: ang.shoulder - err.shoulder, neck: Math.max(0, ang.neck - err.neck), elbow: ang.elbow - err.elbow, wrist: ang.wrist - err.wrist, twist: ang.twist }, v);
    var hi = rebaScore({ trunk: ang.trunk + err.trunk, knee: ang.knee + err.knee, shoulder: ang.shoulder + err.shoulder, neck: ang.neck + err.neck, elbow: ang.elbow + err.elbow, wrist: ang.wrist + err.wrist, twist: ang.twist }, v);
    var rMin = Math.min(lo, hi, R.score), rMax = Math.max(lo, hi, R.score);

    /* skeleton + angle chips */
    var chips = [["trunk", ang.trunk, err.trunk], ["knee", ang.knee, err.knee], ["shoulder", ang.shoulder, err.shoulder],
      ["neck", ang.neck, err.neck], ["elbow", ang.elbow, err.elbow], ["wrist", ang.wrist, err.wrist]].map(function (c) {
      return "<span class='angchip'>" + c[0] + " <b>" + Math.round(c[1]) + "°</b> <span class='err'>±" + c[2] + "°</span></span>";
    }).join("");
    el.skel.innerHTML =
      "<h2>Estimated posture (pose-estimation output)</h2>" +
      "<div class='skel'>" + skeletonSVG(ang, err) + "</div>" +
      "<div class='angles'>" + chips + "</div>" +
      "<div class='hint'>Solid = the model's best estimate. Dashed 'ghost' figures = the same posture at the edges of the joint-angle uncertainty for the current camera view.</div>";

    /* REBA card */
    var row = function (lbl, val, cls) { return "<tr class='" + (cls || "") + "'><td>" + lbl + "</td><td>" + val + "</td></tr>"; };
    el.reba.innerHTML =
      "<h2>REBA-style whole-body score</h2>" +
      "<div class='actionlevel " + R.level.tone + "'>" +
        "<span class='n'>" + R.score + "</span> &nbsp;<span class='b'>" + esc(R.level.band) + " risk</span>" +
        "<div class='a'>" + esc(R.level.action) + "</div>" +
        (rMax > rMin ? "<div class='a'>With the current camera-view uncertainty the score could be anywhere from <b>" + rMin + "</b> to <b>" + rMax + "</b> — a whole action level.</div>" : "") +
      "</div>" +
      "<table class='ws'>" +
        "<tr class='grp'><td>Group A</td><td>score</td></tr>" +
        row("Trunk &mdash; " + Math.round(ang.trunk) + "°" + (ang.twist >= 15 ? " + twist" : ""), R.trunk, "sub") +
        row("Neck &mdash; " + Math.round(ang.neck) + "°", R.neck, "sub") +
        row("Legs &mdash; knee " + Math.round(ang.knee) + "°", R.legs, "sub") +
        row("Table A", R.tA) +
        row("+ Force / load (" + r1(v.load_kg) + " kg" + (v.shock ? " + shock" : "") + ")", "+" + R.force, "sub") +
        row("Score A", R.A, "tot") +
        "<tr class='grp'><td>Group B</td><td>score</td></tr>" +
        row("Upper arm &mdash; " + Math.round(ang.shoulder) + "°", R.ua, "sub") +
        row("Lower arm &mdash; elbow " + Math.round(ang.elbow) + "°", R.la, "sub") +
        row("Wrist &mdash; " + Math.round(ang.wrist) + "°", R.wr, "sub") +
        row("Table B", R.tB) +
        row("+ Coupling (" + CPL[v.coupling_idx] + ")", "+" + R.coupling, "sub") +
        row("Score B", R.B, "tot") +
        "<tr class='grp'><td>Combine</td><td></td></tr>" +
        row("Table C [A " + R.A + "][B " + R.B + "]", R.tC) +
        row("+ Activity (static " + (v.static_hold ? 1 : 0) + ", freq&gt;4/min " + (v.freq_per_min > 4 ? 1 : 0) + ", jerky " + (v.shock ? 1 : 0) + ")", "+" + R.activity, "sub") +
        row("REBA score", R.score, "tot") +
      "</table>";

    /* NIOSH card */
    var mult = function (lbl, val) { return "<div class='mult'>" + lbl + "<b>" + r2(val) + "</b></div>"; };
    el.niosh.innerHTML =
      "<h2>NIOSH Lifting Equation</h2>" +
      "<div class='niosh'>" +
      "<div class='mults'>" +
        mult("HM &mdash; horizontal", N.HM) + mult("VM &mdash; vertical", N.VM) +
        mult("DM &mdash; distance", N.DM) + mult("AM &mdash; asymmetry", N.AM) +
        mult("FM &mdash; frequency", N.FM) + mult("CM &mdash; coupling", N.CM) +
      "</div>" +
      "<div class='eq'>RWL = " + N.LC + " × " + r2(N.HM) + " × " + r2(N.VM) + " × " + r2(N.DM) + " × " + r2(N.AM) +
        " × " + r2(N.FM) + " × " + r2(N.CM) + "\n    = <b>" + r1(N.RWL) + " kg</b>  (recommended weight limit)\n" +
        "Lifting Index = load / RWL = " + r1(v.load_kg) + " / " + r1(N.RWL) + " = <b>" +
        (isFinite(N.LI) ? r2(N.LI) : "∞") + "</b></div>" +
      "<div class='li " + N.band.t + "'>Lifting Index <b>" + (isFinite(N.LI) ? r2(N.LI) : "∞") + "</b> &mdash; " + esc(N.band.m) + "</div>" +
      "</div>";

    /* throughput + limitations */
    var perDay = Math.round(s.manual.workdayMin / s.manual.minutesPerAssessment);
    el.extra.innerHTML =
      "<div class='throughput'><b>" + s.manual.minutesPerAssessment + " min</b> per posture for a trained assessor &rarr; about <b>" +
      perDay + "</b> tasks per analyst-day, sampled. This model scores <b>every</b> lift, <b>every</b> worker, continuously &mdash; " +
      "so it is a triage tool: it points the ergonomist at the worst workstations. Each score is still a snapshot, not a shift's dose.</div>" +
      "<h3>What this score does not know</h3><ul class='limits'>" +
      s.limitations.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
  }

  /* -------------------------------------------------------------- wiring -- */
  function loadScenario(id) {
    if (!scenarios[id]) return;
    curId = id;
    var s = scenarios[id], I = s.inputs;
    ui = {
      v: {
        load_kg: I.load_kg.default, Vorigin_cm: I.Vorigin_cm.default, Vdest_cm: I.Vdest_cm.default,
        H_cm: I.H_cm.default, asym_deg: I.asym_deg.default, freq_per_min: I.freq_per_min.default,
        duration_idx: I.duration_idx.default, coupling_idx: I.coupling_idx.default,
        shock: !!I.shock.default, static_hold: !!I.static_hold.default
      },
      view: "front", occluded: false
    };
    if (el.scenario.value !== id) el.scenario.value = id;
    el.task.textContent = s.task;

    var sl = function (key, label, unit) {
      var c = I[key];
      return "<div class='inp' data-k='" + key + "'><div class='ih'><span>" + label + "</span>" +
        "<span class='iv'></span></div><input type='range' min='" + c.min + "' max='" + c.max + "' step='" + c.step + "'></div>";
    };
    el.inputs.innerHTML =
      sl("load_kg", "Load (kg)") +
      "<div class='inp' data-k='Vorigin_cm'><div class='ih'><span>Hand height at origin (cm)</span><span class='iv'></span></div>" +
        "<input type='range' min='" + I.Vorigin_cm.min + "' max='" + I.Vorigin_cm.max + "' step='" + I.Vorigin_cm.step + "'>" +
        "<div class='tick'><span>floor</span><span>knee</span><span>waist</span><span>shoulder</span><span>over</span></div></div>" +
      sl("Vdest_cm", "Hand height at destination (cm)") +
      sl("H_cm", "Horizontal reach (cm)") +
      sl("asym_deg", "Trunk twist / asymmetry (°)") +
      sl("freq_per_min", "Lift frequency (per min)") +
      "<div class='inp'><div class='ih'><span>Work duration</span></div><div class='seg' id='durSeg'>" +
        DUR.map(function (d, i) { return "<button data-i='" + i + "'>" + d + "</button>"; }).join("") + "</div></div>" +
      "<div class='inp'><div class='ih'><span>Hand coupling / grip</span></div><div class='seg' id='cplSeg'>" +
        CPL.map(function (d, i) { return "<button data-i='" + i + "'>" + d + "</button>"; }).join("") + "</div></div>" +
      "<div class='inp'><label class='chk'><input type='checkbox' id='shockChk'> Jerky / shock loading</label></div>" +
      "<div class='inp'><label class='chk'><input type='checkbox' id='holdChk'> Static hold &gt; 1 min</label></div>";

    ["load_kg", "Vorigin_cm", "Vdest_cm", "H_cm", "asym_deg", "freq_per_min"].forEach(function (key) {
      var wrap = el.inputs.querySelector("[data-k='" + key + "']");
      var inp = wrap.querySelector("input");
      inp.value = ui.v[key];
      wrap.querySelector(".iv").textContent = ui.v[key];
      inp.addEventListener("input", function () {
        ui.v[key] = +inp.value;
        wrap.querySelector(".iv").textContent = (key === "freq_per_min" || key === "load_kg") ? r1(+inp.value) : inp.value;
        paintDerived();
      });
    });
    var seg = function (segEl, key) {
      Array.prototype.forEach.call(segEl.querySelectorAll("button"), function (b, i) {
        b.setAttribute("aria-pressed", String(i === ui.v[key]));
        b.addEventListener("click", function () {
          ui.v[key] = +b.getAttribute("data-i");
          Array.prototype.forEach.call(segEl.querySelectorAll("button"), function (bb, j) { bb.setAttribute("aria-pressed", String(j === ui.v[key])); });
          paintDerived();
        });
      });
    };
    seg(el.inputs.querySelector("#durSeg"), "duration_idx");
    seg(el.inputs.querySelector("#cplSeg"), "coupling_idx");
    var sk = el.inputs.querySelector("#shockChk"); sk.checked = ui.v.shock;
    sk.addEventListener("change", function () { ui.v.shock = sk.checked; paintDerived(); });
    var hd = el.inputs.querySelector("#holdChk"); hd.checked = ui.v.static_hold;
    hd.addEventListener("change", function () { ui.v.static_hold = hd.checked; paintDerived(); });

    setView("front"); el.occChk.checked = false;

    el.static.innerHTML =
      "<details class='drawer' open><summary>How this works (Day 2 &middot; Topic 4)</summary><div class='dbody'>" +
      "<p><b>The pipeline.</b> " + esc(s.notes.how) + "</p>" +
      "<p><b>The transparent half.</b> " + esc(s.notes.rubric) + "</p>" +
      "<p><b>The value.</b> " + esc(s.notes.value) + "</p>" +
      "<p><b>The limits.</b> " + esc(s.notes.limits) + "</p>" +
      "<p><b>What is real in this demo.</b> " + esc(s.notes.real) + "</p>" +
      "</div></details>";

    paintDerived();
    try { localStorage.setItem("s6.scenario", id); } catch (e) {}
  }

  function setView(v) {
    ui.view = v;
    Array.prototype.forEach.call(el.viewSeg.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === v));
    });
  }

  function build() {
    el.scenario = document.getElementById("scenario");
    el.theme = document.getElementById("theme");
    el.task = document.getElementById("task");
    el.inputs = document.getElementById("inputs");
    el.viewSeg = document.getElementById("viewSeg");
    el.occChk = document.getElementById("occChk");
    el.skel = document.getElementById("skel");
    el.reba = document.getElementById("reba");
    el.niosh = document.getElementById("niosh");
    el.extra = document.getElementById("extra");
    el.static = document.getElementById("static");

    manifest.forEach(function (m) {
      if (!scenarios[m.id]) return;
      var o = document.createElement("option");
      o.value = m.id; o.textContent = m.label;
      el.scenario.appendChild(o);
    });
    el.scenario.addEventListener("change", function () { loadScenario(el.scenario.value); });
    Array.prototype.forEach.call(el.viewSeg.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () { setView(b.getAttribute("data-v")); paintDerived(); });
    });
    el.occChk.addEventListener("change", function () { ui.occluded = el.occChk.checked; paintDerived(); });

    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) {
      if (t === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      el.theme.textContent = "Theme: " + t;
    }
    var cur = "system";
    try { cur = localStorage.getItem("s6.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () {
      cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      applyTheme(cur);
      try { localStorage.setItem("s6.theme", cur); } catch (e) {}
    });

    var start = manifest[0] && manifest[0].id;
    try { var st = localStorage.getItem("s6.scenario"); if (st && scenarios[st]) start = st; } catch (e) {}
    loadScenario(start);
  }

  build();
})();
