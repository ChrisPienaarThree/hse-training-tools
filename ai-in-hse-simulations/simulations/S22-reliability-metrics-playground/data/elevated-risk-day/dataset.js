/* ============================================================================
   S22 dataset — "elevated-risk-day"
   Same playground, framed as the predictive site-risk cockpit from S7: is
   this really an elevated-risk day? Predictive safety models are typically
   weaker discriminators than vision models — the default separation here is
   lower than the PPE scenario's, on purpose.

   Authored: population size, default prevalence/separation/drift rate,
   framing labels. Live: every score, every count, every metric, the ROC
   curve + AUC, recalibration. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S22 = window.HSE_S22 || { scenarios: {} };
window.HSE_S22.scenarios["elevated-risk-day"] = {

  id: "elevated-risk-day",
  label: "Elevated-risk-day flag",
  posLabel: "A recordable actually occurs",
  negLabel: "Normal day",
  eventNoun: "flag",
  context: "The predictive cockpit from S7 scores every working day from that morning's leading indicators and flags 'elevated risk' above a threshold. Ground truth — whether a recordable actually happens — is only known at the end of the day.",

  defaults: { n: 1000, prevalencePct: 10, separation: 0.30, threshold: 0.50 },
  prevalencePresets: [
    { label: "Low-incident site (4%)", pct: 4 },
    { label: "Typical (10%)", pct: 10 },
    { label: "High-incident site (30%)", pct: 30 }
  ],
  driftPerWeek: 0.008,

  alwaysNegativeNote: "the cockpit is displayed but every day is treated as normal",

  callouts: {
    vocabulary: "Precision, recall, specificity and false-alarm rate are not interchangeable — a predictive model can be excellent on one and useless on another, and a single 'accuracy' number hides which.",
    accuracyParadox: "On a low-incident site, flagging nothing scores very high accuracy with zero recall — the exact failure mode a headline accuracy figure never shows a safety committee.",
    tradeCurve: "The threshold does not fix a weak model. Moving it slides you along the SAME curve; predictive safety models generally start from a worse curve than a vision detector — this scenario's default 'model discriminative power' is deliberately lower than S22's PPE scenario, matching S7's evidence-base caveat.",
    driftInvisible: "Concept drift — new equipment, a new contractor mix, the season — moves the operating point off the curve the model was validated against, exactly as in S7. Recalibrating restores the trade-off, but only if someone notices it needs doing.",
    tieback: "This is the vocabulary behind S7's calibration gap and every trust meter in this suite. One playground, the same numbers underneath all of them."
  },
  notes: {
    what: "Each of 1,000 synthetic days has a hidden true outcome (recordable / normal) and a model score from that morning's indicators. The threshold slider decides which days get flagged; every count and metric below is computed from that split.",
    prevalence: "Prevalence is how often a recordable actually happens at this kind of site. It does not change how good the model is — only how much a naive 'never flag' strategy can hide behind it.",
    drift: "The drift slider shifts the 'normal day' score distribution upward over time — ordinary days start scoring closer to the flag threshold, exactly what a changing site does to a model fitted on last year's data.",
    real: "Authored: population size, default prevalence/separation/drift rate, the framing labels. Live and real: every score (a seeded random draw), every confusion-matrix count, every metric, the swept ROC curve and its AUC, and the recalibrated threshold."
  }
};
