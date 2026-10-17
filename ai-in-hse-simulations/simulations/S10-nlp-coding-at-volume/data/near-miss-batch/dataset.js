/* ============================================================================
   S10 dataset — "near-miss-batch"
   Batch NLP auto-coding: 8 near-miss narratives coded on 4 fields at once.
   AUTHORED: each narrative's true code, a plausible wrong alternative per
   field, and field difficulty. LIVE AND REAL: the accuracy-vs-training-size
   curve, a seeded correct/wrong draw per field per narrative, the confidence
   shown, the Pareto aggregation (true vs displayed), and your review-queue
   clearances. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S10 = window.HSE_S10 || { scenarios: {} };
window.HSE_S10.scenarios["near-miss-batch"] = {
  id: "near-miss-batch",
  label: "Warehouse near-misses",
  fields: ["eventType", "primarySource", "bodyPart", "task"],
  fieldLabels: { eventType: "Event type", primarySource: "Primary source", bodyPart: "Body part (potential)", task: "Task" },
  fieldDifficulty: { eventType: 0.90, primarySource: 0.82, bodyPart: 0.75, task: 0.78 },

  narratives: [
    { id: "n1", quality: "clean", text: "Picker reached from the third rung of a ladder to grab a carton, lost balance and grabbed the rack. No injury.",
      trueCodes: { eventType: "Fall to lower level", primarySource: "Ladder", bodyPart: "N/A — no injury", task: "Order picking" },
      altCodes: { eventType: "Struck by moving object", primarySource: "Racking", bodyPart: "Hand/fingers", task: "Housekeeping" } },
    { id: "n2", quality: "poor", text: "Man carry box, floor wet, he slip, no fall, ok.",
      trueCodes: { eventType: "Slip/trip", primarySource: "Wet floor", bodyPart: "N/A — no injury", task: "Loading/unloading" },
      altCodes: { eventType: "Manual handling strain", primarySource: "Pallet/load", bodyPart: "Back", task: "Housekeeping" } },
    { id: "n3", quality: "clean", text: "Operator felt a sharp pain in the lower back while lifting a 20kg box from floor level without using the trolley.",
      trueCodes: { eventType: "Manual handling strain", primarySource: "Pallet/load", bodyPart: "Back", task: "Order picking" },
      altCodes: { eventType: "Slip/trip", primarySource: "Wet floor", bodyPart: "Ankle/foot", task: "Loading/unloading" } },
    { id: "n4", quality: "poor", text: "Forklift near hit person walk between aisle, driver see late, stop ok.",
      trueCodes: { eventType: "Struck by vehicle", primarySource: "Forklift", bodyPart: "N/A — no injury", task: "Pedestrian transit" },
      altCodes: { eventType: "Caught between", primarySource: "Pallet/load", bodyPart: "Hand/fingers", task: "Loading/unloading" } },
    { id: "n5", quality: "clean", text: "A pallet shifted on the top rack and a box fell, narrowly missing a picker below. No contact was made.",
      trueCodes: { eventType: "Struck by moving object", primarySource: "Racking", bodyPart: "N/A — no injury", task: "Order picking" },
      altCodes: { eventType: "Fall to lower level", primarySource: "Pallet/load", bodyPart: "N/A — no injury", task: "Housekeeping" } },
    { id: "n6", quality: "poor", text: "Worker hand get stuck between pallet and rack when push, small cut finger.",
      trueCodes: { eventType: "Caught between", primarySource: "Racking", bodyPart: "Hand/fingers", task: "Racking maintenance" },
      altCodes: { eventType: "Struck by moving object", primarySource: "Pallet/load", bodyPart: "Hand/fingers", task: "Order picking" } },
    { id: "n7", quality: "clean", text: "During housekeeping, an employee twisted their ankle stepping on an uneven section of the warehouse floor near bay 4.",
      trueCodes: { eventType: "Slip/trip", primarySource: "Uneven floor", bodyPart: "Ankle/foot", task: "Housekeeping" },
      altCodes: { eventType: "Manual handling strain", primarySource: "Wet floor", bodyPart: "Shoulder", task: "Loading/unloading" } },
    { id: "n8", quality: "poor", text: "Box drop from top shelf when reach, near miss no one under, ok.",
      trueCodes: { eventType: "Struck by moving object", primarySource: "Racking", bodyPart: "N/A — no injury", task: "Order picking" },
      altCodes: { eventType: "Fall to lower level", primarySource: "Ladder", bodyPart: "N/A — no injury", task: "Racking maintenance" } }
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
