/* ============================================================================
   S8 dataset — "process-overpressure"
   A LOPA-style bowtie: threats -> prevention barriers -> top event ->
   mitigation barriers -> consequence. Barriers are in series (their
   probabilities of failure on demand multiply), same convention as a real
   Layer-of-Protection Analysis.

   AUTHORED: threat frequencies, each barrier's nominal PFD, its degraded /
   overdue-growth behaviour, and which barriers share a common cause.
   LIVE AND REAL: the PFD for the current status, the barrier-product maths,
   the live vs as-approved ("static") comparison, and the risk-matrix
   placement. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S8 = window.HSE_S8 || { scenarios: {} };
window.HSE_S8.scenarios["process-overpressure"] = {

  id: "process-overpressure",
  label: "Reactor overpressure / loss of containment",
  topEvent: "Loss of primary containment via vessel overpressure",
  consequence: { label: "Major toxic / flammable release — fire or explosion", severity: 5 },

  threats: [
    { key: "runaway",  label: "Runaway reaction", freqPerYr: 0.05 },
    { key: "blocked",  label: "Blocked outlet line", freqPerYr: 0.03 },
    { key: "coolfail", label: "Loss of cooling utility", freqPerYr: 0.04 }
  ],

  prevention: [
    { key: "alarm_response", label: "High-pressure alarm + operator response", nominalPFD: 0.10, degradedMult: 3, overdueGrowthPerWk: 0.010, commonCauseWith: null },
    { key: "sis_trip",       label: "Independent high-high pressure trip (SIS)", nominalPFD: 0.03, degradedMult: 6, overdueGrowthPerWk: 0.030, commonCauseWith: "fire_gas" },
    { key: "psv_relief",     label: "Spring-loaded relief valve (PSV)",          nominalPFD: 0.02, degradedMult: 5, overdueGrowthPerWk: 0.020, commonCauseWith: null }
  ],
  mitigation: [
    { key: "fire_gas",   label: "Fire & gas detection + ESD",        nominalPFD: 0.10, degradedMult: 4, overdueGrowthPerWk: 0.022, commonCauseWith: "sis_trip" },
    { key: "isolation",  label: "Emergency isolation valves",        nominalPFD: 0.05, degradedMult: 4, overdueGrowthPerWk: 0.018, commonCauseWith: null },
    { key: "blowdown",   label: "Blowdown to flare",                 nominalPFD: 0.03, degradedMult: 3, overdueGrowthPerWk: 0.015, commonCauseWith: null }
  ],

  commonCauseNote: "The SIS trip and the fire & gas / ESD system both terminate in the same emergency-shutdown logic solver. Good practice keeps the SIS independent of the basic control system — but F&G and ESD sharing a logic solver is common in the field, and it means these two barriers are not really independent: whatever degrades one has a real chance of degrading the other at the same time.",

  digitalTwin: {
    reviewLabel: "Last formal bowtie review / LOPA workshop",
    value: "A live version of this bowtie, fed by the maintenance system, the permit log and instrument health, catches a bypassed trip or an overdue proof-test the day it happens — not at the next scheduled review.",
    caveat: "The PFD numbers themselves are modelled estimates from generic industry data, not measurements of this specific valve on this specific day. A precise-looking number is still an estimate."
  },

  callouts: {
    staticVsDynamic: "The document that was signed off assumed every barrier healthy on the day of the workshop. It has been correct for exactly one day since. Every override, overdue test and bypass since then is a gap between the paper and the plant.",
    commonCause: "Multiplying probabilities of failure on demand assumes the barriers fail independently. Two barriers that share a power supply, a logic solver or a single competent person do not — the simple product understates the real risk whenever a shared cause is present.",
    matrixBanding: "A risk matrix has coarse bands. The live frequency can move by a large multiple and still land in the same cell — watch the ratio, not just the cell colour.",
    dataQuality: "This dashboard is only as good as the data feeding it: a bypass that isn't logged, a proof test recorded as done when it wasn't, look exactly like a healthy barrier.",
    notAReplacement: "A live bowtie tells you where to send a competent person to verify — it is a prioritisation tool, not a substitute for the physical inspection, the proof test or the permit review."
  },

  notes: {
    what: "Threats reach the top event only if they get past every prevention barrier; the top event reaches the worst consequence only if it gets past every mitigation barrier. Barriers in series multiply their probabilities of failure on demand — exactly as in a real Layer of Protection Analysis (LOPA).",
    dynamic: "This demo applies each barrier across the whole prevention (or mitigation) line for clarity. A full site bowtie usually assigns specific barriers to specific threat lines — the diagram gets busier, the maths is the same idea.",
    review: "'Weeks since review' ages every barrier set to 'Overdue test' and represents how far the signed-off, all-healthy static bowtie has drifted from what is actually true on the plant today.",
    matrix: "Likelihood bands follow typical LOPA target-frequency conventions (per year). Severity is fixed for this scenario at the worst credible consequence.",
    real: "Authored: threat frequencies, nominal PFDs, degraded/overdue behaviour, common-cause pairing. Live and real: the PFD for each current status, the series-product maths, the static-vs-live comparison, the matrix placement."
  }
};
