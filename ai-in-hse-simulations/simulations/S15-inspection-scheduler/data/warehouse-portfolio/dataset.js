/* ============================================================================
   S15 dataset — "warehouse-portfolio"
   Same risk-based scheduling pattern across a warehouse portfolio's fire,
   access and equipment assets instead of a process unit. Authored
   severity/rates; live seeded fault sequence, schedules, catches.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S15 = window.HSE_S15 || { scenarios: {} };
window.HSE_S15.scenarios["warehouse-portfolio"] = {
  id: "warehouse-portfolio",
  label: "Warehouse portfolio",
  context: "Fifteen fire, access and equipment assets across a warehouse portfolio; a fixed inspector-day budget decides how many can be visited each month.",
  budget: { min: 2, max: 12, default: 5 },
  horizon: { min: 6, max: 36, default: 24 },

  assets: [
    { key: "sprink", label: "Sprinkler valve room", severity: 5, ncRate: 0.06 },
    { key: "genroom", label: "Emergency generator room", severity: 4, ncRate: 0.08 },
    { key: "chemstore", label: "Chemical store", severity: 4, ncRate: 0.10 },
    { key: "battroom", label: "Battery charging room", severity: 4, ncRate: 0.09 },
    { key: "fireext1", label: "Fire extinguisher stations — Bay A", severity: 2, ncRate: 0.18 },
    { key: "fireext2", label: "Fire extinguisher stations — Bay B", severity: 2, ncRate: 0.17 },
    { key: "exit1", label: "Emergency exit route 1", severity: 5, ncRate: 0.05 },
    { key: "exit2", label: "Emergency exit route 2", severity: 5, ncRate: 0.04 },
    { key: "mezz", label: "Mezzanine floor edge protection", severity: 4, ncRate: 0.07 },
    { key: "roofacc", label: "Roof access hatch", severity: 3, ncRate: 0.06 },
    { key: "firstaid", label: "First aid station", severity: 2, ncRate: 0.15 },
    { key: "chargestn", label: "Forklift charging station", severity: 3, ncRate: 0.13 },
    { key: "compactor", label: "Waste compactor", severity: 3, ncRate: 0.11 },
    { key: "docklev", label: "Dock levellers", severity: 3, ncRate: 0.14 },
    { key: "officedoors", label: "Office fire doors", severity: 2, ncRate: 0.20 }
  ],

  callouts: {
    scale: "Fifteen assets and a fixed inspector-day budget — the question isn't whether to inspect everything, it's what to inspect first. Both schedules draw from the same underlying seeded random table, so the comparison isn't rigged by luck.",
    fasterDetection: "Risk-weighted scheduling catches the higher-risk half of assets younger, on average, than a uniform rotation does — that's the whole point of prioritising. It doesn't catch more faults overall, and it isn't meant to: it spends the same fixed budget concentrated where severity and historical rate say it matters most.",
    notOmniscient: "The risk-weighted schedule does not know which asset actually has a fault this month — it only uses severity, historical non-conformance rate and time since last inspection. This is a real Monte Carlo comparison, not a rigged one.",
    stillMisses: "A fixed budget is still a fixed budget, and prioritising some assets means visiting others less. Scroll to the bottom of the per-asset table — the lowest-priority rows can do worse under risk-weighting than under a plain rotation. That trade-off is deliberate, but it should be a visible, discussed decision, not a side-effect nobody checked.",
    humanCall: "Severity and historical non-conformance rate are themselves judgement calls, not universal constants. This reorders a schedule around estimates a competent person supplied — it doesn't replace the judgement that set them."
  },
  notes: {
    what: "Every month, each asset can develop a new fault at its own historical rate, and persists until it is inspected and fixed. A fixed budget can only visit some assets each month. Two strategies are compared against the identical hidden fault sequence: a uniform rotation, and a risk-weighted schedule prioritising by severity, historical rate and time since last inspection.",
    math: "Risk score = severity × historical non-conformance rate × (1 + 0.1 × months since last inspection). Each month the risk-weighted strategy inspects the top-scoring assets up to budget; the uniform strategy just cycles through all assets in order. The headline 'avg age at catch' tile compares only the higher-risk half of assets (ranked by severity × rate) between the two strategies — that half is what a risk-weighted schedule is actually optimising for.",
    real: "Authored: each asset's severity and historical non-conformance rate. Live and real: the seeded random draw table each strategy plays out against, which assets each strategy inspects each month, which faults get caught and how old they were when caught, and every summary statistic. Because an earlier catch under one strategy can prevent a later recurrence that the other strategy still sees, the two strategies' totals can differ slightly — that's a genuine consequence of scheduling, not noise."
  }
};
