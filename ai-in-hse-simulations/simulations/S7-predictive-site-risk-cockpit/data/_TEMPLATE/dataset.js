/* ============================================================================
   S7 dataset TEMPLATE  —  copy this folder to data/<your-scenario-id>/

   A deployed "site risk cockpit". Leading indicators -> one predicted 30-day
   recordable probability. The demo then shows what happens over time (drift)
   and when reporting culture slips (under-reporting bias).

   app.js does, live from the sliders + the time / reporting controls:
     z_i        = (value_i - mean_i) / sd_i        (value_i is under-reported if the
                  indicator is `underreportable` and the reporting slider < 1)
     logit_pred = intercept(frozen) + Σ (coef_i + driftPerWk_i·refitWeeks) · z_i(reported)
     logit_true = intercept + latentPerWeek·nowWeeks + seasonal(nowWeeks)
                  + Σ (coef_i + driftPerWk_i·nowWeeks) · z_i(true)  + culturePenalty
     p_pred / p_true = sigmoid(...)   ; the gap between them is the whole lesson
     retrain -> refitWeeks := nowWeeks   (kills the drift gap; NOT the under-report gap)

   YOU AUTHOR: the indicators (ranges, means/SDs, coefficients, which drift,
   which are under-reportable), the drift terms, the health thresholds, the
   per-driver actions, the callouts and notes.

   AFTER FILLING IN
   1. add  <script src="data/<your-id>/dataset.js"></script>  to index.html
   2. add  { id: "<your-id>", label: "..." }  to data/manifest.js
   ============================================================================ */
window.HSE_S7 = window.HSE_S7 || { scenarios: {} };
window.HSE_S7.scenarios["TEMPLATE-ID"] = {

  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  target: "P(a recordable injury on this site in the next 30 days)",
  baseWeek: 30,            /* 0-51: where 'now' sits in the year, for the seasonal term */
  intercept: -2.10,        /* pick so the default indicators give your real base rate (logit(0.10) ≈ -2.2) */

  /* one row per slider. coef is in logit units per 1 SD. training/induction get a NEGATIVE coef.
     `underreportable: true` marks the indicator scaled by the reporting-culture slider.
     `driftPerWk` > 0 means that indicator's effect GROWS as the site changes (unmodelled). */
  indicators: [
    { key: "near_misses",   label: "Near-miss reports (last 30 d)",  min: 0,  max: 30,  step: 1,   default: 8,  mean: 8,  sd: 4,   coef: 0.30, leading: true,  underreportable: true,  driftPerWk: 0 },
    { key: "overdue_pct",   label: "Overdue corrective actions (%)", min: 0,  max: 100, step: 1,   default: 22, mean: 20, sd: 12,  coef: 0.28, leading: true,  underreportable: false, driftPerWk: 0 },
    { key: "crew_mix",      label: "Agency / new-starter crew (%)",  min: 0,  max: 80,  step: 1,   default: 25, mean: 22, sd: 12,  coef: 0.22, leading: true,  underreportable: false, driftPerWk: 0.006 },
    { key: "training_pct",  label: "Training completion (%)",        min: 60, max: 100, step: 1,   default: 90, mean: 88, sd: 8,   coef: -0.26, leading: true, underreportable: false, driftPerWk: 0 },
    { key: "fatigue_idx",   label: "Fatigue index (0-10)",          min: 0,  max: 10,  step: 0.1, default: 4,  mean: 3.5, sd: 1.8, coef: 0.24, leading: true, underreportable: false, driftPerWk: 0 }
    /* 5-7 indicators works well on a projector */
  ],

  drift: {
    latentPerWeek: 0.010,        /* unmodelled hazard added to the TRUE logit each week since the fit */
    seasonalAmp: 0.15, seasonalPeriod: 52, seasonalPhase: 0
  },
  underreport: { culturePenaltyAtWorst: 0.30 },   /* extra TRUE logit at the reporting floor (culture breakdown) */
  reportingFloor: 0.40,                            /* the reporting slider runs 1.00 -> this */

  health: { driftWeeksWarn: 10, driftWeeksStale: 24, gapWarn: 0.02, gapStale: 0.05 },

  lagging: { label: "TRIFR, last quarter", value: "TODO", note: "TODO — a lagging indicator, shown for contrast; not a model input." },

  /* map each indicator key to the action a high reading should trigger */
  actions: {
    near_misses:  "TODO",
    overdue_pct:  "TODO",
    crew_mix:     "TODO",
    training_pct: "TODO",
    fatigue_idx:  "TODO"
  },

  callouts: {
    leadingLagging: "TODO — leading indicators feed the model; the lagging rate is the scoreboard.",
    perOrg:         "TODO — coefficients fitted on THIS org's history; do not transfer.",
    driftSilent:    "TODO — frozen coefficients + a changing site = quiet accuracy decay.",
    underreporting: "TODO — fewer reports look like less risk; predicted falls, true does not.",
    evidence:       "A 1,200+ study review found only two measuring whether the prediction changed an outcome. Back-test on your own data."
  },

  notes: {
    what:       "TODO — one probability from the leading indicators + a factor breakdown; a place to point attention, not a verdict.",
    drift:      "TODO — advancing time; true risk moves, frozen model does not; retrain snaps it back until it drifts again.",
    underreport:"TODO — the reporting slider scales the near-miss count the model is fed; predicted sinks below true; retraining bakes the blind spot in.",
    act:        "TODO — every reading resolves to a driver and an action.",
    real:       "Authored: coefficients, means/SDs, drift terms, thresholds. Live and real: standardisation, the logistic prediction, the drifting true risk, seeded weekly outcomes, every gap and flag."
  }
};
