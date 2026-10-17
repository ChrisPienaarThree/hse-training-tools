/* ============================================================================
   S22 dataset — "ppe-alert"
   A confusion-matrix / ROC playground framed as the PPE camera alert from S5:
   is this really a hard-hat violation? Same underlying maths as every
   reliability sandbox — a synthetic population, a decision threshold, and
   every metric computed from it.

   AUTHORED: population size, default prevalence/separation/drift rate, the
   framing labels. LIVE AND REAL: every score is a seeded random draw, every
   count in the confusion matrix, every metric, the swept ROC curve and its
   AUC, and the recalibrated threshold. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S22 = window.HSE_S22 || { scenarios: {} };
window.HSE_S22.scenarios["ppe-alert"] = {

  id: "ppe-alert",
  label: "PPE camera alert",
  posLabel: "Real hard-hat violation",
  negLabel: "Compliant / no violation",
  eventNoun: "alert",
  context: "A computer-vision detector (the same kind as S5) scores every frame of a warehouse camera feed and fires an alert above a confidence threshold. Every frame is either a real violation or not — the detector never sees that ground truth, only a score.",

  defaults: { n: 1000, prevalencePct: 6, separation: 0.45, threshold: 0.50 },
  prevalencePresets: [
    { label: "Rare (2%)", pct: 2 },
    { label: "Typical (6%)", pct: 6 },
    { label: "Common (25%)", pct: 25 }
  ],
  driftPerWeek: 0.006,

  alwaysNegativeNote: "the camera is switched on but nobody ever acts on an alert",

  callouts: {
    vocabulary: "Precision, recall, specificity and false-alarm rate are not interchangeable — a detector can be excellent on one and useless on another, and a single 'accuracy' number hides which.",
    accuracyParadox: "At a rare violation rate, never firing an alert scores very high accuracy with zero recall — the single most common way a reliability claim misleads in a rare-event safety context.",
    tradeCurve: "The threshold does not fix a weak detector. Moving it slides you along the SAME curve; a better model gives you a BETTER curve entirely. Drag 'model discriminative power' down and watch the achievable ceiling drop.",
    driftInvisible: "Concept drift — a new camera angle, a lighting change, a repainted floor — moves the operating point off the curve you validated against. Recalibrating restores the trade-off, but only if someone notices it needs doing.",
    tieback: "This is the vocabulary behind every trust meter and confidence threshold in this suite — S1's confusion matrices, S5's false-alarm rate driving alert fatigue, S7's calibration gap. One playground, the same numbers underneath all of them."
  },
  notes: {
    what: "Each of 1,000 synthetic frames has a hidden true class (violation / compliant) and a detector score. The threshold slider decides which scores count as an alert; every count and metric below is computed from that split.",
    prevalence: "Prevalence is how common the real event actually is. It does not change how good the detector is — only how much a naive 'always say no' strategy can hide behind it.",
    drift: "The drift slider shifts the 'compliant' score distribution upward over time — ordinary frames start scoring closer to the alert threshold, exactly what a changing camera view or lighting condition does in the field.",
    real: "Authored: population size, default prevalence/separation/drift rate, the framing labels. Live and real: every score (a seeded random draw), every confusion-matrix count, every metric, the swept ROC curve and its AUC, and the recalibrated threshold."
  }
};
