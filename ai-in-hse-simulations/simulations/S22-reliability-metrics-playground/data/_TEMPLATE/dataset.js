/* ============================================================================
   S22 dataset TEMPLATE  —  copy this folder to data/<your-scenario-id>/

   This scenario only supplies FRAMING for a generic reliability sandbox — the
   maths (population generation, confusion matrix, metrics, ROC sweep,
   recalibration) lives once in app.js and is identical across scenarios.

   app.js does, live from the sliders, on a fixed population of `defaults.n`
   synthetic cases:
     n_pos = round(n * prevalence)          n_neg = n - n_pos
     posScore = clip(0.5 + separation/2 + z_pos*0.15, 0, 1)   (per case)
     negScore = clip(0.5 - separation/2 + drift + z_neg*0.15, 0, 1)
     predicted positive iff score >= threshold
     TP/FP/FN/TN, accuracy, precision, recall, specificity, false-alarm rate, F1
     ROC curve: sweep threshold 0..1, plot (FPR,TPR), trapezoid-integrate for AUC
     "always negative" baseline: TP=0, FP=0 — for the accuracy-paradox comparison
     Recalibrate: snaps the threshold to the swept point maximising F1

   Where z_pos / z_neg are seeded standard-normal draws, generated once and
   reused — every slider re-transforms the SAME underlying draws, so nothing
   here is randomly re-rolled by moving a slider (only "re-seed" changes it).

   YOU AUTHOR: the framing (what a "case" is, what the two classes mean, what
   "always negative" means in practice here) and the starting defaults.

   AFTER FILLING IN
   1. add  <script src="data/<your-id>/dataset.js"></script>  to index.html
   2. add  { id: "<your-id>", label: "..." }  to data/manifest.js
   ============================================================================ */
window.HSE_S22 = window.HSE_S22 || { scenarios: {} };
window.HSE_S22.scenarios["TEMPLATE-ID"] = {

  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  posLabel: "TODO — what a true positive actually is",
  negLabel: "TODO — what a true negative actually is",
  eventNoun: "TODO e.g. alert / flag / detection",
  context: "TODO — one or two sentences: what generates a score, and how ground truth is known (if at all, and how late).",

  defaults: { n: 1000, prevalencePct: 8, separation: 0.35, threshold: 0.50 },
  /* separation is the gap between the two score means; both distributions have sd 0.15, so
     separation/0.15 is roughly the effect size (d'). 0.15 -> heavy overlap, weak model;
     0.45 -> ~93% recall at 7% false-alarm rate, a solid detector; 0.75+ -> near-perfect. */
  prevalencePresets: [
    { label: "TODO rare", pct: 2 },
    { label: "TODO typical", pct: 8 },
    { label: "TODO common", pct: 25 }
  ],
  driftPerWeek: 0.012,   /* how fast the negative-class scores creep toward the threshold, per week */

  alwaysNegativeNote: "TODO — what 'never flag anything' looks like in practice for this use case",

  callouts: {
    vocabulary: "Precision, recall, specificity and false-alarm rate are not interchangeable — a model can be excellent on one and useless on another, and a single 'accuracy' number hides which.",
    accuracyParadox: "TODO — the accuracy-paradox line phrased for this scenario's prevalence.",
    tradeCurve: "TODO — the threshold-doesn't-fix-a-weak-model line, phrased for this scenario.",
    driftInvisible: "TODO — what kind of real-world change 'drift' represents here.",
    tieback: "TODO — which earlier simulation(s) in this suite this scenario's metrics tie back to."
  },
  notes: {
    what: "TODO — what one 'case' in the population represents.",
    prevalence: "Prevalence is how common the real event actually is. It does not change how good the model is — only how much a naive 'always say no' strategy can hide behind it.",
    drift: "TODO — the real-world analogue of the drift slider for this scenario.",
    real: "Authored: population size, default prevalence/separation/drift rate, the framing labels. Live and real: every score (a seeded random draw), every confusion-matrix count, every metric, the swept ROC curve and its AUC, and the recalibrated threshold."
  }
};
