/* ============================================================================
   S4 dataset — "equipment-failure-risk"
   Predictive-maintenance flavour: the same asset data scored by regression,
   one decision tree, a boosted-stump ensemble and an anomaly detector.
   Pre-authored parameters, real maths. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S4 = window.HSE_S4 || { scenarios: {} };
window.HSE_S4.scenarios["equipment-failure-risk"] = {

  id: "equipment-failure-risk",
  label: "Equipment failure risk (next 90 days)",
  target: "P(an unplanned failure of this asset in the next 90 days)",

  features: [
    { key: "age_years",    label: "Asset age (years)",                      min: 0, max: 40,    step: 0.5, mean: 12,   sd: 6    },
    { key: "hrs_overhaul", label: "Hours since last overhaul",              min: 0, max: 20000, step: 100, mean: 6000, sd: 3500 },
    { key: "vibration",    label: "Vibration index (0-10)",                 min: 0, max: 10,    step: 0.1, mean: 3.2,  sd: 1.6  },
    { key: "oil_flags",    label: "Oil-analysis flags (last sample)",       min: 0, max: 6,     step: 1,   mean: 0.6,  sd: 1.0  },
    { key: "duty_pct",     label: "Duty cycle (% of rated)",               min: 0, max: 120,   step: 1,   mean: 72,   sd: 18   },
    { key: "missed_pm",    label: "Missed preventive-maintenance tasks (12 mo)", min: 0, max: 10, step: 1, mean: 1.2, sd: 1.5 },
    { key: "prior_bd",     label: "Unplanned breakdowns (prior 24 mo)",     min: 0, max: 8,     step: 1,   mean: 1.0,  sd: 1.3  }
  ],

  cases: [
    { name: "Asset 1 — healthy",     values: { age_years: 8,  hrs_overhaul: 2500,  vibration: 2.1, oil_flags: 0, duty_pct: 65, missed_pm: 0, prior_bd: 0 } },
    { name: "Asset 2 — degrading",   values: { age_years: 19, hrs_overhaul: 11000, vibration: 6.4, oil_flags: 2, duty_pct: 95, missed_pm: 3, prior_bd: 2 } },
    { name: "Asset 3 — odd readings", values: { age_years: 3, hrs_overhaul: 800,   vibration: 9.6, oil_flags: 0, duty_pct: 35, missed_pm: 0, prior_bd: 0 } }
  ],

  regression: {
    intercept: -5.11,
    coef: {
      age_years: 0.04, hrs_overhaul: 0.00008, vibration: 0.22, oil_flags: 0.35,
      duty_pct: 0.010, missed_pm: 0.20, prior_bd: 0.28
    }
  },

  tree: {
    root: {
      f: "vibration", op: ">=", thr: 5.0,
      yes: {
        f: "oil_flags", op: ">=", thr: 1,
        yes: { p: 0.62, n: 38 },
        no: { f: "hrs_overhaul", op: ">=", thr: 8000,
              yes: { p: 0.44, n: 29 }, no: { p: 0.28, n: 41 } }
      },
      no: {
        f: "prior_bd", op: ">=", thr: 2,
        yes: { f: "missed_pm", op: ">=", thr: 2,
               yes: { p: 0.39, n: 22 }, no: { p: 0.20, n: 34 } },
        no: { f: "age_years", op: ">=", thr: 15,
              yes: { p: 0.14, n: 70 }, no: { p: 0.05, n: 190 } }
      }
    }
  },

  ensemble: {
    base: -1.70,
    stumps: [
      { f: "vibration",    op: ">=", thr: 4.0,    yes: 0.26, no: -0.10 },
      { f: "vibration",    op: ">=", thr: 7.0,    yes: 0.30, no: -0.03 },
      { f: "oil_flags",    op: ">=", thr: 1,      yes: 0.30, no: -0.08 },
      { f: "oil_flags",    op: ">=", thr: 3,      yes: 0.25, no: -0.02 },
      { f: "hrs_overhaul", op: ">=", thr: 8000,   yes: 0.22, no: -0.08 },
      { f: "hrs_overhaul", op: ">=", thr: 14000,  yes: 0.20, no: -0.02 },
      { f: "age_years",    op: ">=", thr: 15,     yes: 0.16, no: -0.06 },
      { f: "age_years",    op: ">=", thr: 25,     yes: 0.16, no: -0.02 },
      { f: "missed_pm",    op: ">=", thr: 2,      yes: 0.20, no: -0.08 },
      { f: "prior_bd",     op: ">=", thr: 1,      yes: 0.16, no: -0.10 },
      { f: "prior_bd",     op: ">=", thr: 3,      yes: 0.20, no: -0.02 },
      { f: "duty_pct",     op: ">=", thr: 85,     yes: 0.16, no: -0.06 },
      { f: "duty_pct",     op: ">=", thr: 100,    yes: 0.14, no: -0.02 }
    ]
  },

  anomaly: {
    thresholdRms: 2.0,
    thresholdMax: 3.0,
    scatterX: "vibration",
    scatterY: "age_years",
    cloud: [
      [1.8, 6], [2.4, 10], [3.1, 14], [2.0, 8], [3.6, 20], [2.8, 12], [4.1, 22], [1.5, 5],
      [3.3, 16], [2.6, 9], [4.6, 26], [3.0, 13], [2.2, 7], [3.8, 18], [2.9, 11], [4.3, 24],
      [1.9, 6], [3.5, 17], [2.7, 10], [4.0, 21], [3.2, 15], [2.5, 8], [3.9, 19], [2.1, 7],
      [4.8, 28], [3.4, 16], [2.3, 9], [3.7, 18], [2.0, 12], [3.0, 14]
    ]
  },

  metrics: {
    regression: {
      auc: "0.76",
      explain: "Coefficient table: each factor's weight is fixed. One prediction = weight × your reading, summed, then the S-curve.",
      data: "Labelled failure history for this class of asset. A few hundred asset-periods.",
      failure: "Linear and additive — it will under-react to a factor that only matters past a threshold (e.g. vibration).",
      ask: "Show the coefficients and their intervals. Was vibration entered raw or transformed?"
    },
    tree: {
      auc: "0.71",
      explain: "One path of yes/no splits to a leaf. Note it keys hard on vibration ≥ 5 — a single split does the heavy lifting.",
      data: "Labelled history. Splits on continuous sensors are unstable without a lot of data.",
      failure: "Jumps at the split points; a reading of 4.9 vs 5.1 changes the branch. Over-reacts to one variable.",
      ask: "One tree or many? What is the minimum leaf size? How much does a leaf's rate move on resampling?"
    },
    ensemble: {
      auc: "0.83",
      explain: "Sum of ~13 weak rules. The contribution bars are attributed after the fact — approximate, not the mechanism.",
      data: "More labelled history, more compute. Harder to hand-audit.",
      failure: "Most accurate here, but you cannot point at one rule; and a reading far outside the training range is extrapolation.",
      ask: "Which attribution method? Show me a per-asset explanation with uncertainty."
    },
    anomaly: {
      auc: "n/a — unsupervised",
      explain: "Per-sensor distance from normal (z-score) plus an overall score. Flags 'this asset is not like the fleet', not 'about to fail'.",
      data: "No failure labels — a clean sample of healthy operation is enough.",
      failure: "No outcome meaning. Asset 3 is flagged for an odd sensor mix while scoring low on every failure model — and a slowly-degrading asset may look 'normal' for a long time.",
      ask: "What is the 'normal' baseline, how is it refreshed, and what is the false-flag rate per asset per month?"
    }
  },

  notes: {
    regression: "A weighted sum of readings through a sigmoid. Weights learned once, then fixed. The explanation is the model.",
    tree: "A learned flowchart. Fully readable path — but here one split (vibration ≥ 5) dominates, so the prediction lurches at that point.",
    ensemble: "Many weak rules each nudging the score; summed and squashed. Best accuracy, but no single path — case explanations are reconstructions.",
    anomaly: "Asks 'is this asset unlike the fleet?' rather than 'will it fail?'. Needs no failure labels. Asset 3's near-new age with very high vibration is a combination the failure models never saw.",
    explainability: "Accuracy vs explainability is a real trade-off. Regression: fully explainable, moderate accuracy, misses thresholds. Tree: inspectable, unstable, lurches. Ensemble: best accuracy, post-hoc explanation. Anomaly: different question, no labels. Pick for whether each decision must be defended to a person."
  }
};
