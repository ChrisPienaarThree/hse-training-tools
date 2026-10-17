/* ============================================================================
   S17 dataset TEMPLATE — copy to data/<your-scenario-id>/, no model runs.
   app.js applies two live rules to every CAPA on every slider change:
     overdue: status "open" AND (referenceDate - dueDate) > overdueGraceDays
     ineffective: status "closed" AND any recurrence date falls within
       recurrenceWindowDays of closedDate
   All dates are real ISO strings; the app does real Date arithmetic, not a
   model call.
   AFTER FILLING IN: add a <script src> line in index.html + a manifest.js row.
   ============================================================================ */
window.HSE_S17 = window.HSE_S17 || { scenarios: {} };
window.HSE_S17.scenarios["TEMPLATE-ID"] = {
  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  context: "TODO — what this register is and why it's tracked this way.",
  referenceDate: "2026-01-01", /* the "today" the whole scenario is dated against */
  overdueGraceDays: { min: 0, max: 30, default: 0 },
  recurrenceWindowDays: { min: 30, max: 180, default: 90 },
  capas: [
    { id: "CAPA-001", description: "TODO", source: "TODO", raisedDate: "2026-01-01", dueDate: "2026-02-01", status: "closed", closedDate: "2026-01-28", recurrences: [] },
    { id: "CAPA-002", description: "TODO", source: "TODO", raisedDate: "2026-01-05", dueDate: "2026-02-05", status: "open", closedDate: null, recurrences: [] }
    /* 10-12 total. Include a spread: a couple of open-and-clearly-overdue, one open-not-yet-due,
       several closed-and-effective (recurrences: []), one closed-ineffective inside even the
       narrowest window (e.g. recurrence 15-25 days after closedDate), and one DELIBERATELY
       window-sensitive case (recurrence 75-89 days after closedDate) that flips status as the
       recurrence-window slider moves through 60-90 days — hand-check that flip. */
  ],
  callouts: {
    scale: "TODO",
    twoRules: "Everything flagged here comes from two plain rules — days-open-past-due, and days-since-closure-to-recurrence — applied consistently. There is no model making a judgement call about any individual CAPA.",
    windowMatters: "TODO — name the specific CAPA whose status flips as the recurrence-window slider moves.",
    stillMisses: "This tracker only catches a recurrence if the person logging the later incident links it back to the same root cause — that link is still a human judgement.",
    humanCall: "'Closed' should mean the underlying cause is fixed, not that a form was signed."
  },
  notes: {
    what: "TODO",
    math: "Overdue: status is open AND (referenceDate - dueDate) > graceDays. Ineffective: status is closed AND any recurrence date falls within recurrenceWindowDays of closedDate. Real Date arithmetic, recomputed live.",
    real: "Authored: each CAPA's description, dates and any recurrence dates. Live and real: every day-count calculation and every flag."
  }
};
