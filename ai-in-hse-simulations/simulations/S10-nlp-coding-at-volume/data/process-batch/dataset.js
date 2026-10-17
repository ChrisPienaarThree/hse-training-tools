/* ============================================================================
   S10 dataset — "process-batch"
   Same batch-coding pattern, process-safety near-misses instead of a
   warehouse. Authored true/alt codes + field difficulty; live accuracy curve,
   seeded draws, Pareto aggregation, review queue. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S10 = window.HSE_S10 || { scenarios: {} };
window.HSE_S10.scenarios["process-batch"] = {
  id: "process-batch",
  label: "Process-safety near-misses",
  fields: ["eventType", "primarySource", "bodyPart", "task"],
  fieldLabels: { eventType: "Event type", primarySource: "Primary source", bodyPart: "Body part (potential)", task: "Task" },
  fieldDifficulty: { eventType: 0.88, primarySource: 0.80, bodyPart: 0.85, task: 0.76 },

  narratives: [
    { id: "p1", quality: "clean", text: "During a routine transfer, a technician noted the line pressure gauge reading above the normal operating band and stopped the transfer before any release occurred.",
      trueCodes: { eventType: "Overpressure excursion", primarySource: "Transfer line", bodyPart: "N/A — no injury", task: "Solvent transfer" },
      altCodes: { eventType: "Instrumentation fault", primarySource: "Pressure gauge", bodyPart: "N/A — no injury", task: "Routine monitoring" } },
    { id: "p2", quality: "poor", text: "Valve leak small drip see on floor near tank, technician close valve, no more leak.",
      trueCodes: { eventType: "Loss of containment", primarySource: "Isolation valve", bodyPart: "N/A — no injury", task: "Routine monitoring" },
      altCodes: { eventType: "Overpressure excursion", primarySource: "Transfer line", bodyPart: "Hand/fingers", task: "Solvent transfer" } },
    { id: "p3", quality: "clean", text: "A spark from a grinding tool was observed near an open drum of flammable solvent during housekeeping; the drum was moved away before any ignition.",
      trueCodes: { eventType: "Near-miss ignition source", primarySource: "Ignition source (hot work)", bodyPart: "N/A — no injury", task: "Hot work" },
      altCodes: { eventType: "Loss of containment", primarySource: "Transfer line", bodyPart: "N/A — no injury", task: "Solvent transfer" } },
    { id: "p4", quality: "poor", text: "Worker enter tank space before gas test done, supervisor stop him at door.",
      trueCodes: { eventType: "Confined space atmosphere", primarySource: "Confined space entry point", bodyPart: "N/A — no injury", task: "Vessel entry prep" },
      altCodes: { eventType: "Procedural deviation", primarySource: "Isolation valve", bodyPart: "Face/eyes", task: "Line breaking" } },
    { id: "p5", quality: "clean", text: "The technician disconnected a sample line without following the lock-out sequence in the procedure, though the line was confirmed empty beforehand.",
      trueCodes: { eventType: "Procedural deviation", primarySource: "Isolation valve", bodyPart: "N/A — no injury", task: "Sampling" },
      altCodes: { eventType: "Loss of containment", primarySource: "Transfer line", bodyPart: "N/A — no injury", task: "Solvent transfer" } },
    { id: "p6", quality: "poor", text: "Gauge stuck same number long time, operator find out not moving, fault report.",
      trueCodes: { eventType: "Instrumentation fault", primarySource: "Pressure gauge", bodyPart: "N/A — no injury", task: "Routine monitoring" },
      altCodes: { eventType: "Overpressure excursion", primarySource: "Relief valve", bodyPart: "N/A — no injury", task: "Solvent transfer" } },
    { id: "p7", quality: "clean", text: "During a line-breaking task, the isolation valve was found to still allow a small flow through, detected before the flange was fully opened.",
      trueCodes: { eventType: "Loss of containment", primarySource: "Isolation valve", bodyPart: "N/A — no injury", task: "Line breaking" },
      altCodes: { eventType: "Procedural deviation", primarySource: "Transfer line", bodyPart: "N/A — no injury", task: "Sampling" } },
    { id: "p8", quality: "poor", text: "Relief valve make noise, technician check, seal look worn, change before test.",
      trueCodes: { eventType: "Instrumentation fault", primarySource: "Relief valve", bodyPart: "N/A — no injury", task: "Routine monitoring" },
      altCodes: { eventType: "Overpressure excursion", primarySource: "Pressure gauge", bodyPart: "N/A — no injury", task: "Solvent transfer" } }
  ],

  trainSize: { min: 10, max: 500, default: 50 },
  reviewThreshold: 0.70,

  callouts: {
    volume: "Eight narratives coded and charted here in an instant — a human coder would spend the morning just reading them, before any analysis starts.",
    trainingSize: "Coding accuracy is not fixed. It rises with how much labelled training data the model has seen — the independent NIOSH/BLS benchmark for this exact task moved from about 82% to about 90% agreement with expert coders as the training set grew. Drag the slider down and watch the same effect here.",
    distortion: "Wrong codes don't just mislabel one row. Watch the Pareto chart: at a small training size, the aggregate picture — what looks like your biggest hazard category — can be dominated by miscoded near-misses, not real ones.",
    textQuality: "The terser, second-language narratives lose accuracy faster than the well-written ones at every training size. That is a fairness problem, not just a noise problem.",
    reviewQueue: "Confidence below the line goes to a human. Nothing below the line should reach a Pareto chart, a KPI, or a resourcing decision unchecked."
  },
  notes: {
    what: "Each narrative is coded on four fields at once. The model's displayed code and its confidence are both driven by how much training data it has seen, how well-written the narrative is, and how hard that field is intrinsically — computed live, not looked up.",
    math: "accuracy(training size) follows a saturating curve — large gains from the first labelled examples, diminishing returns after. Below-threshold fields are queued for a human; the chart reflects displayed codes so you can see the distortion, not just be told about it.",
    real: "Authored: each narrative's true code, a plausible wrong alternative, and field difficulty. Live and real: the accuracy curve, a seeded correct/wrong draw per field per narrative, the confidence shown, the Pareto aggregation, and your review-queue clearances."
  }
};
