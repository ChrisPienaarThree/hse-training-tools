/* ============================================================================
   S5 dataset TEMPLATE  —  copy this folder to data/<your-scenario-id>/

   A fixed camera watches a scripted scene. One video pipeline runs SEVERAL
   detectors. You author: each detector's ideal reliability, how the four
   condition sliders scale it, and the ground-truth hazard windows. app.js runs
   a real seeded stochastic detector per frame and computes the confusion
   matrix, the precision / recall / false-alarm figures and the supervisor
   alert-fatigue curve from the outcomes.

   PER FRAME, PER DETECTOR (app.js):
     effTPR = clamp(baseTPR × Π(1 + cond.k.tpr × sliderK) × [siteMismatch.tpr], 0.03, 0.99)
     effFPR = clamp(baseFPR × Π(1 + cond.k.fpr × sliderK) × [siteMismatch.fpr], 0.001, 0.85)
     effConf = confMean + Σ(cond.k.conf × sliderK) + [siteMismatch.conf]
     if ground-truth hazard this frame:  emit a detection with prob effTPR
     always:  emit a false detection with prob effFPR
     keep detections with confidence ≥ the threshold slider
     -> TP / FP / FN / TN, then alerts, then the fatigue model.

   AFTER FILLING IN
   1. add  <script src="data/<your-id>/dataset.js"></script>  to index.html
   2. add  { id: "<your-id>", label: "..." }  to data/manifest.js
   ============================================================================ */
window.HSE_S5 = window.HSE_S5 || { scenarios: {} };
window.HSE_S5.scenarios["TEMPLATE-ID"] = {

  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  frames: 150,
  seriousDetectors: ["harness_at_height", "forklift_proximity", "restricted_zone"], /* dismissing one of these while fatigued = a MISSED hazard */

  /* keep these keys — the scene renderer and the gt bindings use them */
  detectors: [
    { key: "hard_hat",          label: "Hard hat missing",         baseTPR: 0.94, baseFPR: 0.015, confMean: 0.87, confSd: 0.05, note: "TODO — easy: big high-contrast object." },
    { key: "hi_vis_vest",       label: "Hi-vis vest missing",      baseTPR: 0.90, baseFPR: 0.020, confMean: 0.84, confSd: 0.06, note: "TODO" },
    { key: "gloves",            label: "Gloves missing",           baseTPR: 0.55, baseFPR: 0.050, confMean: 0.66, confSd: 0.10, note: "TODO — hard: small, occluded." },
    { key: "harness_at_height", label: "No harness at height",     baseTPR: 0.72, baseFPR: 0.030, confMean: 0.74, confSd: 0.09, note: "TODO — context-dependent." },
    { key: "restricted_zone",   label: "Restricted-zone entry",    baseTPR: 0.86, baseFPR: 0.060, confMean: 0.80, confSd: 0.07, note: "TODO — chatty: pixel boundary." },
    { key: "forklift_proximity", label: "Forklift-person proximity", baseTPR: 0.80, baseFPR: 0.050, confMean: 0.78, confSd: 0.08, note: "TODO — no true depth from one camera." },
    { key: "spill",             label: "Spill / housekeeping",     baseTPR: 0.68, baseFPR: 0.040, confMean: 0.70, confSd: 0.09, note: "TODO — static hazard, flickers." }
  ],

  /* condition coefficients: (1 + tpr*slider) multiplies TPR, (1 + fpr*slider) multiplies FPR, conf*slider adds to confidence */
  conditions: {
    lighting:  { tpr: -0.45, fpr: 2.0, conf: -0.25, label: "Lighting (bright → dark)" },
    blur:      { tpr: -0.35, fpr: 1.2, conf: -0.15, jitter: 6, label: "Motion blur" },
    occlusion: { tpr: -0.50, fpr: 0.6, conf: -0.10, label: "Occlusion" },
    weather:   { tpr: -0.30, fpr: 1.6, conf: -0.20, label: "Weather (dust / rain)" }
  },
  siteMismatch: { tpr: 0.70, fpr: 2.2, conf: -0.15 },   /* applied when 'deployed elsewhere' is selected */
  fatigue: { falsePenalty: 0.06, trueRecover: 0.01, passiveRecover: 0.002, fatigueBelow: 0.35, recoverAbove: 0.45 },

  scene: {
    viewBox: "0 0 400 260",
    shapes: { racks: true, floorY: 150, zone: [300, 182, 100, 78], spill: [150, 214], platform: null },
    /* linear motion between from/to over [f0,f1], clamped outside. kind: "worker" | "forklift" */
    motion: [
      { id: "w1",       kind: "worker",   from: [60, 168],  to: [334, 168], f0: 0,  f1: 150 },
      { id: "forklift", kind: "forklift", from: [400, 202], to: [150, 202], f0: 55, f1: 112 }
    ],
    headcount: { base: 1, plusWhenFlag: ["forklift.present"] },
    /* each flag is a list of inclusive [f0,f1] windows; the flag is true when the frame is in any window */
    flags: {
      "w1.hard_hat_missing": [[52, 150]],
      "w1.gloves_missing": [[30, 92]],
      "w1.at_height": [],
      "w1.no_harness": [],
      "forklift.present": [[55, 150]],
      "forklift.proximity": [[70, 95]],
      "zone.intrusion": [[132, 150]],
      "spill.present": [[0, 150]]
    },
    /* which flags make each detector's ground truth positive, and where to draw its box.
       anchor: "w1" | "w2" | ["w2","w1"] | "rect:zone" | "pt:spill" | "between:w1,forklift" */
    gt: {
      hard_hat:          { flags: ["w1.hard_hat_missing"],  anchor: "w1" },
      hi_vis_vest:       { flags: [],                        anchor: "w1" },
      gloves:            { flags: ["w1.gloves_missing"],     anchor: "w1" },
      harness_at_height: { flags: ["w1.no_harness"],         anchor: "w1" },
      restricted_zone:   { flags: ["zone.intrusion"],        anchor: "rect:zone" },
      forklift_proximity: { flags: ["forklift.proximity"],   anchor: "between:w1,forklift" },
      spill:             { flags: ["spill.present"],          anchor: "pt:spill" }
    }
  },

  callouts: {
    threshold: "TODO — the threshold trade-off in this scene's terms.",
    fatigue: "TODO — the false-alarm → missed-real-hazard chain in this scene.",
    sitePilot: "TODO — what 'deployed elsewhere' does to this model."
  },
  notes: {
    what: "TODO — one pipeline, several detectors, each with its own difficulty and failure mode.",
    metrics: "TODO — precision / recall / false-alarm rate from a SITE-SPECIFIC labelled clip.",
    drift: "TODO — what shifts the pixels away from training here.",
    fatigue: "TODO — alert fatigue as a measurable safety hazard.",
    real: "Authored: detector TPR/FPR/confidence, condition coefficients, ground-truth windows. Live and real: the seeded per-frame draw, the confusion matrix, the metrics, the trust curve."
  }
};
