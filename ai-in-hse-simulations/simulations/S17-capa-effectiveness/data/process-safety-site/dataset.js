/* ============================================================================
   S17 dataset — "process-safety-site"
   Same two live date-arithmetic rules (overdue / closed-but-ineffective)
   applied to a process-safety corrective-action register instead of a
   general manufacturing one. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S17 = window.HSE_S17 || { scenarios: {} };
window.HSE_S17.scenarios["process-safety-site"] = {
  id: "process-safety-site",
  label: "Process safety site",
  context: "Ten corrective actions from a process unit's PSM/MOC and inspection register, as of the reference date below. An AI-assisted tracker doesn't investigate anything itself — it applies the same two rules a coordinator would, consistently, across the whole register.",
  referenceDate: "2026-08-15",
  overdueGraceDays: { min: 0, max: 30, default: 0 },
  recurrenceWindowDays: { min: 30, max: 180, default: 90 },
  capas: [
    { id: "CAPA-201", description: "Relief valve set-pressure verification, unit A", source: "Inspection finding IF-2210", raisedDate: "2026-02-01", dueDate: "2026-03-01", status: "closed", closedDate: "2026-02-28", recurrences: [] },
    { id: "CAPA-202", description: "MOC gap — unauthorised bypass valve installed", source: "Audit finding AF-3301", raisedDate: "2026-02-10", dueDate: "2026-03-10", status: "closed", closedDate: "2026-03-25", recurrences: [] },
    { id: "CAPA-203", description: "Flare header corrosion inspection", source: "Inspection finding IF-2218", raisedDate: "2026-03-01", dueDate: "2026-04-01", status: "closed", closedDate: "2026-04-01", recurrences: ["2026-04-25"] },
    { id: "CAPA-204", description: "PSV bypass procedure retrain, operations crew", source: "Incident INC-4102", raisedDate: "2026-03-10", dueDate: "2026-04-10", status: "closed", closedDate: "2026-04-05", recurrences: ["2026-07-01"] },
    { id: "CAPA-205", description: "Fixed gas detector calibration overdue, unit B", source: "Audit finding AF-3309", raisedDate: "2026-03-20", dueDate: "2026-04-20", status: "open", closedDate: null, recurrences: [] },
    { id: "CAPA-206", description: "Confined space rescue plan update", source: "Audit finding AF-3312", raisedDate: "2026-04-01", dueDate: "2026-05-01", status: "open", closedDate: null, recurrences: [] },
    { id: "CAPA-207", description: "Emergency shutdown valve test schedule renewal", source: "Scheduled review", raisedDate: "2026-05-01", dueDate: "2026-09-01", status: "open", closedDate: null, recurrences: [] },
    { id: "CAPA-208", description: "Static grounding strap replacement, loading rack", source: "Inspection finding IF-2231", raisedDate: "2026-05-10", dueDate: "2026-06-10", status: "closed", closedDate: "2026-06-08", recurrences: [] },
    { id: "CAPA-209", description: "Loading arm interlock functional testing", source: "Audit finding AF-3320", raisedDate: "2026-06-01", dueDate: "2026-07-01", status: "closed", closedDate: "2026-07-20", recurrences: [] },
    { id: "CAPA-210", description: "Secondary containment bund inspection, tank farm", source: "Audit finding AF-3325", raisedDate: "2026-06-15", dueDate: "2026-07-15", status: "open", closedDate: null, recurrences: [] }
  ],
  callouts: {
    scale: "Ten corrective actions is easy to track on a whiteboard. A process-safety CAPA backlog running into the hundreds, across turnarounds and multiple units, is exactly the volume where consistent rule-checking stops happening by hand.",
    twoRules: "Everything flagged here comes from two plain rules — days-open-past-due, and days-since-closure-to-recurrence — applied consistently. There is no model making a judgement call about any individual CAPA.",
    windowMatters: "CAPA-204 looks effective if you only check for recurrence in the 60 days after closure — the repeat incident happened 87 days later. Move the recurrence-window slider and watch it change status. The window you choose is not a neutral setting.",
    stillMisses: "This tracker only catches a recurrence if the person logging the later incident links it back to the same root cause. A recurrence recorded as an unrelated, fresh event won't be caught by any rule here — that link is still a human judgement.",
    humanCall: "'Closed' should mean the underlying cause is fixed, not that a form was signed. Flagging closed-but-ineffective actions is the easy part; deciding what to do about a corrective action that already failed once — on a process-safety-critical item — is not."
  },
  notes: {
    what: "Ten process-safety corrective actions with raised/due/closed dates and any recurrence dates. Two live rules recompute over the whole register on every slider change: overdue (open, due date + grace period has passed) and closed-but-ineffective (closed, and a recurrence fell within the recurrence window after closure).",
    math: "Real date arithmetic on the authored ISO dates — days open, days overdue, days from closure to each recurrence — computed with JavaScript's Date, not estimated. Overdue: status is open AND (referenceDate - dueDate) > graceDays. Ineffective: status is closed AND any recurrence date falls within recurrenceWindowDays of closedDate.",
    real: "Authored: each CAPA's description, dates and any recurrence dates. Live and real: every days-open/days-overdue/days-to-recurrence calculation, every overdue and ineffective flag, and both summary counts — recomputed from your slider positions every time."
  }
};
