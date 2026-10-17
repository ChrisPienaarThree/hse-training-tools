/* ============================================================================
   S16 dataset — "manufacturing-network"
   A composite "safety culture score" is a weighted sum of 4 pre-authored,
   already-normalised (0-100) component scores per site. Nothing is fabricated
   about the composite itself — app.js computes it live from whatever weights
   the weight sliders/presets currently hold, and re-ranks the site table live.
   Only the raw component scores per site are authored (illustrative business
   data), same status as e.g. S8's bowtie nodes or S14's location definitions.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S16 = window.HSE_S16 || { scenarios: {} };
window.HSE_S16.scenarios["manufacturing-network"] = {
  id: "manufacturing-network",
  label: "Manufacturing network",
  context: "Six plants report the same four safety-culture components every quarter. A composite score is meant to make cross-site comparison simple — but simple is not the same as complete.",
  components: [
    { key: "incident",  label: "Lagging: incident rate",        unit: "TRIR-style score, higher = fewer incidents" },
    { key: "capa",      label: "Lagging: CAPA closure timeliness", unit: "% closed on time" },
    { key: "survey",    label: "Leading: engagement survey",    unit: "average survey score" },
    { key: "nearMiss",  label: "Leading: near-miss reporting",  unit: "reports per 100 staff, scaled" }
  ],
  weightPresets: [
    { id: "lagging-first", label: "Lagging indicators first", weights: { incident: 40, capa: 30, survey: 15, nearMiss: 15 } },
    { id: "leading-first", label: "Leading indicators first", weights: { incident: 15, capa: 15, survey: 35, nearMiss: 35 } },
    { id: "balanced",      label: "Equal weight",              weights: { incident: 25, capa: 25, survey: 25, nearMiss: 25 } }
  ],
  sites: [
    { key: "plantA", label: "Plant A — Riverside", scores: { incident: 92, capa: 88, survey: 45, nearMiss: 30 }, raw: { incident: "TRIR 0.4", capa: "88% on time", survey: "45/100", nearMiss: "1.1 / 100 staff" } },
    { key: "plantB", label: "Plant B — Northgate",  scores: { incident: 55, capa: 60, survey: 85, nearMiss: 90 }, raw: { incident: "TRIR 2.1", capa: "60% on time", survey: "85/100", nearMiss: "6.4 / 100 staff" } },
    { key: "plantC", label: "Plant C — Midfield",   scores: { incident: 70, capa: 70, survey: 70, nearMiss: 70 }, raw: { incident: "TRIR 1.2", capa: "70% on time", survey: "70/100", nearMiss: "3.5 / 100 staff" } },
    { key: "plantD", label: "Plant D — Eastpoint",  scores: { incident: 40, capa: 45, survey: 50, nearMiss: 35 }, raw: { incident: "TRIR 2.8", capa: "45% on time", survey: "50/100", nearMiss: "1.4 / 100 staff" } },
    { key: "plantE", label: "Plant E — Harborview", scores: { incident: 85, capa: 82, survey: 55, nearMiss: 50 }, raw: { incident: "TRIR 0.6", capa: "82% on time", survey: "55/100", nearMiss: "2.4 / 100 staff" } },
    { key: "plantF", label: "Plant F — Summit",     scores: { incident: 60, capa: 65, survey: 75, nearMiss: 72 }, raw: { incident: "TRIR 1.8", capa: "65% on time", survey: "75/100", nearMiss: "3.9 / 100 staff" } }
  ],
  callouts: {
    scale: "Six plants, one number apiece — a composite score is designed to be skimmed by someone who will never read the underlying dashboard. That's exactly why the weights behind it deserve scrutiny.",
    flips: "Plant A tops the ranking when lagging indicators (incidents, CAPA closure) are weighted heavily. Plant B tops it when leading indicators (survey, near-miss reporting) are weighted heavily. Nothing about the underlying data changed — only the weights did.",
    notOmniscient: "The composite is a plain weighted sum you can check with a calculator — there is no model here, no hidden inference. The only question is who chose the weights, and whether that choice was made deliberately or by default.",
    stillMisses: "Plant A's near-miss reporting score (30) is the lowest in the network. A lagging-heavy composite rewards Plant A anyway — a low near-miss rate can mean a strong record, or it can mean people aren't reporting. The composite alone can't tell you which.",
    humanCall: "Someone has to decide how much a survey score should count against an incident rate. That is a values judgement, not a data question — a composite score should make that judgement visible, not hide it behind one number."
  },
  notes: {
    what: "Four already-normalised (0-100) safety-culture component scores per plant. A composite score is a live weighted average of the four, recomputed and re-ranked instantly as the weight sliders (or a preset) change.",
    math: "composite = Σ(weight_i × score_i) / Σ(weight_i), where weight_i are the four slider values (not required to sum to 100 — they're normalised automatically). Drill-down shows each component's actual contribution, weight_i × score_i / Σ(weight_i), so the four contributions sum exactly to the composite.",
    real: "Authored: each plant's four raw component scores (illustrative). Live and real: every composite score, the site ranking, and every drill-down contribution — recomputed from your slider positions, not looked up from a table."
  }
};
