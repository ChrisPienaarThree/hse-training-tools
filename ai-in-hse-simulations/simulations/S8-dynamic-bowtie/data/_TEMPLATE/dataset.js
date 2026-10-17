/* ============================================================================
   S8 dataset TEMPLATE  —  copy this folder to data/<your-scenario-id>/

   A LOPA-style dynamic bowtie: threats -> prevention barriers -> top event ->
   mitigation barriers -> consequence. Barriers are in series, so their
   probabilities of failure on demand (PFD) MULTIPLY — same convention as a
   real Layer of Protection Analysis.

   app.js does, live from the barrier-status controls and the "weeks since
   review" slider:
     pfd(barrier, status, weeks) =
       healthy   -> nominalPFD
       degraded  -> nominalPFD * degradedMult              (capped at 1)
       overdue   -> nominalPFD * (1 + overdueGrowthPerWk * weeks)   (capped at 1)
       bypassed  -> 1.0   (no credit at all)
     topEventFreq   = Σ threats.freqPerYr  ×  Π pfd(prevention barriers)
     consequenceFreq = topEventFreq  ×  Π pfd(mitigation barriers)
     returnPeriod    = 1 / consequenceFreq   (years)
     "static" version = the same maths with every barrier forced HEALTHY and weeks = 0
                         (i.e. the bowtie exactly as it was signed off)
     likelihood band  = a fixed per-year lookup ; severity is fixed per scenario
                         -> a cell on the 5x5 risk matrix

   YOU AUTHOR: threat frequencies, each barrier's nominal PFD / degraded
   multiplier / overdue growth rate, and one common-cause pairing per
   scenario. Keep 2-3 threats, 3 prevention barriers, 3 mitigation barriers —
   it reads cleanly on a projector.

   AFTER FILLING IN
   1. add  <script src="data/<your-id>/dataset.js"></script>  to index.html
   2. add  { id: "<your-id>", label: "..." }  to data/manifest.js
   ============================================================================ */
window.HSE_S8 = window.HSE_S8 || { scenarios: {} };
window.HSE_S8.scenarios["TEMPLATE-ID"] = {

  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  topEvent: "TODO — the loss-of-control event this bowtie is built around.",
  consequence: { label: "TODO — the worst credible outcome", severity: 4 },   /* 1 (Minor) .. 5 (Catastrophic) */

  threats: [
    { key: "threat_a", label: "TODO", freqPerYr: 0.05 },
    { key: "threat_b", label: "TODO", freqPerYr: 0.03 },
    { key: "threat_c", label: "TODO", freqPerYr: 0.04 }
  ],

  /* nominalPFD: probability the barrier fails to do its job when called on, in normal ("healthy") condition.
     degradedMult: how much worse PFD gets when "Degraded". overdueGrowthPerWk: how fast PFD grows per week
     when "Overdue test" (fed by the global weeks-since-review slider). commonCauseWith: the key of ONE
     other barrier (prevention or mitigation) that shares a real dependency with this one, or null. */
  prevention: [
    { key: "barrier_1", label: "TODO", nominalPFD: 0.10, degradedMult: 3, overdueGrowthPerWk: 0.010, commonCauseWith: null },
    { key: "barrier_2", label: "TODO", nominalPFD: 0.03, degradedMult: 6, overdueGrowthPerWk: 0.030, commonCauseWith: null },
    { key: "barrier_3", label: "TODO", nominalPFD: 0.02, degradedMult: 5, overdueGrowthPerWk: 0.020, commonCauseWith: null }
  ],
  mitigation: [
    { key: "barrier_4", label: "TODO", nominalPFD: 0.10, degradedMult: 4, overdueGrowthPerWk: 0.022, commonCauseWith: null },
    { key: "barrier_5", label: "TODO", nominalPFD: 0.05, degradedMult: 4, overdueGrowthPerWk: 0.018, commonCauseWith: null },
    { key: "barrier_6", label: "TODO", nominalPFD: 0.03, degradedMult: 3, overdueGrowthPerWk: 0.015, commonCauseWith: null }
  ],

  commonCauseNote: "TODO — name the ONE pair of barriers above that share a real dependency (a power supply, a logic solver, the same person) and explain why the independence assumption behind the multiplication is optimistic for that pair.",

  digitalTwin: {
    reviewLabel: "TODO — name of the formal review this bowtie was signed off at",
    value: "TODO — what a live-fed version of this bowtie would catch that the static one cannot.",
    caveat: "TODO — a limitation of the PFD numbers themselves (estimated, not measured; varies by equipment/site)."
  },

  callouts: {
    staticVsDynamic: "TODO",
    commonCause: "TODO",
    matrixBanding: "A likelihood band can stay the same while the underlying frequency moves by a large multiple — read the ratio, not just the matrix colour.",
    dataQuality: "TODO — what an unlogged bypass looks like to this dashboard.",
    notAReplacement: "TODO — this points to where a competent person should verify; it does not replace the inspection."
  },

  notes: {
    what: "Threats reach the top event only past every prevention barrier; the top event reaches the worst consequence only past every mitigation barrier. Barriers in series multiply their PFDs — the LOPA convention.",
    dynamic: "TODO — any scenario-specific note on how barriers map to threats.",
    review: "'Weeks since review' ages every 'Overdue test' barrier and represents the gap between the signed-off static bowtie and what is true on site today.",
    matrix: "TODO — note the severity level chosen and why.",
    real: "Authored: threat frequencies, nominal PFDs, degraded/overdue behaviour, common-cause pairing. Live and real: the PFD for each current status, the series-product maths, the static-vs-live comparison, the matrix placement."
  }
};
