/* ============================================================================
   S5 dataset — "steel-erection"
   A fixed camera on a steel deck. Two workers at height; one unclips their
   harness partway through; the second drifts toward an edge-protection gap.
   No mobile plant, so the forklift-proximity detector can only false-alarm.

   Pre-authored parameters, real seeded simulation. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S5 = window.HSE_S5 || { scenarios: {} };
window.HSE_S5.scenarios["steel-erection"] = {

  id: "steel-erection",
  label: "Steel erection (work at height)",
  frames: 150,
  seriousDetectors: ["harness_at_height", "forklift_proximity", "restricted_zone"],

  detectors: [
    { key: "hard_hat",          label: "Hard hat missing",         baseTPR: 0.93, baseFPR: 0.015, confMean: 0.86, confSd: 0.05,
      note: "The easy case — a big object at the top of a person, silhouetted against the sky here." },
    { key: "hi_vis_vest",       label: "Hi-vis vest missing",      baseTPR: 0.89, baseFPR: 0.020, confMean: 0.83, confSd: 0.06,
      note: "Both workers wear vests throughout — so any fire from this detector is a false alarm." },
    { key: "gloves",            label: "Gloves missing",           baseTPR: 0.52, baseFPR: 0.055, confMean: 0.64, confSd: 0.10,
      note: "Small and hand-height against steel — low recall. One worker never wears them." },
    { key: "harness_at_height", label: "No harness at height",     baseTPR: 0.70, baseFPR: 0.035, confMean: 0.73, confSd: 0.09,
      note: "The one that matters most here, and one of the hardest: the model has to see a thin lanyard and decide whether it is clipped. It misses the unclip for several seconds." },
    { key: "restricted_zone",   label: "Restricted-zone entry",    baseTPR: 0.84, baseFPR: 0.065, confMean: 0.79, confSd: 0.07,
      note: "The zone is the edge-protection gap, a narrow pixel strip. Chatty, and the boundary shifts with any camera movement in the wind." },
    { key: "forklift_proximity", label: "Forklift-person proximity", baseTPR: 0.80, baseFPR: 0.050, confMean: 0.78, confSd: 0.08,
      note: "There is no mobile plant in this scene. Leaving the detector on adds only false alarms — a good argument for turning off detectors a site does not need." },
    { key: "spill",             label: "Spill / housekeeping",     baseTPR: 0.64, baseFPR: 0.045, confMean: 0.69, confSd: 0.09,
      note: "An oil patch on the deck. Reflective steel makes it flicker." }
  ],

  conditions: {
    lighting:  { tpr: -0.45, fpr: 2.0, conf: -0.10, label: "Lighting / glare against sky" },
    blur:      { tpr: -0.35, fpr: 1.2, conf: -0.06, jitter: 6, label: "Camera shake (wind)" },
    occlusion: { tpr: -0.50, fpr: 0.6, conf: -0.04, label: "Occlusion (steel members, other trades)" },
    weather:   { tpr: -0.30, fpr: 1.6, conf: -0.08, label: "Rain / low cloud" }
  },
  siteMismatch: { tpr: 0.70, fpr: 2.2, conf: -0.08 },
  fatigue: { falsePenalty: 0.06, trueRecover: 0.01, passiveRecover: 0.002, fatigueBelow: 0.35, recoverAbove: 0.45 },

  scene: {
    viewBox: "0 0 400 260",
    shapes: { racks: false, floorY: null, zone: [338, 96, 22, 48], spill: [206, 116], platform: [40, 120, 360] },
    motion: [
      { id: "w1", kind: "worker", from: [120, 104], to: [120, 104], f0: 0,  f1: 150 },
      { id: "w2", kind: "worker", from: [250, 104], to: [326, 104], f0: 60, f1: 150 }
    ],
    headcount: { base: 2, plusWhenFlag: [] },
    flags: {
      "w1.hard_hat_missing": [],
      "w1.at_height": [[0, 150]],
      "w1.no_harness": [[62, 150]],
      "w2.hard_hat_missing": [[92, 150]],
      "w2.at_height": [[0, 150]],
      "w2.no_harness": [],
      "w2.gloves_missing": [[0, 150]],
      "zone.intrusion": [[104, 150]],
      "spill.present": [[0, 150]],
      "forklift.present": [],
      "forklift.proximity": []
    },
    gt: {
      hard_hat:          { flags: ["w1.hard_hat_missing", "w2.hard_hat_missing"], anchor: ["w2", "w1"] },
      hi_vis_vest:       { flags: [],                                             anchor: "w1" },
      gloves:            { flags: ["w2.gloves_missing"],                          anchor: "w2" },
      harness_at_height: { flags: ["w1.no_harness", "w2.no_harness"],            anchor: ["w1", "w2"] },
      restricted_zone:   { flags: ["zone.intrusion"],                            anchor: "rect:zone" },
      forklift_proximity: { flags: [],                                           anchor: "w1" },
      spill:             { flags: ["spill.present"],                             anchor: "pt:spill" }
    }
  },

  callouts: {
    threshold: "The harness detector already has poor recall. Raise the threshold to quiet the chatty zone detector and you push harness recall lower still — you can silence the nuisance and blind the safety-critical one in the same drag.",
    fatigue: "The zone detector on the edge gap fires constantly. By the time the harness detector finally catches the unclip, the supervisor has stopped looking. False alarms on a minor hazard buried the alert on a fatal one.",
    sitePilot: "This model was tuned on a deck like this one — but a different steel colour, a different camera height or a low sun turns its numbers into guesses. 'Deployed elsewhere' shows it."
  },
  notes: {
    what: "One video pipeline, several detectors, each with its own difficulty. Here the most important detector (harness at height) is also among the least reliable — the opposite of what a single headline 'accuracy' number would tell you.",
    metrics: "Precision, recall and false-alarm rate per detector, from a labelled clip shot on THIS structure with THIS camera. The vendor's benchmark was not.",
    drift: "Wind moves the camera; the sun moves; the next structure is a different colour. Each nudges the pixels off what the model learned, and recall on the thin-lanyard task is the first thing to go.",
    fatigue: "A detector that cries wolf on the edge gap trains the supervisor to ignore the panel — so the one alert that meant 'someone is about to fall unprotected' is dismissed with the rest.",
    real: "Authored: each detector's ideal TPR/FPR/confidence, the condition coefficients, the ground-truth windows. Live: a seeded per-frame draw, the confusion matrix, the metrics, the trust curve."
  }
};
