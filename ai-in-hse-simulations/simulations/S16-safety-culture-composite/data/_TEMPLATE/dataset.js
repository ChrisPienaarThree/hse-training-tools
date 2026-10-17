/* ============================================================================
   S16 dataset TEMPLATE — copy to data/<your-scenario-id>/, no model runs.
   app.js computes, live: composite = Σ(weight_i × score_i) / Σ(weight_i) for
   every site, using whatever the 4 weight sliders (or a preset) currently
   hold, then re-ranks the site table and re-renders the drill-down. Nothing
   about the composite or the ranking is authored — only the raw per-site
   component scores are.
   AFTER FILLING IN: add a <script src> line in index.html + a manifest.js row.
   ============================================================================ */
window.HSE_S16 = window.HSE_S16 || { scenarios: {} };
window.HSE_S16.scenarios["TEMPLATE-ID"] = {
  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  context: "TODO — what these sites are and why a composite score is being used to compare them.",
  components: [
    { key: "incident", label: "Lagging: incident rate",          unit: "TRIR-style score, higher = fewer incidents" },
    { key: "capa",     label: "Lagging: CAPA closure timeliness", unit: "% closed on time" },
    { key: "survey",   label: "Leading: engagement survey",      unit: "average survey score" },
    { key: "nearMiss", label: "Leading: near-miss reporting",    unit: "reports per 100 people, scaled" }
    /* keep exactly these 4 keys — app.js reads them by name */
  ],
  weightPresets: [
    { id: "lagging-first", label: "Lagging indicators first", weights: { incident: 40, capa: 30, survey: 15, nearMiss: 15 } },
    { id: "leading-first", label: "Leading indicators first", weights: { incident: 15, capa: 15, survey: 35, nearMiss: 35 } },
    { id: "balanced",      label: "Equal weight",              weights: { incident: 25, capa: 25, survey: 25, nearMiss: 25 } }
  ],
  sites: [
    { key: "s1", label: "TODO", scores: { incident: 90, capa: 85, survey: 40, nearMiss: 25 }, raw: { incident: "TODO", capa: "TODO", survey: "TODO", nearMiss: "TODO" } },
    { key: "s2", label: "TODO", scores: { incident: 50, capa: 55, survey: 88, nearMiss: 92 }, raw: { incident: "TODO", capa: "TODO", survey: "TODO", nearMiss: "TODO" } }
    /* 5-6 total. IMPORTANT: design at least one deliberate pair like s1/s2 above — one site strong
       on lagging/weak on leading, another the reverse — and hand-check that the "lagging-first" and
       "leading-first" presets actually flip which of the pair ranks #1 overall. That flip is the
       whole teaching point; a dataset without it doesn't demonstrate anything. */
  ],
  callouts: {
    scale: "TODO",
    flips: "TODO — name the specific pair of sites whose rank order flips between presets.",
    notOmniscient: "The composite is a plain weighted sum you can check with a calculator — there is no model here, no hidden inference.",
    stillMisses: "TODO — name a real risk the composite hides (e.g. low leading-indicator scores rewarded by a lagging-heavy weighting).",
    humanCall: "Someone has to decide how much each component should count. That is a values judgement, not a data question."
  },
  notes: {
    what: "TODO",
    math: "composite = Σ(weight_i × score_i) / Σ(weight_i). Drill-down shows each component's contribution, weight_i × score_i / Σ(weight_i), summing exactly to the composite.",
    real: "Authored: each site's four raw component scores. Live and real: every composite score, the ranking, and every drill-down contribution."
  }
};
