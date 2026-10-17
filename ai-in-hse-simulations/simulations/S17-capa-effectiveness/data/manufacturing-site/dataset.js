/* ============================================================================
   S17 dataset — "manufacturing-site"
   Real date arithmetic, not a model: app.js parses each CAPA's authored
   dates and computes, live, whether it is overdue (open past its due date,
   beyond a grace-period slider) or "closed but ineffective" (a similar
   incident recurred within a recurrence-window slider of its closure date).
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S17 = window.HSE_S17 || { scenarios: {} };
window.HSE_S17.scenarios["manufacturing-site"] = {
  id: "manufacturing-site",
  label: "Manufacturing site",
  context: "Ten corrective actions from a manufacturing site's incident and audit register, as of the reference date below. An AI-assisted tracker doesn't investigate anything itself — it applies the same two rules a coordinator would, consistently, across the whole register.",
  referenceDate: "2026-06-30",
  overdueGraceDays: { min: 0, max: 30, default: 0 },
  recurrenceWindowDays: { min: 30, max: 180, default: 90 },
  capas: [
    { id: "CAPA-101", description: "Guarding missing on conveyor belt infeed", source: "Near-miss NM-0142", raisedDate: "2026-01-05", dueDate: "2026-02-05", status: "closed", closedDate: "2026-02-01", recurrences: [] },
    { id: "CAPA-102", description: "Blind-corner mirrors for forklift routes", source: "Near-miss NM-0151", raisedDate: "2026-01-10", dueDate: "2026-02-10", status: "closed", closedDate: "2026-02-20", recurrences: [] },
    { id: "CAPA-103", description: "Spill containment procedure retrain", source: "Incident INC-0033", raisedDate: "2026-02-01", dueDate: "2026-03-01", status: "closed", closedDate: "2026-03-01", recurrences: ["2026-03-20"] },
    { id: "CAPA-104", description: "Machine guarding interlock repair", source: "Incident INC-0037", raisedDate: "2026-02-15", dueDate: "2026-03-15", status: "closed", closedDate: "2026-03-10", recurrences: ["2026-06-01"] },
    { id: "CAPA-105", description: "Lock-out/tag-out procedure gap on line 4", source: "Audit finding AF-0091", raisedDate: "2026-03-01", dueDate: "2026-04-01", status: "open", closedDate: null, recurrences: [] },
    { id: "CAPA-106", description: "Chemical container labelling non-compliance", source: "Audit finding AF-0094", raisedDate: "2026-03-10", dueDate: "2026-04-10", status: "open", closedDate: null, recurrences: [] },
    { id: "CAPA-107", description: "Fall protection anchor point re-certification", source: "Scheduled audit", raisedDate: "2026-04-01", dueDate: "2026-07-15", status: "open", closedDate: null, recurrences: [] },
    { id: "CAPA-108", description: "Confined space entry permit process update", source: "Audit finding AF-0099", raisedDate: "2026-04-15", dueDate: "2026-05-15", status: "closed", closedDate: "2026-05-10", recurrences: [] },
    { id: "CAPA-109", description: "Overhead crane pre-use inspection checklist revision", source: "Near-miss NM-0168", raisedDate: "2026-05-01", dueDate: "2026-06-01", status: "closed", closedDate: "2026-06-25", recurrences: [] },
    { id: "CAPA-110", description: "Blocked emergency exit routes, warehouse bay 3", source: "Audit finding AF-0103", raisedDate: "2026-05-15", dueDate: "2026-06-15", status: "open", closedDate: null, recurrences: [] }
  ],
  callouts: {
    scale: "Ten corrective actions is easy to track on a whiteboard. A few hundred, across a network of sites, is exactly the volume where consistent rule-checking stops happening by hand — and starts silently sliding.",
    twoRules: "Everything flagged here comes from two plain rules — days-open-past-due, and days-since-closure-to-recurrence — applied consistently. There is no model making a judgement call about any individual CAPA.",
    windowMatters: "CAPA-104 looks effective if you only check for recurrence in the 60 days after closure — the repeat incident happened 83 days later. Move the recurrence-window slider and watch it change status. The window you choose is not a neutral setting.",
    stillMisses: "This tracker only catches a recurrence if the person logging the later incident links it back to the same root cause. A recurrence recorded as an unrelated, fresh incident won't be caught by any rule here — that link is still a human judgement.",
    humanCall: "'Closed' should mean the underlying cause is fixed, not that a form was signed. Flagging closed-but-ineffective actions is the easy part; deciding what to do about a corrective action that already failed once is not."
  },
  notes: {
    what: "Ten corrective actions with raised/due/closed dates and any recurrence dates. Two live rules recompute over the whole register on every slider change: overdue (open, due date + grace period has passed) and closed-but-ineffective (closed, and a recurrence fell within the recurrence window after closure).",
    math: "Real date arithmetic on the authored ISO dates — days open, days overdue, days from closure to each recurrence — computed with JavaScript's Date, not estimated. Overdue: status is open AND (referenceDate - dueDate) > graceDays. Ineffective: status is closed AND any recurrence date falls within recurrenceWindowDays of closedDate.",
    real: "Authored: each CAPA's description, dates and any recurrence dates. Live and real: every days-open/days-overdue/days-to-recurrence calculation, every overdue and ineffective flag, and both summary counts — recomputed from your slider positions every time."
  }
};
