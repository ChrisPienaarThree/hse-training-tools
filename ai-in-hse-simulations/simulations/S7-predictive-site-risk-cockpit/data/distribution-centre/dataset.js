/* ============================================================================
   S7 dataset — "distribution-centre"
   A deployed "site risk cockpit": leading indicators in, a predicted 30-day
   recordable probability out — plus what happens to it over time (model drift)
   and when reporting culture slips (under-reporting bias).

   AUTHORED: the logistic coefficients, each indicator's mean/SD, the drift
   terms and the health thresholds.  LIVE AND REAL: the standardisation, the
   logistic prediction, the "true" risk it is compared against, the weekly
   seeded outcome series and every gap on screen.  Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S7 = window.HSE_S7 || { scenarios: {} };
window.HSE_S7.scenarios["distribution-centre"] = {

  id: "distribution-centre",
  label: "Distribution centre",
  target: "P(a recordable injury on this site in the next 30 days)",
  baseWeek: 46,          /* where 'now' sits in the year, for the seasonal term */
  intercept: -2.20,

  indicators: [
    { key: "near_misses",      label: "Near-miss reports (last 30 d)",  min: 0,  max: 30,  step: 1,   default: 8,  mean: 8,  sd: 4,   coef: 0.30, leading: true,  underreportable: true,  driftPerWk: 0 },
    { key: "overdue_pct",      label: "Overdue corrective actions (%)", min: 0,  max: 100, step: 1,   default: 22, mean: 20, sd: 12,  coef: 0.28, leading: true,  underreportable: false, driftPerWk: 0 },
    { key: "ptw_open",         label: "High-risk permits open at once", min: 0,  max: 25,  step: 1,   default: 6,  mean: 6,  sd: 3,   coef: 0.18, leading: true,  underreportable: false, driftPerWk: 0 },
    { key: "training_pct",     label: "Training completion (%)",        min: 60, max: 100, step: 1,   default: 90, mean: 88, sd: 8,   coef: -0.26, leading: true, underreportable: false, driftPerWk: 0 },
    { key: "contractor_ratio", label: "Agency / new-starter crew (%)",  min: 0,  max: 80,  step: 1,   default: 25, mean: 22, sd: 12,  coef: 0.22, leading: true,  underreportable: false, driftPerWk: 0.006 },
    { key: "fatigue_idx",      label: "Fatigue index (overtime, 0-10)", min: 0,  max: 10,  step: 0.1, default: 4,  mean: 3.5, sd: 1.8, coef: 0.24, leading: true, underreportable: false, driftPerWk: 0 },
    { key: "heat_idx",         label: "Heat-exposure index (0-10)",     min: 0,  max: 10,  step: 0.1, default: 3,  mean: 3,  sd: 1.6, coef: 0.16, leading: true,  underreportable: false, driftPerWk: 0 }
  ],

  drift: {
    latentPerWeek: 0.010,       /* unmodelled hazard that creeps up every week since the model was fitted */
    seasonalAmp: 0.18, seasonalPeriod: 52, seasonalPhase: 0
  },
  underreport: { culturePenaltyAtWorst: 0.30 },   /* extra TRUE logit when reporting is at its floor (culture breakdown) */
  reportingFloor: 0.40,

  health: { driftWeeksWarn: 10, driftWeeksStale: 24, gapWarn: 0.02, gapStale: 0.05 },

  lagging: { label: "TRIFR, last quarter", value: "4.1", note: "A lagging indicator: it counts injuries that already happened. Useful for the board, useless for prevention — which is why it is not a model input." },

  actions: {
    near_misses:      "The leading near-miss signal is elevated — walk the area now; do not wait for the recordable-rate number to move.",
    overdue_pct:      "Clear the overdue corrective-action backlog. Each open action is a hazard someone has already identified and nobody owns.",
    ptw_open:         "Too many high-risk permits live at once — stagger the work and re-check the simultaneous-operations clashes.",
    training_pct:     "Training completion has dropped — pull the outstanding names and block those tasks until they are closed.",
    contractor_ratio: "High agency / new-starter mix — verify inductions, pair new starters with experienced staff for the fortnight.",
    fatigue_idx:      "Fatigue index is high — review the overtime roster and the consecutive-shift limits before the weekend.",
    heat_idx:         "Heat exposure is high — bring the acclimatisation plan and the work/rest cycle forward."
  },

  callouts: {
    leadingLagging: "The cockpit is fed by LEADING indicators — near-misses, overdue actions, training, crew mix. The lagging number (injury rate) tells you what already went wrong; a prediction has to run ahead of it.",
    perOrg: "These coefficients were fitted on THIS operator's history. They do not transfer to another company, another sector or another site without re-fitting and re-validating.",
    driftSilent: "The world keeps changing — new equipment, new contractors, the season — but the model's coefficients are frozen at the day it was fitted. Accuracy decays quietly. Nothing on the dashboard tells the user to retrain.",
    underreporting: "Fewer near-miss reports look like less risk. If reporting drops because people stopped bothering, the predicted risk falls while the real risk does not — false comfort, printed in green.",
    evidence: "A systematic review of 1,200+ safety-prediction studies found only two that measured whether the prediction changed a real-world outcome. Treat any accuracy claim as unproven on your data until you have back-tested it yourself."
  },

  notes: {
    what: "A logistic model turns this week's leading indicators into one probability. The factor bars show which indicators are driving it. It is a place to point attention, not a verdict.",
    drift: "'Weeks since the model was fitted' advances time. The true risk moves with the changing site; the frozen model does not follow. Retraining snaps the prediction back to the truth — until it drifts again.",
    underreport: "'Reporting culture' scales the near-miss count the model is FED, without changing the real hazard. Watch the predicted number fall below the estimated true risk. Retraining on that under-reported data just bakes the blind spot in.",
    act: "Every predicted number should resolve to an action tied to a specific driver. A cockpit that only shows a percentage trains people to glance at it and move on.",
    real: "Authored: the coefficients, means/SDs, drift terms, health thresholds. Live and real: the standardisation, the logistic prediction, the drifting 'true' risk, the seeded weekly outcomes, and every gap and health flag."
  }
};
