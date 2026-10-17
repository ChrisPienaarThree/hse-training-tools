/* ============================================================================
   S4 dataset — "crew-incident-risk"
   The SAME structured data, scored by four model families:
     logistic regression · a single decision tree · a boosted-stump ensemble ·
     an unsupervised anomaly detector.

   PRE-AUTHORED PARAMETERS, REAL MATH. No model was trained. The coefficients,
   the tree, the stumps and the feature means/SDs are authored so the demo is
   reproducible — but every number shown is computed live from the slider
   values by app.js (sigmoid, tree traversal, stump sum, z-scores).
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S4 = window.HSE_S4 || { scenarios: {} };
window.HSE_S4.scenarios["crew-incident-risk"] = {

  id: "crew-incident-risk",
  label: "Crew incident risk (next 30 days)",
  target: "P(a recordable incident on this crew in the next 30 days)",

  features: [
    { key: "near_misses",     label: "Near-miss reports (30 d)",           min: 0, max: 25,  step: 1,   mean: 5,   sd: 3.2 },
    { key: "overdue_pct",     label: "Overdue corrective actions (%)",     min: 0, max: 100, step: 1,   mean: 18,  sd: 10  },
    { key: "tenure_months",   label: "Average crew tenure (months)",       min: 1, max: 120, step: 1,   mean: 34,  sd: 18  },
    { key: "overtime_hrs",    label: "Overtime per person, last 7 d (h)",  min: 0, max: 40,  step: 1,   mean: 6,   sd: 5   },
    { key: "tbt_pct",         label: "Toolbox talks completed (%)",        min: 0, max: 100, step: 1,   mean: 88,  sd: 12  },
    { key: "housekeeping",    label: "Housekeeping audit score (1-5)",     min: 1, max: 5,   step: 0.1, mean: 3.6, sd: 0.7 },
    { key: "prior_incidents", label: "Recordable incidents, prior 12 mo",  min: 0, max: 8,   step: 1,   mean: 1.1, sd: 1.2 }
  ],

  cases: [
    { name: "Crew A — steady",         values: { near_misses: 4, overdue_pct: 12, tenure_months: 40, overtime_hrs: 4,  tbt_pct: 95,  housekeeping: 4.0, prior_incidents: 0 } },
    { name: "Crew B — under pressure", values: { near_misses: 9, overdue_pct: 35, tenure_months: 14, overtime_hrs: 18, tbt_pct: 70,  housekeeping: 2.6, prior_incidents: 2 } },
    { name: "Crew C — unusual mix",    values: { near_misses: 0, overdue_pct: 0,  tenure_months: 3,  overtime_hrs: 34, tbt_pct: 100, housekeeping: 5.0, prior_incidents: 0 } }
  ],

  regression: {
    intercept: -0.56,
    coef: {
      near_misses: 0.09, overdue_pct: 0.018, tenure_months: -0.010, overtime_hrs: 0.035,
      tbt_pct: -0.012, housekeeping: -0.35, prior_incidents: 0.30
    }
  },

  /* one decision tree, depth 3. node = {f, op, thr, yes, no} ; leaf = {p, n} */
  tree: {
    root: {
      f: "overdue_pct", op: ">=", thr: 25,
      yes: {
        f: "near_misses", op: ">=", thr: 6,
        yes: { f: "housekeeping", op: ">=", thr: 3.0,
               yes: { p: 0.34, n: 44 }, no: { p: 0.52, n: 61 } },
        no: { p: 0.19, n: 52 }
      },
      no: {
        f: "prior_incidents", op: ">=", thr: 2,
        yes: { f: "overtime_hrs", op: ">=", thr: 10,
               yes: { p: 0.41, n: 23 }, no: { p: 0.22, n: 31 } },
        no: { f: "near_misses", op: ">=", thr: 8,
              yes: { p: 0.17, n: 39 }, no: { p: 0.06, n: 180 } }
      }
    }
  },

  /* boosted stumps: p = sigmoid(base + Σ (test ? yes : no)) */
  ensemble: {
    base: -1.40,
    stumps: [
      { f: "near_misses",     op: ">=", thr: 6,    yes: 0.28, no: -0.10 },
      { f: "near_misses",     op: ">=", thr: 12,   yes: 0.30, no: -0.02 },
      { f: "overdue_pct",     op: ">=", thr: 20,   yes: 0.22, no: -0.08 },
      { f: "overdue_pct",     op: ">=", thr: 40,   yes: 0.25, no: -0.03 },
      { f: "tenure_months",   op: ">=", thr: 24,   yes: -0.24, no: 0.10 },
      { f: "tenure_months",   op: ">=", thr: 48,   yes: -0.18, no: 0.02 },
      { f: "overtime_hrs",    op: ">=", thr: 10,   yes: 0.20, no: -0.06 },
      { f: "overtime_hrs",    op: ">=", thr: 20,   yes: 0.22, no: -0.02 },
      { f: "tbt_pct",         op: ">=", thr: 85,   yes: -0.20, no: 0.12 },
      { f: "tbt_pct",         op: ">=", thr: 60,   yes: -0.10, no: 0.20 },
      { f: "housekeeping",    op: ">=", thr: 3.0,  yes: -0.22, no: 0.16 },
      { f: "housekeeping",    op: ">=", thr: 4.0,  yes: -0.16, no: 0.03 },
      { f: "prior_incidents", op: ">=", thr: 1,    yes: 0.18, no: -0.10 },
      { f: "prior_incidents", op: ">=", thr: 3,    yes: 0.20, no: -0.02 }
    ]
  },

  anomaly: {
    thresholdRms: 2.0,
    thresholdMax: 3.0,
    scatterX: "overtime_hrs",
    scatterY: "tenure_months",
    /* an authored sample of "normal" crews in (overtime, tenure) space */
    cloud: [
      [2, 30], [3, 44], [1, 52], [4, 26], [6, 38], [5, 60], [7, 22], [3, 48],
      [8, 18], [2, 66], [4, 34], [9, 28], [6, 40], [5, 55], [10, 20], [3, 72],
      [7, 33], [4, 46], [2, 58], [8, 24], [11, 16], [6, 50], [5, 30], [9, 36],
      [12, 19], [4, 62], [7, 27], [3, 41], [6, 44], [2, 49]
    ]
  },

  metrics: {
    regression: {
      auc: "0.74",
      explain: "Read the coefficient table. Each weight is fixed and the same for every crew. One decision = weight × your value, summed, then an S-curve.",
      data: "Needs labelled history (crews with known outcomes). Works with a few hundred rows.",
      failure: "Assumes each factor acts in a straight line and independently. Misses interactions. Sensitive to how the inputs are scaled.",
      ask: "Show me the coefficients and their confidence intervals. Which candidate features were dropped, and why?"
    },
    tree: {
      auc: "0.68",
      explain: "Follow the highlighted path — three or four yes/no questions to a leaf. Fully inspectable.",
      data: "Labelled history. A single tree needs a lot of data to get stable splits.",
      failure: "High variance: a small change in the data moves the splits. Predicts in steps. Over-fits without pruning.",
      ask: "Is this one tree or an ensemble? Max depth and minimum leaf size? How stable are the splits when you resample?"
    },
    ensemble: {
      auc: "0.81",
      explain: "No single path. The per-feature contributions are attributed AFTER the fact (SHAP-style) and are approximate.",
      data: "Labelled history, more of it, and more compute.",
      failure: "Best accuracy here — but the explanation is a reconstruction, not the mechanism. Still cannot reason outside the training range.",
      ask: "How is importance computed — gain, permutation, SHAP? Show a case-level explanation and its error bars."
    },
    anomaly: {
      auc: "n/a — unsupervised",
      explain: "Distance from the training distribution, per feature (z-score) and overall. It flags 'unlike anything seen', not 'high risk'.",
      data: "No outcome labels needed — just a clean sample of 'normal'.",
      failure: "Says nothing about the outcome. A familiar-looking bad case will not flag. 'Normal' drifts and must be refreshed.",
      ask: "What defines 'normal', how often is it refreshed, and what is the false-flag rate?"
    }
  },

  notes: {
    regression: "A weighted sum of the features passed through an S-curve (sigmoid) to give a probability. The weights are learned once, then fixed. The most transparent option: the explanation IS the model.",
    tree: "A flowchart of yes/no splits learned from the data. For any crew you can read the exact path to the answer. Transparent — but a single tree is unstable and predicts in steps.",
    ensemble: "Many weak trees (here, decision stumps) each nudge the score up or down; their pushes are summed and squashed to a probability. Usually the most accurate, but there is no single path to point at — case-level explanations are approximate reconstructions.",
    anomaly: "A different question: not 'how likely is an incident' but 'is this crew unlike the data the model was built on'. No outcome labels needed. Crew C scores low on every predictor yet is flagged here — a combination the models were never trained on.",
    explainability: "Accuracy and explainability trade off. Regression: fully explainable, moderate accuracy. Single tree: fully inspectable, unstable. Ensemble: best accuracy, explanation is post-hoc. Anomaly detection: answers a different question and needs no labels. Match the choice to whether a person has to defend each individual decision."
  }
};
