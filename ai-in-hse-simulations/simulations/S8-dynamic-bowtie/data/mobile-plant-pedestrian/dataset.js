/* ============================================================================
   S8 dataset — "mobile-plant-pedestrian"
   Same bowtie / LOPA maths, an everyday operational hazard instead of a
   process one: a pedestrian struck by reversing mobile plant in a yard
   (the same forklift/pedestrian pairing as S1, from the risk-modelling side).

   Authored: encounter frequencies, barrier PFDs, common-cause pairing.
   Live: PFDs for current status, the series product, static-vs-live, matrix
   placement. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S8 = window.HSE_S8 || { scenarios: {} };
window.HSE_S8.scenarios["mobile-plant-pedestrian"] = {

  id: "mobile-plant-pedestrian",
  label: "Pedestrian struck by mobile plant",
  topEvent: "A pedestrian is in the path of moving mobile plant with no avoidance in time",
  consequence: { label: "Fatality or life-changing injury", severity: 4 },

  threats: [
    { key: "unsegregated", label: "Pedestrian and plant cross paths in an unsegregated area", freqPerYr: 6 },
    { key: "reversing",    label: "Plant reverses without a clear rear view",                  freqPerYr: 4 },
    { key: "distracted",   label: "A pedestrian enters the yard distracted or on a phone",      freqPerYr: 3 }
  ],

  prevention: [
    { key: "segregation", label: "Segregation barrier / dedicated walkway", nominalPFD: 0.10, degradedMult: 6, overdueGrowthPerWk: 0.02, commonCauseWith: null },
    { key: "proximity",   label: "Proximity-detection system (camera/radar)", nominalPFD: 0.20, degradedMult: 3, overdueGrowthPerWk: 0.015, commonCauseWith: null },
    { key: "banksman",    label: "Traffic marshal / banksman",             nominalPFD: 0.15, degradedMult: 3, overdueGrowthPerWk: 0.010, commonCauseWith: "estop" }
  ],
  mitigation: [
    { key: "alarm",  label: "Reversing alarm + amber beacon",  nominalPFD: 0.30, degradedMult: 2.5, overdueGrowthPerWk: 0.010, commonCauseWith: null },
    { key: "estop",  label: "Operator awareness / emergency stop", nominalPFD: 0.40, degradedMult: 2,   overdueGrowthPerWk: 0.006, commonCauseWith: "banksman" },
    { key: "speed",  label: "Site speed limit in pedestrian areas", nominalPFD: 0.50, degradedMult: 1.6, overdueGrowthPerWk: 0.004, commonCauseWith: null }
  ],

  commonCauseNote: "The banksman and the operator's own awareness / e-stop response both ultimately depend on the SAME people staying alert on the same shift. A fatigued or distracted crew quietly weakens both barriers at once — it is a human common cause, not an equipment one, and it is easy to miss because the two look like independent layers on paper.",

  digitalTwin: {
    reviewLabel: "Last formal traffic-management review",
    value: "A live version of this bowtie, fed by permit-to-work data, banksman rostering and proximity-system health, flags the shift where the segregation barrier has a logged defect AND the banksman position is unfilled — the combination a paper review only catches by chance.",
    caveat: "The barrier PFDs here are estimates of how often each control fails to prevent the next step, not measurements — 'proximity system' effectiveness in particular varies a great deal by product and by site layout."
  },

  callouts: {
    staticVsDynamic: "The traffic-management plan assumed the barrier was intact and the banksman position filled. It has been true for exactly as long as nothing changed since sign-off — which on a live site is rarely more than a shift.",
    commonCause: "Two barriers that both rely on the same tired crew are not independent, however separately they are drawn in the bowtie. The simple probability product understates the risk whenever a shared human or equipment cause is present.",
    matrixBanding: "A likelihood band can stay the same while the underlying frequency moves by 10× or more. Read the ratio on the tile, not just the matrix colour.",
    dataQuality: "A barrier is only 'healthy' in this dashboard if someone logged that it is. An unlogged gap in the segregation fence is invisible to the model and to the workforce walking past it.",
    notAReplacement: "This points the safety team at where to walk and what to check today — it does not replace walking the fence line or checking who is actually on banksman duty."
  },

  notes: {
    what: "Hazardous encounters reach the top event only if they get past every prevention barrier; the top event becomes a fatality only if it gets past every mitigation barrier. Barriers in series multiply their probabilities of failure — the same convention as process-safety LOPA, applied to an everyday operational hazard.",
    dynamic: "Every barrier here applies across the whole line for clarity. On a real site some controls are location- or shift-specific — the diagram would show that detail; the maths is the same idea.",
    review: "'Weeks since review' ages every barrier set to 'Overdue test' and represents how far the signed-off traffic-management plan has drifted from today's actual site conditions.",
    matrix: "Likelihood bands are on the same per-year scale as the process scenario. Severity is fixed at 'Major' (single fatality / life-changing injury) for this hazard.",
    real: "Authored: encounter frequencies, nominal PFDs, degraded/overdue behaviour, common-cause pairing. Live and real: the PFD for each current status, the series-product maths, the static-vs-live comparison, the matrix placement."
  }
};
