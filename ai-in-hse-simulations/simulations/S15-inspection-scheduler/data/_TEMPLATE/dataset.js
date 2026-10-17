/* ============================================================================
   S15 dataset TEMPLATE — copy to data/<your-scenario-id>/, no model runs.
   app.js simulates, live, over `horizon` months on a fixed asset list:
     each month, an asset with no current fault develops one with prob ncRate (seeded)
     riskScore = severity * ncRate * (1 + 0.1 * monthsSinceLastInspection)
     uniform strategy: cycles through all assets in index order, `budget` per month
     risk-weighted strategy: inspects the `budget` highest riskScore assets that month
     an inspection clears any present fault and resets monthsSinceLastInspection to 0
   Both strategies play out over the SAME seeded random draw table for a fair comparison
   (though an earlier catch under one strategy can itself prevent a later recurrence the
   other strategy still sees — so totals can differ slightly; that's real, not noise).
   AFTER FILLING IN: add a <script src> line in index.html + a manifest.js row.
   ============================================================================ */
window.HSE_S15 = window.HSE_S15 || { scenarios: {} };
window.HSE_S15.scenarios["TEMPLATE-ID"] = {
  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  context: "TODO — what these assets are and why the budget is limited.",
  budget: { min: 2, max: 12, default: 5 },
  horizon: { min: 6, max: 36, default: 24 },
  assets: [
    { key: "a1", label: "TODO", severity: 5, ncRate: 0.08 },
    { key: "a2", label: "TODO", severity: 2, ncRate: 0.18 }
    /* 12-16 total; vary severity 2-5 and ncRate 0.04-0.20 for a realistic spread */
  ],
  callouts: {
    scale: "Fifteen assets and a fixed inspector-day budget — the question isn't whether to inspect everything, it's what to inspect first.",
    fasterDetection: "Risk-weighted scheduling catches the higher-risk half of assets younger, on average, than a uniform rotation — that's what it's optimising for. It doesn't catch more faults overall.",
    notOmniscient: "The risk-weighted schedule only uses severity, historical rate and time since last inspection — not the hidden fault state. This is a real Monte Carlo comparison.",
    stillMisses: "Prioritising some assets means visiting others less. Check the lowest-priority rows in the per-asset table — risk-weighting can do worse there than a plain rotation. That's a deliberate trade-off, and it should be a visible, discussed one.",
    humanCall: "Severity and historical rate are themselves judgement calls a competent person supplied."
  },
  notes: {
    what: "TODO",
    math: "Risk score = severity × historical non-conformance rate × (1 + 0.1 × months since last inspection). The risk-weighted strategy inspects the top-scoring assets each month up to budget; the uniform strategy cycles through all assets in order. The headline comparison tile looks only at the higher-risk half of assets (by severity × rate) — the unweighted, whole-population average age is NOT reliably better under risk-weighting, and correctly so: that's the cost of prioritising.",
    real: "Authored: each asset's severity and historical non-conformance rate. Live and real: the seeded draw table, both schedules, catches, and every summary statistic."
  }
};
