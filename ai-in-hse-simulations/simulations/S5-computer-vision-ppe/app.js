/* ============================================================================
   S5 — Computer-vision PPE & hazard detection.  Demo logic.

   No vision model runs. Each detector's ideal TPR/FPR/confidence, the
   condition-effect coefficients and the ground-truth event windows are
   PRE-AUTHORED. app.js runs a real seeded stochastic detector per frame and
   computes the confusion matrix, every metric and the alert-fatigue curve
   from the outcomes. Same seed + same settings => same run.
   ============================================================================ */
(function () {
  "use strict";

  var S5 = window.HSE_S5 || {};
  var scenarios = S5.scenarios || {};
  var manifest = S5.manifest ||
    Object.keys(scenarios).map(function (id) { return { id: id, label: scenarios[id].label || id }; });

  var el = {};
  var ui = null;
  var curId = null;
  var RUN = null;
  var curCond = { lighting: 0, blur: 0, occlusion: 0, weather: 0 };

  /* --------------------------------------------------------------- utils -- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function sc() { return scenarios[curId]; }
  function det(key) { return sc().detectors.filter(function (d) { return d.key === key; })[0]; }
  function detLabel(key) { var d = det(key); return d ? d.label : key; }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hstr(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function hash3(seed, f, kh) {
    return (Math.imul(seed >>> 0, 2654435761) ^ Math.imul(f + 1, 40503) ^ kh) >>> 0;
  }
  function gauss(rng, m, s) {
    var u = Math.max(rng(), 1e-9), v = rng();
    return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* ---------------------------------------------------- scene interpretation */
  function flagOn(s, name, f) {
    var wins = (s.scene.flags && s.scene.flags[name]) || [];
    for (var i = 0; i < wins.length; i++) if (f >= wins[i][0] && f <= wins[i][1]) return true;
    return false;
  }
  function gtOn(s, key, f) {
    var b = s.scene.gt[key];
    if (!b || !b.flags || !b.flags.length) return false;
    for (var i = 0; i < b.flags.length; i++) if (flagOn(s, b.flags[i], f)) return true;
    return false;
  }
  function posAt(m, f) {
    var t = m.f1 === m.f0 ? 1 : (f - m.f0) / (m.f1 - m.f0);
    t = clamp(t, 0, 1);
    return [m.from[0] + (m.to[0] - m.from[0]) * t, m.from[1] + (m.to[1] - m.from[1]) * t];
  }
  function world(s, f) {
    var mById = {};
    s.scene.motion.forEach(function (m) { mById[m.id] = m; });
    var w = {
      w1: mById.w1 ? posAt(mById.w1, f) : null,
      w2: mById.w2 ? posAt(mById.w2, f) : null,
      forklift: null,
      zone: s.scene.shapes.zone || null,
      spill: s.scene.shapes.spill || null,
      platform: s.scene.shapes.platform || null,
      racks: !!s.scene.shapes.racks,
      floorY: s.scene.shapes.floorY,
      ppe: {}
    };
    var fk = mById.forklift;
    if (fk && f >= fk.f0) w.forklift = posAt(fk, f);
    ["w1", "w2"].forEach(function (id) {
      if (!w[id]) return;
      w.ppe[id] = {
        hard_hat: !flagOn(s, id + ".hard_hat_missing", f),
        vest: !flagOn(s, id + ".vest_missing", f),
        gloves: !flagOn(s, id + ".gloves_missing", f),
        atHeight: flagOn(s, id + ".at_height", f),
        harness: !flagOn(s, id + ".no_harness", f)
      };
    });
    var hc = s.scene.headcount.base;
    (s.scene.headcount.plusWhenFlag || []).forEach(function (fl) { if (flagOn(s, fl, f)) hc += 1; });
    w.headcount = hc;
    return w;
  }
  function anchorBox(s, key, f, w, rng) {
    var spec = s.scene.gt[key].anchor;
    if (Array.isArray(spec)) spec = spec[0];
    var jit = 2 + 6 * (curCond.blur || 0);
    function J() { return (rng() * 2 - 1) * jit; }
    if (spec === "rect:zone" && w.zone) {
      var z = w.zone;
      return [z[0] + 5 + J(), z[1] + 5 + J(), Math.min(58, z[2] - 10), Math.min(46, z[3] - 10)];
    }
    if (spec === "pt:spill" && w.spill) return [w.spill[0] - 16 + J(), w.spill[1] - 9 + J(), 32, 18];
    if (spec && spec.indexOf("between:") === 0 && w.w1 && w.forklift) {
      var ax = Math.min(w.w1[0], w.forklift[0]) - 6, bx = Math.max(w.w1[0], w.forklift[0]) + 6;
      return [ax + J(), Math.min(w.w1[1], w.forklift[1]) - 26 + J(), bx - ax, 50];
    }
    var wk = w[spec] || w.w1 || w.w2;
    if (!wk) return [180 + J(), 120 + J(), 24, 40];
    if (key === "hard_hat") return [wk[0] - 11 + J(), wk[1] - 32 + J(), 22, 20];
    if (key === "gloves") return [wk[0] - 16 + J(), wk[1] - 4 + J(), 32, 14];
    return [wk[0] - 12 + J(), wk[1] - 10 + J(), 24, 32];
  }
  function fpBox(rng) { return [20 + rng() * 340, 40 + rng() * 180, 18 + rng() * 22, 18 + rng() * 24]; }

  /* ------------------------------------------------------------- simulate -- */
  function simulate() {
    var s = sc(), N = s.frames, active = ui.active, cond = ui.cond, thr = ui.threshold;
    var site = ui.site === "elsewhere";
    var serious = {}; s.seriousDetectors.forEach(function (k) { serious[k] = true; });
    curCond = cond;

    var eff = {};
    s.detectors.forEach(function (d) {
      var tprMul = 1, fprMul = 1, confAdd = 0;
      Object.keys(s.conditions).forEach(function (k) {
        var c = s.conditions[k], v = cond[k] || 0;
        tprMul *= (1 + c.tpr * v); fprMul *= (1 + c.fpr * v); confAdd += c.conf * v;
      });
      if (site) { tprMul *= s.siteMismatch.tpr; fprMul *= s.siteMismatch.fpr; confAdd += s.siteMismatch.conf; }
      eff[d.key] = {
        tpr: clamp(d.baseTPR * tprMul, 0.03, 0.99),
        fpr: clamp(d.baseFPR * fprMul, 0.001, 0.85),
        confMean: d.confMean + confAdd, confSd: d.confSd
      };
    });

    var keys = ["all"].concat(s.detectors.map(function (d) { return d.key; }));
    var frames = [], alerts = [];
    for (var f = 0; f < N; f++) {
      var w = world(s, f), boxes = [], tally = {};
      keys.forEach(function (k) { tally[k] = { tp: 0, fp: 0, fn: 0, tn: 0 }; });
      s.detectors.forEach(function (d) {
        if (!active[d.key]) return;
        var e = eff[d.key], rng = mulberry32(hash3(ui.seed, f, hstr(d.key)));
        var g = gtOn(s, d.key, f), tp = 0, fp = 0, fn = 0, tn = 0;
        if (g) {
          if (rng() < e.tpr) {
            var c1 = clamp(gauss(rng, e.confMean, e.confSd), 0.01, 0.995);
            if (c1 >= thr) { tp = 1; boxes.push({ det: d.key, kind: "TP", conf: c1, box: anchorBox(s, d.key, f, w, rng) }); }
            else fn = 1;
          } else fn = 1;
        }
        if (rng() < e.fpr) {
          var c2 = clamp(gauss(rng, e.confMean, e.confSd), 0.01, 0.995);
          if (c2 >= thr) { fp = 1; boxes.push({ det: d.key, kind: "FP", conf: c2, box: fpBox(rng) }); }
        }
        if (!g && !fp) tn = 1;
        var t = tally[d.key]; t.tp += tp; t.fp += fp; t.fn += fn; t.tn += tn;
        var ta = tally.all; ta.tp += tp; ta.fp += fp; ta.fn += fn; ta.tn += tn;
        if (tp) alerts.push({ f: f, det: d.key, kind: "TP", serious: !!serious[d.key] });
        if (fp) alerts.push({ f: f, det: d.key, kind: "FP", serious: !!serious[d.key] });
      });
      var rc = mulberry32(hash3(ui.seed, f, 99177));
      var noiseP = clamp(0.04 + 0.45 * ((cond.lighting + cond.occlusion + cond.weather) / 3) + (site ? 0.15 : 0), 0, 0.8);
      var mc = w.headcount + (rc() < noiseP ? (rc() < 0.5 ? -1 : 1) : 0);
      frames.push({ w: w, boxes: boxes, tally: tally, headcount: w.headcount, modelCount: Math.max(0, mc) });
    }

    var cum = [], running = {};
    keys.forEach(function (k) { running[k] = { tp: 0, fp: 0, fn: 0, tn: 0 }; });
    for (var i = 0; i < N; i++) {
      keys.forEach(function (k) {
        var t = frames[i].tally[k];
        running[k] = { tp: running[k].tp + t.tp, fp: running[k].fp + t.fp, fn: running[k].fn + t.fn, tn: running[k].tn + t.tn };
      });
      var snap = {}; keys.forEach(function (k) { snap[k] = Object.assign({}, running[k]); });
      cum.push(snap);
    }

    var fg = s.fatigue, T = 1.0, fatig = false, missed = 0;
    var trust = [], fat = [], missedCum = [], byFrame = {};
    alerts.forEach(function (a) { (byFrame[a.f] = byFrame[a.f] || []).push(a); });
    for (var fr = 0; fr < N; fr++) {
      T = clamp(T + fg.passiveRecover, 0, 1);
      if (fatig && T > fg.recoverAbove) fatig = false;
      (byFrame[fr] || []).forEach(function (a) {
        if (fatig) {
          if (a.kind === "TP" && a.serious) { a.outcome = "missed"; missed++; }
          else a.outcome = "dismissed";
        } else if (a.kind === "TP") {
          a.outcome = "true"; if (T < 0.95) T = clamp(T + fg.trueRecover, 0, 1);
        } else {
          a.outcome = "false"; T = clamp(T - fg.falsePenalty, 0, 1);
          if (T < fg.fatigueBelow) fatig = true;
        }
      });
      trust.push(T); fat.push(fatig); missedCum.push(missed);
    }

    RUN = { N: N, frames: frames, alerts: alerts, cum: cum, keys: keys, eff: eff,
            trust: trust, fat: fat, missedCum: missedCum, totalMissed: missed };
    ui.playhead = clamp(ui.playhead, 0, N - 1);
  }

  function metricsOf(cm) {
    var P = (cm.tp + cm.fp) ? cm.tp / (cm.tp + cm.fp) : null;
    var R = (cm.tp + cm.fn) ? cm.tp / (cm.tp + cm.fn) : null;
    var FAR = (cm.fp + cm.tn) ? cm.fp / (cm.fp + cm.tn) : null;
    var F1 = (P != null && R != null && P + R) ? 2 * P * R / (P + R) : null;
    return { P: P, R: R, FAR: FAR, F1: F1 };
  }
  function n2(x) { return x == null ? "&ndash;" : x.toFixed(2); }
  function n3(x) { return x == null ? "&ndash;" : x.toFixed(3); }

  /* ------------------------------------------------------------- viewport -- */
  function workerSVG(p, ppe) {
    var x = p[0], y = p[1], g = "<g>";
    g += "<circle class='vp-worker' cx='" + x + "' cy='" + (y - 20) + "' r='6'/>";
    g += "<path class='vp-worker' d='M" + x + " " + (y - 14) + " V" + (y + 6) +
      " M" + x + " " + (y + 6) + " L" + (x - 7) + " " + (y + 20) +
      " M" + x + " " + (y + 6) + " L" + (x + 7) + " " + (y + 20) +
      " M" + x + " " + (y - 8) + " L" + (x - 9) + " " + (y + 2) +
      " M" + x + " " + (y - 8) + " L" + (x + 9) + " " + (y + 2) + "'/>";
    if (ppe && ppe.vest) g += "<rect class='vp-vest' x='" + (x - 5) + "' y='" + (y - 13) + "' width='10' height='14' rx='1'/>";
    if (ppe && ppe.hard_hat) g += "<path class='vp-hat' d='M" + (x - 7) + " " + (y - 22) + " a7 6 0 0 1 14 0'/>";
    if (ppe && ppe.atHeight && ppe.harness) g += "<line class='vp-lanyard' x1='" + x + "' y1='" + (y - 6) + "' x2='" + (x + 18) + "' y2='" + (y - 26) + "'/>";
    if (ppe && ppe.atHeight && !ppe.harness) g += "<text class='vp-warn' x='" + (x + 8) + "' y='" + (y - 15) + "'>!</text>";
    return g + "</g>";
  }
  function forkliftSVG(p) {
    var x = p[0], y = p[1];
    return "<g><rect class='vp-forklift' x='" + (x - 20) + "' y='" + (y - 16) + "' width='34' height='18' rx='2'/>" +
      "<rect class='vp-fork' x='" + (x + 12) + "' y='" + (y - 20) + "' width='4' height='26'/>" +
      "<line x1='" + (x + 14) + "' y1='" + (y - 18) + "' x2='" + (x + 26) + "' y2='" + (y - 18) + "' stroke='#e0a12f' stroke-width='3'/>" +
      "<line x1='" + (x + 14) + "' y1='" + (y + 2) + "' x2='" + (x + 26) + "' y2='" + (y + 2) + "' stroke='#e0a12f' stroke-width='3'/>" +
      "<circle cx='" + (x - 12) + "' cy='" + (y + 4) + "' r='5' fill='#2b3542'/>" +
      "<circle cx='" + (x + 6) + "' cy='" + (y + 4) + "' r='5' fill='#2b3542'/></g>";
  }
  function viewportSVG(f) {
    var s = sc(), fr = RUN.frames[f], w = fr.w, g = "";
    g += "<rect class='vp-bg' x='0' y='0' width='400' height='260'/>";
    if (w.floorY != null) g += "<rect class='vp-floor' x='0' y='" + w.floorY + "' width='400' height='" + (260 - w.floorY) + "'/>";
    if (w.racks) {
      g += "<path class='vp-rack' d='M40 30 V150 M40 60 H150 M40 100 H150 M40 140 H150'/>";
      g += "<path class='vp-rack' d='M360 30 V150 M250 60 H360 M250 100 H360 M250 140 H360'/>";
    }
    if (w.platform) g += "<line class='vp-platform' x1='" + w.platform[0] + "' y1='" + w.platform[1] + "' x2='" + w.platform[2] + "' y2='" + w.platform[1] + "'/>";
    if (w.spill) g += "<ellipse class='vp-spill' cx='" + w.spill[0] + "' cy='" + w.spill[1] + "' rx='18' ry='7'/>";
    if (w.zone) g += "<rect class='vp-zone' x='" + w.zone[0] + "' y='" + w.zone[1] + "' width='" + w.zone[2] + "' height='" + w.zone[3] + "'/>";
    if (w.forklift) g += forkliftSVG(w.forklift);
    ["w1", "w2"].forEach(function (id) { if (w[id]) g += workerSVG(w[id], w.ppe[id]); });
    fr.boxes.forEach(function (b) {
      var x = b.box[0], y = b.box[1], ww = b.box[2], hh = b.box[3], cls = b.kind === "TP" ? "tp" : "fp";
      g += "<rect class='box " + cls + "' x='" + x.toFixed(1) + "' y='" + y.toFixed(1) + "' width='" + ww.toFixed(1) + "' height='" + hh.toFixed(1) + "' rx='2'/>";
      g += "<text class='box-label " + cls + "' x='" + x.toFixed(1) + "' y='" + (y - 2).toFixed(1) + "'>" + esc(detLabel(b.det)) + " " + b.conf.toFixed(2) + "</text>";
    });
    return "<svg viewBox='" + s.scene.viewBox + "' preserveAspectRatio='xMidYMid meet'>" + g + "</svg>";
  }

  /* ------------------------------------------------------------- readouts -- */
  function paintFrame() {
    var f = ui.playhead, s = sc(), fr = RUN.frames[f];
    el.viewport.innerHTML = viewportSVG(f);
    el.fc.textContent = (f + 1) + " / " + RUN.N;
    if (el.scrub.value != f) el.scrub.value = f;

    var cm = RUN.cum[f][ui.focus] || RUN.cum[f].all;
    var mm = metricsOf(cm);
    var occBad = fr.modelCount !== fr.headcount;
    var T = RUN.trust[f], fat = RUN.fat[f], missed = RUN.missedCum[f];
    var tcls = T > 0.6 ? "" : T > 0.35 ? "mid" : "low";
    var state = fat ? "tuned out — auto-dismissing alerts" : T > 0.6 ? "attentive" : "getting numb";

    var log = RUN.alerts.filter(function (a) { return a.f <= f; }).slice(-14).reverse().map(function (a) {
      var cls = a.outcome === "true" ? "t-true" : a.outcome === "false" ? "t-false" :
                a.outcome === "missed" ? "t-missed" : "t-dismissed";
      var word = a.outcome === "true" ? "TRUE" : a.outcome === "false" ? "FALSE ALARM" :
                 a.outcome === "missed" ? "MISSED HAZARD" : "dismissed (fatigued)";
      return "<div class='" + cls + "'><span class='fr'>f" + (a.f + 1) + "</span><span>" + esc(detLabel(a.det)) + "</span><span>" + word + "</span></div>";
    }).join("") || "<div><span class='fr'>&mdash;</span><span>no alerts yet</span></div>";

    el.readouts.innerHTML =
      "<h2>Detector readout &mdash; accumulating to frame " + (f + 1) + "</h2>" +
      "<div class='matrix'>" +
        "<div class='hd'></div><div class='hd'>model: hazard</div><div class='hd'>model: clear</div>" +
        "<div class='hd'>actual: hazard</div><div class='tp'>TP " + cm.tp + "</div><div class='fn'>FN " + cm.fn + "</div>" +
        "<div class='hd'>actual: clear</div><div class='fp'>FP " + cm.fp + "</div><div class='tn'>TN " + cm.tn + "</div>" +
      "</div>" +
      "<div class='mets'>" +
        "<span class='m'>precision <b>" + n2(mm.P) + "</b></span>" +
        "<span class='m'>recall <b>" + n2(mm.R) + "</b></span>" +
        "<span class='m'>false-alarm rate <b>" + n3(mm.FAR) + "</b></span>" +
        "<span class='m'>F1 <b>" + n2(mm.F1) + "</b></span>" +
      "</div>" +
      "<div class='occ'>Occupancy &mdash; model: <b class='" + (occBad ? "bad" : "") + "'>" + fr.modelCount +
        "</b> &nbsp;·&nbsp; actual: <b>" + fr.headcount + "</b></div>" +
      "<h3>Supervisor trust</h3>" +
      "<div class='trust'><div class='track'><i class='" + tcls + "' style='width:" + Math.round(T * 100) + "%'></i></div>" +
        "<div class='lab'>" + Math.round(T * 100) + "% &mdash; <span class='state'>" + state + "</span></div>" +
        "<div class='missed" + (missed ? " bad" : "") + "'>Serious hazards missed while fatigued: " + missed + "</div></div>" +
      "<h3>Alert log</h3><div class='alertlog'>" + log + "</div>";
  }

  function renderScore() {
    var s = sc(), last = RUN.cum[RUN.N - 1];
    var rows = s.detectors.map(function (d) {
      var on = !!ui.active[d.key];
      var cm = last[d.key], mm = metricsOf(cm);
      var serious = s.seriousDetectors.indexOf(d.key) >= 0;
      var warn = on && serious && mm.R != null && mm.R < 0.6;
      return "<tr class='" + (on ? "" : "off") + "'>" +
        "<td>" + esc(d.label) + (serious ? " &#9888;" : "") + "</td>" +
        "<td>" + d.baseTPR.toFixed(2) + "</td>" +
        "<td class='" + (warn ? "warn" : "") + "'>" + n2(mm.R) + "</td>" +
        "<td>" + n3(mm.FAR) + "</td>" +
        "<td>" + cm.fp + "</td></tr>";
    }).join("");
    el.score.innerHTML =
      "<div class='card'><h2>Whole-run scorecard &mdash; one pipeline, seven detectors</h2>" +
      "<div style='font-size:.86rem;margin-bottom:8px'>Serious hazards dismissed while the supervisor was fatigued: " +
        "<b style='color:" + (RUN.totalMissed ? "var(--red)" : "var(--ink-soft)") + "'>" + RUN.totalMissed + "</b>" +
        " &nbsp;·&nbsp; total false alarms this run: <b>" + last.all.fp + "</b></div>" +
      "<table class='dtable'><thead><tr><th>Detector</th><th>ideal recall</th><th>recall (this run)</th><th>false-alarm rate</th><th>false alarms</th></tr></thead><tbody>" +
        rows + "</tbody></table>" +
      "<div style='font-size:.76rem;color:var(--ink-soft);margin-top:6px'>&#9888; = a serious detector: dismissing one of these while fatigued counts as a missed hazard.</div>" +
      "<div class='callouts'>" +
        "<div class='callout'><b>The threshold trade-off.</b> " + esc(s.callouts.threshold) + "</div>" +
        "<div class='callout'><b>Alert fatigue.</b> " + esc(s.callouts.fatigue) + "</div>" +
        "<div class='callout'><b>The site pilot.</b> " + esc(s.callouts.sitePilot) + "</div>" +
      "</div></div>";
  }

  function refresh() { simulate(); renderScore(); paintFrame(); }

  /* ------------------------------------------------------------ transport -- */
  function stopPlay() { if (ui.timer) { clearInterval(ui.timer); ui.timer = null; } ui.playing = false; el.play.textContent = "▶ Play"; }
  function startPlay() {
    if (ui.playhead >= RUN.N - 1) ui.playhead = 0;
    ui.playing = true; el.play.textContent = "⏸ Pause";
    ui.timer = setInterval(function () {
      if (ui.playhead >= RUN.N - 1) { stopPlay(); paintFrame(); return; }
      ui.playhead++; paintFrame();
    }, 95);
  }

  /* -------------------------------------------------------------- wiring -- */
  function loadScenario(id) {
    if (!scenarios[id]) return;
    if (ui && ui.timer) stopPlay();
    curId = id;
    var s = scenarios[id];
    var active = {};
    s.detectors.forEach(function (d) { active[d.key] = true; });
    ui = {
      cond: { lighting: 0.15, blur: 0.10, occlusion: 0.10, weather: 0.15 },
      threshold: 0.50, site: "match", seed: 7,
      active: active, focus: "all",
      playhead: 0, playing: false, timer: null
    };
    if (el.scenario.value !== id) el.scenario.value = id;

    el.conds.innerHTML = Object.keys(s.conditions).map(function (k) {
      return "<div class='cond' data-c='" + k + "'><div class='ch'><span>" + esc(s.conditions[k].label) +
        "</span><span class='cv'></span></div><input type='range' min='0' max='1' step='0.05'></div>";
    }).join("");
    Object.keys(s.conditions).forEach(function (k) {
      var wrap = el.conds.querySelector("[data-c='" + k + "']");
      var inp = wrap.querySelector("input");
      inp.value = ui.cond[k];
      inp.addEventListener("input", function () {
        ui.cond[k] = +inp.value;
        wrap.querySelector(".cv").textContent = (+inp.value).toFixed(2);
        refresh();
      });
    });

    el.dets.innerHTML = s.detectors.map(function (d) {
      return "<label class='detchip' data-d='" + d.key + "'><input type='checkbox' checked> " +
        esc(d.label) + " <span class='r'>&middot;" + Math.round(d.baseTPR * 100) + "</span></label>";
    }).join("");
    Array.prototype.forEach.call(el.dets.querySelectorAll(".detchip"), function (chip) {
      var key = chip.getAttribute("data-d");
      chip.querySelector("input").addEventListener("change", function (e) {
        ui.active[key] = e.target.checked;
        chip.classList.toggle("off", !e.target.checked);
        refresh();
      });
    });

    el.focus.innerHTML = "<option value='all'>All detectors</option>" +
      s.detectors.map(function (d) { return "<option value='" + d.key + "'>" + esc(d.label) + "</option>"; }).join("");
    el.focus.value = "all";

    el.thrInput.value = ui.threshold;
    el.thrVal.textContent = ui.threshold.toFixed(2);
    el.scrub.max = s.frames - 1; el.scrub.value = 0;
    setSite("match");

    el.static.innerHTML =
      "<details class='drawer' open><summary>How this works (Day 2 &middot; Topic 4; also Day 1 T2)</summary><div class='dbody'>" +
      "<p><b>What it is.</b> " + esc(s.notes.what) + "</p>" +
      "<p><b>Judging it.</b> " + esc(s.notes.metrics) + "</p>" +
      "<p><b>Model drift.</b> " + esc(s.notes.drift) + "</p>" +
      "<p><b>Alert fatigue.</b> " + esc(s.notes.fatigue) + "</p>" +
      "<p><b>What is real in this demo.</b> " + esc(s.notes.real) + "</p>" +
      "</div></details>";

    refresh();
    try { localStorage.setItem("s5.scenario", id); } catch (e) {}
  }

  function setSite(v) {
    ui.site = v;
    Array.prototype.forEach.call(el.site.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === v));
    });
  }

  function build() {
    el.scenario = document.getElementById("scenario");
    el.theme = document.getElementById("theme");
    el.viewport = document.getElementById("viewport");
    el.fc = document.getElementById("fc");
    el.scrub = document.getElementById("scrub");
    el.restart = document.getElementById("restart");
    el.play = document.getElementById("play");
    el.step = document.getElementById("step");
    el.reseed = document.getElementById("reseed");
    el.conds = document.getElementById("conds");
    el.site = document.getElementById("site");
    el.dets = document.getElementById("dets");
    el.thrInput = document.getElementById("thrInput");
    el.thrVal = document.getElementById("thrVal");
    el.focus = document.getElementById("focus");
    el.readouts = document.getElementById("readouts");
    el.score = document.getElementById("score");
    el.static = document.getElementById("static");

    manifest.forEach(function (m) {
      if (!scenarios[m.id]) return;
      var o = document.createElement("option");
      o.value = m.id; o.textContent = m.label;
      el.scenario.appendChild(o);
    });
    el.scenario.addEventListener("change", function () { loadScenario(el.scenario.value); });

    el.restart.addEventListener("click", function () { stopPlay(); ui.playhead = 0; paintFrame(); });
    el.play.addEventListener("click", function () { if (ui.playing) { stopPlay(); } else { startPlay(); } });
    el.step.addEventListener("click", function () { stopPlay(); ui.playhead = clamp(ui.playhead + 1, 0, RUN.N - 1); paintFrame(); });
    el.reseed.addEventListener("click", function () { stopPlay(); ui.seed = (ui.seed + 1) >>> 0; refresh(); });
    el.scrub.addEventListener("input", function () { stopPlay(); ui.playhead = +el.scrub.value; paintFrame(); });
    el.thrInput.addEventListener("input", function () {
      ui.threshold = +el.thrInput.value; el.thrVal.textContent = ui.threshold.toFixed(2); refresh();
    });
    el.focus.addEventListener("change", function () { ui.focus = el.focus.value; paintFrame(); });
    Array.prototype.forEach.call(el.site.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () { setSite(b.getAttribute("data-v")); refresh(); });
    });

    var THEMES = ["system", "light", "dark"];
    function applyTheme(t) {
      if (t === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      el.theme.textContent = "Theme: " + t;
    }
    var cur = "system";
    try { cur = localStorage.getItem("s5.theme") || "system"; } catch (e) {}
    applyTheme(cur);
    el.theme.addEventListener("click", function () {
      cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      applyTheme(cur);
      try { localStorage.setItem("s5.theme", cur); } catch (e) {}
    });

    var start = manifest[0] && manifest[0].id;
    try { var st = localStorage.getItem("s5.scenario"); if (st && scenarios[st]) start = st; } catch (e) {}
    loadScenario(start);
  }

  build();
})();
