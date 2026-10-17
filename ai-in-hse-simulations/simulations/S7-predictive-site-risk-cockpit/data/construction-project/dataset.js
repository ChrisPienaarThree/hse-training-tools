/* ============================================================================
   S7 dataset — "construction-project"
   Same cockpit, a construction build. A different coefficient profile
   (permit load and subcontractor mix dominate) and faster drift as the
   project ramps up. Authored coefficients; live logistic prediction, true
   risk, seeded weekly outcomes. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S7 = window.HSE_S7 || { scenarios: {} };
window.HSE_S7.scenarios["construction-project"] = {

  id: "construction-project",
  label: "Construction project",
  target: "P(a recordable injury on this project in the next 30 days)",
  baseWeek: 20,
  intercept: -2.00,

  indicators: [
    { key: "near_misses",         label: "Near-miss reports (last 30 d)",      min: 0,  max: 40,  step: 1,   default: 10, mean: 10, sd: 5,   coef: 0.28, leading: true,  underreportable: true,  driftPerWk: 0 },
    { key: "overdue_pct",         label: "Overdue corrective actions (%)",     min: 0,  max: 100, step: 1,   default: 25, mean: 22, sd: 13,  coef: 0.24, leading: true,  underreportable: false, driftPerWk: 0 },
    { key: "permit_load",         label: "Concurrent hot-work / dig / lift permits", min: 0, max: 40, step: 1, default: 12, mean: 12, sd: 6, coef: 0.30, leading: true, underreportable: false, driftPerWk: 0.004 },
    { key: "induction_pct",       label: "Site induction completion (%)",      min: 60, max: 100, step: 1,   default: 85, mean: 85, sd: 9,   coef: -0.22, leading: true, underreportable: false, driftPerWk: 0 },
    { key: "subcontractor_ratio", label: "Subcontractor workforce (%)",        min: 10, max: 95,  step: 1,   default: 60, mean: 55, sd: 18,  coef: 0.30, leading: true,  underreportable: false, driftPerWk: 0.006 },
    { key: "fatigue_idx",         label: "Fatigue index (0-10)",              min: 0,  max: 10,  step: 0.1, default: 5,  mean: 4,  sd: 2,   coef: 0.22, leading: true,  underreportable: false, driftPerWk: 0 },
    { key: "weather_exposure",    label: "Weather-exposure index (0-10)",      min: 0,  max: 10,  step: 0.1, default: 4,  mean: 4,  sd: 2,   coef: 0.14, leading: true,  underreportable: false, driftPerWk: 0 }
  ],

  drift: {
    latentPerWeek: 0.014,
    seasonalAmp: 0.12, seasonalPeriod: 52, seasonalPhase: 0
  },
  underreport: { culturePenaltyAtWorst: 0.32 },
  reportingFloor: 0.40,

  health: { driftWeeksWarn: 8, driftWeeksStale: 20, gapWarn: 0.02, gapStale: 0.05 },

  lagging: { label: "AFR, last quarter", value: "0.9", note: "A lagging indicator — the accident frequency rate for work already done. It cannot warn you about the next lift." },

  actions: {
    near_misses:          "The leading near-miss signal is up — get a supervisor walking the active work fronts today.",
    overdue_pct:          "Overdue actions are stacking up — close the backlog; an open action on a build site is a hazard with a deadline that passed.",
    permit_load:          "Too many high-risk permits running together — sequence hot work, excavation and lifting so they are not live in the same area at once.",
    induction_pct:        "Induction completion has slipped — no unbadged worker on site; audit the gate.",
    subcontractor_ratio:  "Subcontractor headcount is high relative to your directly-employed supervision — check the span of control and the sub's own RAMS.",
    fatigue_idx:          "Fatigue index is high — schedule pressure is showing; review shift lengths and the 12-day working rule.",
    weather_exposure:     "Weather exposure is high — re-plan outdoor high-risk tasks and check the wind limits for lifting."
  },

  callouts: {
    leadingLagging: "The model runs on leading indicators — near-misses, overdue actions, permit load, crew mix. The lagging accident rate is the scoreboard, not the steering wheel.",
    perOrg: "Fitted on this contractor's own project history. A different builder, a different job type, a different country — refit and revalidate before trusting a number.",
    driftSilent: "A project is never in steady state: more trades arrive, the programme tightens, the season turns. The frozen model falls behind and never says so.",
    underreporting: "When a project gets behind, near-miss reporting is usually the first thing to lapse. The predicted risk drops just as the real risk climbs.",
    evidence: "Independent evidence that safety-risk prediction changes outcomes is very thin (a 1,200-study review found two). Back-test on your own project data before you act on the number, and keep measuring."
  },

  notes: {
    what: "A logistic model turns the current leading indicators into one 30-day probability, with a factor breakdown. Use it to direct supervision, not to grade the project.",
    drift: "Advance 'weeks since fitted' and watch the true risk pull away from the frozen prediction as the job ramps up. Retrain to close the gap — then it opens again.",
    underreport: "'Reporting culture' cuts the near-miss count the model sees without touching the real hazard. The prediction sinks below the estimated true risk. Retraining on that data does not help.",
    act: "Tie every reading to a driver and an action. On a build site a number with no owner is noise.",
    real: "Authored: coefficients, means/SDs, drift terms, thresholds. Live and real: standardisation, the logistic prediction, the drifting true risk, the seeded weekly outcomes, every gap and flag."
  }
};
