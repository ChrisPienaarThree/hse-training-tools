/* ============================================================================
   S4 dataset TEMPLATE  —  copy this folder to data/<your-scenario-id>/

   One structured prediction problem, scored four ways:
     regression  · one decision tree · boosted-stump ensemble · anomaly detector

   PRE-AUTHORED PARAMETERS, REAL MATH. Nothing is trained. app.js computes,
   live from the slider values:
     regression : p = sigmoid(intercept + Σ coef[k] * x[k])
     tree       : traverse {f, op, thr, yes, no} to a {p, n} leaf
     ensemble   : p = sigmoid(base + Σ stump(x))   where stump = test ? yes : no
     anomaly    : z[k] = (x[k] - mean[k]) / sd[k]  (mean/sd come from features[])
                  flag if RMS(z) > thresholdRms  OR  max|z| > thresholdMax

   Tuning tips
   - Set feature means/SDs to a realistic "typical" operation.
   - Pick `intercept` / `base` so the mean case lands near your real base rate.
   - Give one preset case a value combination that is individually plausible but
     jointly weird (a big z on one feature) so the anomaly detector fires while
     the three predictors stay low — that contrast is the point.
   - `op` is ">=" throughout. Thresholds are compared against the raw value.

   AFTER FILLING IN
   1. add  <script src="data/<your-id>/dataset.js"></script>  to index.html
   2. add  { id: "<your-id>", label: "..." }  to data/manifest.js
   ============================================================================ */
window.HSE_S4 = window.HSE_S4 || { scenarios: {} };
window.HSE_S4.scenarios["TEMPLATE-ID"] = {

  id: "TEMPLATE-ID",
  label: "TODO — short label for the scenario picker",
  target: "P(TODO — the event, the scope, the horizon)",

  /* order here = order of sliders, contribution bars and z-score rows */
  features: [
    { key: "feat_a", label: "TODO Feature A", min: 0, max: 20,  step: 1,   mean: 5,  sd: 3 },
    { key: "feat_b", label: "TODO Feature B", min: 0, max: 100, step: 1,   mean: 30, sd: 15 },
    { key: "feat_c", label: "TODO Feature C", min: 1, max: 5,   step: 0.1, mean: 3,  sd: 0.8 }
  ],

  cases: [
    { name: "TODO — typical",     values: { feat_a: 4,  feat_b: 20, feat_c: 3.5 } },
    { name: "TODO — high risk",   values: { feat_a: 12, feat_b: 60, feat_c: 2.2 } },
    { name: "TODO — unusual mix", values: { feat_a: 0,  feat_b: 0,  feat_c: 5.0 } }
  ],

  regression: {
    intercept: -1.5,
    coef: { feat_a: 0.10, feat_b: 0.02, feat_c: -0.30 }   /* one weight per feature key */
  },

  /* one tree, depth up to ~3. node = {f, op:">=", thr, yes, no} ; leaf = {p, n} */
  tree: {
    root: {
      f: "feat_b", op: ">=", thr: 25,
      yes: { f: "feat_a", op: ">=", thr: 6, yes: { p: 0.45, n: 40 }, no: { p: 0.22, n: 55 } },
      no:  { f: "feat_c", op: ">=", thr: 3.0, yes: { p: 0.06, n: 180 }, no: { p: 0.18, n: 60 } }
    }
  },

  /* boosted stumps: p = sigmoid(base + Σ (test ? yes : no)) */
  ensemble: {
    base: -1.4,
    stumps: [
      { f: "feat_a", op: ">=", thr: 6,   yes: 0.25, no: -0.08 },
      { f: "feat_b", op: ">=", thr: 25,  yes: 0.20, no: -0.06 },
      { f: "feat_b", op: ">=", thr: 50,  yes: 0.22, no: -0.02 },
      { f: "feat_c", op: ">=", thr: 3.0, yes: -0.22, no: 0.14 }
      /* ...add 8-12 more; two stumps per feature at different thresholds works well */
    ]
  },

  anomaly: {
    thresholdRms: 2.0,
    thresholdMax: 3.0,
    scatterX: "feat_a",   /* two feature keys to plot the training cloud against */
    scatterY: "feat_b",
    cloud: [ [2, 20], [4, 28], [3, 15], [5, 32], [1, 12], [6, 24] /* ...author ~25-30 "normal" points... */ ]
  },

  metrics: {
    /* AUC values are authored; the text answers "how would I actually use / challenge this?" */
    regression: { auc: "0.7x", explain: "TODO", data: "TODO", failure: "TODO", ask: "TODO" },
    tree:       { auc: "0.6x", explain: "TODO", data: "TODO", failure: "TODO", ask: "TODO" },
    ensemble:   { auc: "0.8x", explain: "TODO", data: "TODO", failure: "TODO", ask: "TODO" },
    anomaly:    { auc: "n/a — unsupervised", explain: "TODO", data: "TODO", failure: "TODO", ask: "TODO" }
  },

  notes: {
    regression: "TODO — weighted sum through a sigmoid; weights fixed; explanation IS the model.",
    tree: "TODO — learned flowchart; readable path; unstable; step predictions.",
    ensemble: "TODO — many weak rules summed; best accuracy; explanation is post-hoc.",
    anomaly: "TODO — 'unlike the training data?', not 'high risk?'; no labels needed.",
    explainability: "TODO — accuracy vs explainability trade-off; match to whether each decision must be defended."
  }
};
