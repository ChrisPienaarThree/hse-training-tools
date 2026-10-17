/* ============================================================================
   S5 dataset — "warehouse-aisle"
   A fixed camera over a picking aisle. One worker walks the aisle; a forklift
   crosses; there is a dock-edge restricted zone and a static spill.

   PRE-AUTHORED PARAMETERS, REAL SIMULATION. No vision model runs. The detector
   TPR/FPR/confidence, the condition-effect coefficients and the ground-truth
   event windows are authored. app.js runs a real seeded stochastic detector
   per frame and computes the confusion matrix, the metrics and the
   alert-fatigue curve from the outcomes. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S5 = window.HSE_S5 || { scenarios: {} };
window.HSE_S5.scenarios["warehouse-aisle"] = {

  id: "warehouse-aisle",
  label: "Warehouse aisle",
  frames: 150,
  seriousDetectors: ["harness_at_height", "forklift_proximity", "restricted_zone"],

  detectors: [
    { key: "hard_hat",          label: "Hard hat missing",         baseTPR: 0.94, baseFPR: 0.015, confMean: 0.87, confSd: 0.05,
      note: "Large, high-contrast object near the top of a person — the easy case. Stays usable even when the image degrades." },
    { key: "hi_vis_vest",       label: "Hi-vis vest missing",      baseTPR: 0.90, baseFPR: 0.020, confMean: 0.84, confSd: 0.06,
      note: "Colour helps. Tripped by other orange objects and by rain streaks." },
    { key: "gloves",            label: "Gloves missing",           baseTPR: 0.55, baseFPR: 0.050, confMean: 0.66, confSd: 0.10,
      note: "Small, frequently out of frame or hidden by the body. Low recall even in good light — a genuinely hard target." },
    { key: "harness_at_height", label: "No harness at height",     baseTPR: 0.72, baseFPR: 0.030, confMean: 0.74, confSd: 0.09,
      note: "Must judge BOTH 'is this person at height' and 'is a lanyard clipped'. Not exercised in this scene — so it can only produce false alarms here." },
    { key: "restricted_zone",   label: "Restricted-zone entry",    baseTPR: 0.86, baseFPR: 0.060, confMean: 0.80, confSd: 0.07,
      note: "The zone is a pixel boundary. People clip the line and the line shifts if the camera nudges. The chattiest detector — highest false-alarm rate." },
    { key: "forklift_proximity", label: "Forklift-person proximity", baseTPR: 0.80, baseFPR: 0.050, confMean: 0.78, confSd: 0.08,
      note: "A single camera has no true depth. '2 m' is inferred from pixel size and miscalibrates for a different truck or camera angle — a systematic bias, not just noise." },
    { key: "spill",             label: "Spill / housekeeping",     baseTPR: 0.68, baseFPR: 0.040, confMean: 0.70, confSd: 0.09,
      note: "A static hazard the model ought to nail — but low texture and floor reflections make it flicker frame to frame." }
  ],

  conditions: {
    lighting:  { tpr: -0.45, fpr: 2.0, conf: -0.10, label: "Lighting (bright → dark)" },
    blur:      { tpr: -0.35, fpr: 1.2, conf: -0.06, jitter: 6, label: "Motion blur" },
    occlusion: { tpr: -0.50, fpr: 0.6, conf: -0.04, label: "Occlusion (clutter, racking, bodies)" },
    weather:   { tpr: -0.30, fpr: 1.6, conf: -0.08, label: "Airborne dust / rain" }
  },
  siteMismatch: { tpr: 0.70, fpr: 2.2, conf: -0.08 },
  fatigue: { falsePenalty: 0.06, trueRecover: 0.01, passiveRecover: 0.002, fatigueBelow: 0.35, recoverAbove: 0.45 },

  scene: {
    viewBox: "0 0 400 260",
    shapes: { racks: true, floorY: 150, zone: [300, 182, 100, 78], spill: [150, 214], platform: null },
    motion: [
      { id: "w1",       kind: "worker",   from: [60, 168],  to: [334, 168], f0: 0,  f1: 150 },
      { id: "forklift", kind: "forklift", from: [400, 202], to: [150, 202], f0: 55, f1: 112 }
    ],
    headcount: { base: 1, plusWhenFlag: ["forklift.present"] },
    flags: {
      "w1.hard_hat_missing": [[52, 150]],
      "w1.vest_missing": [],
      "w1.gloves_missing": [[30, 92]],
      "w1.at_height": [],
      "w1.no_harness": [],
      "forklift.present": [[55, 150]],
      "forklift.proximity": [[70, 95]],
      "zone.intrusion": [[132, 150]],
      "spill.present": [[0, 150]]
    },
    gt: {
      hard_hat:          { flags: ["w1.hard_hat_missing"], anchor: "w1" },
      hi_vis_vest:       { flags: ["w1.vest_missing"],     anchor: "w1" },
      gloves:            { flags: ["w1.gloves_missing"],   anchor: "w1" },
      harness_at_height: { flags: ["w1.no_harness"],       anchor: "w1" },
      restricted_zone:   { flags: ["zone.intrusion"],      anchor: "rect:zone" },
      forklift_proximity: { flags: ["forklift.proximity"], anchor: "between:w1,forklift" },
      spill:             { flags: ["spill.present"],       anchor: "pt:spill" }
    }
  },

  callouts: {
    threshold: "Raising the confidence threshold cuts false alarms — and cuts recall by the same motion. There is no setting that gives you both. Pick it against a labelled test set, per detector, not by feel.",
    fatigue: "Every false alarm spends supervisor trust. Below the fatigue line the alerts get dismissed on sight — including the real one. The chain from 'chatty zone detector' to 'missed forklift near-miss' is one screen.",
    sitePilot: "Every number here was set at the validation site. Flip 'deployed elsewhere' to see the same model on an unseen camera: recall down, false alarms up, and nothing on the dashboard tells the supervisor that."
  },
  notes: {
    what: "'Computer vision for safety' is usually ONE video pipeline running SEVERAL detectors. Each detector has its own difficulty, its own false-alarm rate and its own failure mode — a single 'accuracy' figure hides all of that.",
    metrics: "Judge a detector on precision, recall and false-alarm rate from a site-specific labelled clip — never a demo reel. 'Frames with no hazard and no alert' are the true negatives; they make the false-alarm rate meaningful.",
    drift: "Lighting, weather, a bumped camera, a new forklift model, a re-painted floor line — each shifts the pixels away from what the model learned. Accuracy decays silently; only a fresh labelled test set reveals it.",
    fatigue: "Alert fatigue is a measurable safety hazard in its own right. A detector that is 'usually right' but fires 20 false alarms a shift will be muted, and then it protects no one.",
    real: "Authored: each detector's ideal TPR/FPR/confidence, how conditions scale them, and the ground-truth event windows. Live and real: a seeded per-frame detector draw, the accumulating confusion matrix, every metric, and the trust curve."
  }
};
