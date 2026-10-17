/* ============================================================================
   S15 dataset — "refinery-units"
   Risk-based inspection scheduling: a fixed inspector-day budget, 15 assets,
   a uniform rotation vs a risk-weighted schedule, compared against the
   IDENTICAL hidden sequence of randomly-arising faults for a fair Monte
   Carlo comparison.

   AUTHORED: each asset's severity and historical non-conformance rate.
   LIVE AND REAL: the seeded sequence of arising faults, which assets each
   strategy inspects each month, which faults get caught and how old they
   were when caught. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S15 = window.HSE_S15 || { scenarios: {} };
window.HSE_S15.scenarios["refinery-units"] = {
  id: "refinery-units",
  label: "Refinery units",
  context: "Fifteen assets across a process unit; a fixed inspector-day budget decides how many can be visited each month.",
  budget: { min: 2, max: 12, default: 5 },
  horizon: { min: 6, max: 36, default: 24 },

  assets: [
    { key: "v101", label: "Reactor relief system V-101", severity: 5, ncRate: 0.08 },
    { key: "p204", label: "Feed pump seal P-204", severity: 3, ncRate: 0.15 },
    { key: "t301", label: "Storage tank roof T-301", severity: 4, ncRate: 0.06 },
    { key: "e105", label: "Heat exchanger tubes E-105", severity: 4, ncRate: 0.10 },
    { key: "v220", label: "Flare KO drum V-220", severity: 5, ncRate: 0.05 },
    { key: "p501", label: "Fire water pump P-501", severity: 5, ncRate: 0.04 },
    { key: "esA", label: "Emergency shower/eyewash A", severity: 2, ncRate: 0.20 },
    { key: "esB", label: "Emergency shower/eyewash B", severity: 2, ncRate: 0.18 },
    { key: "cs12", label: "Confined space entry CS-12", severity: 4, ncRate: 0.07 },
    { key: "l9", label: "Ladder/access structure L-9", severity: 2, ncRate: 0.12 },
    { key: "ep14", label: "Electrical panel EP-14", severity: 3, ncRate: 0.09 },
    { key: "gd6", label: "Gas detector array GD-6", severity: 4, ncRate: 0.11 },
    { key: "b3", label: "Secondary containment bund B-3", severity: 3, ncRate: 0.13 },
    { key: "la2", label: "Loading arm LA-2", severity: 4, ncRate: 0.09 },
    { key: "fltf", label: "Forklift fleet check", severity: 2, ncRate: 0.16 }
  ],

  callouts: {
    scale: "Fifteen assets and a fixed inspector-day budget — the question isn't whether to inspect everything, it's what to inspect first. Both schedules draw from the same underlying seeded random table, so the comparison isn't rigged by luck.",
    fasterDetection: "Risk-weighted scheduling catches the higher-risk half of assets younger, on average, than a uniform rotation does — that's the whole point of prioritising. It doesn't catch more faults overall, and it isn't meant to: it spends the same fixed budget concentrated where severity and historical rate say it matters most.",
    notOmniscient: "The risk-weighted schedule does not know which asset actually has a fault this month — it only uses severity, historical non-conformance rate and time since last inspection. This is a real Monte Carlo comparison, not a rigged one.",
    stillMisses: "A fixed budget is still a fixed budget, and prioritising some assets means visiting others less. Scroll to the bottom of the per-asset table — the lowest-priority rows can do worse under risk-weighting than under a plain rotation. That trade-off is deliberate, but it should be a visible, discussed decision, not a side-effect nobody checked.",
    humanCall: "Severity and historical non-conformance rate are themselves judgement calls, not universal constants. This reorders a schedule around estimates a competent engineer supplied — it doesn't replace the judgement that set them."
  },
  notes: {
    what: "Every month, each asset can develop a new fault at its own historical rate, and persists until it is inspected and fixed. A fixed budget can only visit some assets each month. Two strategies are compared against the identical hidden fault sequence: a uniform rotation, and a risk-weighted schedule prioritising by severity, historical rate and time since last inspection.",
    math: "Risk score = severity × historical non-conformance rate × (1 + 0.1 × months since last inspection). Each month the risk-weighted strategy inspects the top-scoring assets up to budget; the uniform strategy just cycles through all assets in order. The headline 'avg age at catch' tile compares only the higher-risk half of assets (ranked by severity × rate) between the two strategies — that half is what a risk-weighted schedule is actually optimising for.",
    real: "Authored: each asset's severity and historical non-conformance rate. Live and real: the seeded random draw table each strategy plays out against, which assets each strategy inspects each month, which faults get caught and how old they were when caught, and every summary statistic. Because an earlier catch under one strategy can prevent a later recurrence that the other strategy still sees, the two strategies' totals can differ slightly — that's a genuine consequence of scheduling, not noise."
  }
};
