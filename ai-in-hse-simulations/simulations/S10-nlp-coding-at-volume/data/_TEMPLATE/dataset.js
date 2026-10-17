/* ============================================================================
   S10 dataset TEMPLATE — copy to data/<your-scenario-id>/, no model runs.
   app.js computes, live, per narrative x field:
     accFactor(trainSize) = base + (cap-base)*(1-exp(-trainSize/decay))   [generic, in app.js]
     correctProb = clamp(accFactor * fieldDifficulty[field] * (quality==="poor"?0.82:1), 0.05, 0.98)
     seeded draw(seed, narrativeId, field) < correctProb ? show trueCodes : show altCodes
     confidence shown = correctProb
   Below `reviewThreshold` -> queued for human review. The Pareto chart tallies
   DISPLAYED codes (what a dashboard would show) next to TRUE codes.
   AFTER FILLING IN: add a <script src> line in index.html + a manifest.js row.
   ============================================================================ */
window.HSE_S10 = window.HSE_S10 || { scenarios: {} };
window.HSE_S10.scenarios["TEMPLATE-ID"] = {
  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  fields: ["eventType", "primarySource", "bodyPart", "task"],
  fieldLabels: { eventType: "Event type", primarySource: "Primary source", bodyPart: "Body part (potential)", task: "Task" },
  fieldDifficulty: { eventType: 0.88, primarySource: 0.80, bodyPart: 0.78, task: 0.76 },   /* 0-1, higher = easier field */

  /* 6-10 narratives. Use a SHARED, small vocabulary per field across all narratives so the
     Pareto chart aggregates meaningfully. Mix "clean" and "poor" quality. */
  narratives: [
    { id: "n1", quality: "clean", text: "TODO — a well-written narrative.",
      trueCodes: { eventType: "TODO", primarySource: "TODO", bodyPart: "TODO", task: "TODO" },
      altCodes: { eventType: "TODO — a plausible wrong code", primarySource: "TODO", bodyPart: "TODO", task: "TODO" } },
    { id: "n2", quality: "poor", text: "TODO — the same kind of incident, terse / second-language.",
      trueCodes: { eventType: "TODO", primarySource: "TODO", bodyPart: "TODO", task: "TODO" },
      altCodes: { eventType: "TODO", primarySource: "TODO", bodyPart: "TODO", task: "TODO" } }
    /* ...4-8 more... */
  ],

  trainSize: { min: 10, max: 500, default: 50 },
  reviewThreshold: 0.70,

  callouts: {
    volume: "TODO — the speed/volume value proposition.",
    trainingSize: "Coding accuracy is not fixed. It rises with how much labelled training data the model has seen — the independent NIOSH/BLS benchmark for this exact task moved from about 82% to about 90% agreement with expert coders as the training set grew.",
    distortion: "TODO — how miscoding distorts the aggregate Pareto picture.",
    textQuality: "TODO — the fairness point about narrative quality.",
    reviewQueue: "Confidence below the line goes to a human. Nothing below the line should reach a Pareto chart, a KPI, or a resourcing decision unchecked."
  },
  notes: {
    what: "Each narrative is coded on several fields at once; the displayed code and its confidence are driven by training size, narrative quality and field difficulty — computed live.",
    math: "accuracy(training size) follows a saturating curve. Below-threshold fields are queued for a human; the chart reflects displayed codes so the distortion is visible, not just described.",
    real: "Authored: each narrative's true code, a plausible wrong alternative, and field difficulty. Live and real: the accuracy curve, a seeded correct/wrong draw per field per narrative, the confidence shown, the Pareto aggregation, and your review-queue clearances."
  }
};
