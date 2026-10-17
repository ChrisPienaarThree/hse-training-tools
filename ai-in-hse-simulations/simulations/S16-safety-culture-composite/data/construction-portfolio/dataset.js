/* ============================================================================
   S16 dataset — "construction-portfolio"
   Same composite-score mechanic across a construction project portfolio
   instead of a plant network. Authored raw component scores; live weighted
   composite, ranking and drill-down. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S16 = window.HSE_S16 || { scenarios: {} };
window.HSE_S16.scenarios["construction-portfolio"] = {
  id: "construction-portfolio",
  label: "Construction portfolio",
  context: "Six live projects report the same four safety-culture components monthly to head office. A composite score is meant to flag which site needs attention first — but the flag depends entirely on how the four components are weighted.",
  components: [
    { key: "incident",  label: "Lagging: incident rate",         unit: "TRIR-style score, higher = fewer incidents" },
    { key: "capa",      label: "Lagging: CAPA closure timeliness", unit: "% closed on time" },
    { key: "survey",    label: "Leading: engagement survey",     unit: "average survey score" },
    { key: "nearMiss",  label: "Leading: near-miss reporting",   unit: "reports per 100 workers, scaled" }
  ],
  weightPresets: [
    { id: "lagging-first", label: "Lagging indicators first", weights: { incident: 40, capa: 30, survey: 15, nearMiss: 15 } },
    { id: "leading-first", label: "Leading indicators first", weights: { incident: 15, capa: 15, survey: 35, nearMiss: 35 } },
    { id: "balanced",      label: "Equal weight",              weights: { incident: 25, capa: 25, survey: 25, nearMiss: 25 } }
  ],
  sites: [
    { key: "p1", label: "Project 1 — Riverside Tower",   scores: { incident: 90, capa: 85, survey: 40, nearMiss: 25 }, raw: { incident: "TRIR 0.5", capa: "85% on time", survey: "40/100", nearMiss: "0.9 / 100 workers" } },
    { key: "p2", label: "Project 2 — Harbour Bridge Upgrade", scores: { incident: 50, capa: 55, survey: 88, nearMiss: 92 }, raw: { incident: "TRIR 2.3", capa: "55% on time", survey: "88/100", nearMiss: "6.8 / 100 workers" } },
    { key: "p3", label: "Project 3 — Midtown Retail Fitout", scores: { incident: 65, capa: 65, survey: 65, nearMiss: 65 }, raw: { incident: "TRIR 1.4", capa: "65% on time", survey: "65/100", nearMiss: "3.3 / 100 workers" } },
    { key: "p4", label: "Project 4 — Outer Ring Road",   scores: { incident: 35, capa: 40, survey: 45, nearMiss: 30 }, raw: { incident: "TRIR 3.2", capa: "40% on time", survey: "45/100", nearMiss: "1.2 / 100 workers" } },
    { key: "p5", label: "Project 5 — Eastside Depot",    scores: { incident: 78, capa: 75, survey: 58, nearMiss: 52 }, raw: { incident: "TRIR 0.8", capa: "75% on time", survey: "58/100", nearMiss: "2.5 / 100 workers" } },
    { key: "p6", label: "Project 6 — Solar Farm Extension", scores: { incident: 55, capa: 60, survey: 78, nearMiss: 74 }, raw: { incident: "TRIR 2.0", capa: "60% on time", survey: "78/100", nearMiss: "4.6 / 100 workers" } }
  ],
  callouts: {
    scale: "Six live projects, one composite score apiece — a head-office dashboard is built to be skimmed, which is exactly why the weighting choice behind it matters so much.",
    flips: "Project 1 tops the portfolio ranking when lagging indicators are weighted heavily. Project 2 tops it when leading indicators are weighted heavily. The underlying site data never changes — only the weights do, and the 'worst' project in the portfolio can change with it.",
    notOmniscient: "The composite is a plain weighted sum you can check with a calculator — there is no model here, no hidden inference. The only real question is who chose the weights, and whether that choice was deliberate.",
    stillMisses: "Project 1's near-miss reporting score (25) is the lowest in the portfolio. A lagging-heavy composite rewards Project 1 anyway — a low near-miss rate can mean a genuinely quiet site, or a site where people don't report. The composite alone can't distinguish the two.",
    humanCall: "Someone has to decide how much a survey score should count against an incident rate. That's a values judgement a competent person makes deliberately — a composite score should make that judgement visible, not hide it inside one number."
  },
  notes: {
    what: "Four already-normalised (0-100) safety-culture component scores per project. A composite score is a live weighted average of the four, recomputed and re-ranked instantly as the weight sliders (or a preset) change.",
    math: "composite = Σ(weight_i × score_i) / Σ(weight_i), where weight_i are the four slider values (not required to sum to 100 — they're normalised automatically). Drill-down shows each component's actual contribution, weight_i × score_i / Σ(weight_i), so the four contributions sum exactly to the composite.",
    real: "Authored: each project's four raw component scores (illustrative). Live and real: every composite score, the portfolio ranking, and every drill-down contribution — recomputed from your slider positions, not looked up from a table."
  }
};
