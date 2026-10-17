/* ============================================================================
   S18 dataset — "construction-site"
   Same rule-engine cross-check (checklist completeness + SIMOPs zone/time
   overlap against an incompatibility matrix) applied to a construction site
   instead of a refinery turnaround. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S18 = window.HSE_S18 || { scenarios: {} };
window.HSE_S18.scenarios["construction-site"] = {
  id: "construction-site",
  label: "Construction site",
  context: "Five permits are already active across a multi-storey construction site. Build a candidate permit and the checklist and SIMOPs cross-checks run live against them.",
  zones: ["Block A — Podium Level", "Basement Excavation", "Site Compound", "Tower Crane Zone"],
  workTypes: [
    { key: "hot-work", label: "Hot work", requiredControls: ["Fire watch present", "Gas test <10% LEL", "Fire extinguisher at site", "Combustibles cleared 10m radius"] },
    { key: "confined-space-entry", label: "Confined space entry", requiredControls: ["Atmosphere tested before entry", "Continuous gas monitoring", "Rescue plan in place", "Attendant posted at entry point"] },
    { key: "work-at-height", label: "Work at height", requiredControls: ["Fall arrest harness inspected", "Scaffold tagged & inspected", "Exclusion zone below barricaded", "Rescue plan for suspended worker"] },
    { key: "excavation", label: "Excavation", requiredControls: ["Underground services located & marked", "Trench shoring/battering in place", "Spoil pile set back from edge", "Excavation inspected by competent person"] },
    { key: "crane-lift", label: "Crane lift", requiredControls: ["Lift plan approved", "Rigging inspected", "Exclusion zone barricaded", "Ground bearing capacity confirmed"] },
    { key: "demolition", label: "Demolition", requiredControls: ["Structural engineer sign-off obtained", "Exclusion zone barricaded", "Services isolated before demolition", "Dust suppression in place"] }
  ],
  incompatiblePairs: [
    ["hot-work", "confined-space-entry"],
    ["work-at-height", "crane-lift"],
    ["demolition", "crane-lift"],
    ["demolition", "excavation"]
  ],
  activePermits: [
    { id: "AP-1", workType: "demolition", zone: "Block A — Podium Level", start: 7, end: 14, description: "Partial slab demolition, level 2" },
    { id: "AP-2", workType: "crane-lift", zone: "Tower Crane Zone", start: 6, end: 18, description: "Precast panel lifts, ongoing" },
    { id: "AP-3", workType: "excavation", zone: "Basement Excavation", start: 7, end: 16, description: "Basement level 2 dig" },
    { id: "AP-4", workType: "confined-space-entry", zone: "Site Compound", start: 9, end: 12, description: "Site sewage pit inspection" },
    { id: "AP-5", workType: "work-at-height", zone: "Tower Crane Zone", start: 8, end: 17, description: "Façade scaffold erection" }
  ],
  defaultCandidate: { workType: "crane-lift", zone: "Tower Crane Zone", start: 9, end: 13 },
  callouts: {
    scale: "A busy multi-storey site can have a dozen trades and permits running at once. A cross-check that takes a computer milliseconds — every zone, every active permit, every incompatibility pair — is exactly the kind of tedious, error-prone comparison a rule engine is good at.",
    twoChecks: "Two separate, plain checks run here: does the checklist for this work type have every required control ticked, and does this permit's zone and time window overlap an active permit it's listed as incompatible with. Neither is a judgement call — both are lookups.",
    notOmniscient: "The incompatibility matrix only knows the pairs it was given. A genuine new hazard combination nobody has written into the matrix yet will pass this check silently — the matrix is only as complete as the people who built it.",
    stillMisses: "A tidy checklist with every box ticked is not the same as controls that are actually in place on site. This cross-check verifies the paperwork is internally consistent — it has no way to confirm the exclusion zone barricade is actually up.",
    humanCall: "The permit issuer is still the one who decides whether to issue, defer, or add extra controls when a clash is flagged. The tool's job is to make sure that decision is made with the full, correct picture in front of them — not to make it."
  },
  notes: {
    what: "Build a candidate permit (work type, zone, time window, checklist) and see it cross-checked live against a required-controls list and five already-active permits.",
    math: "Required controls: every item in the work type's requiredControls list must be ticked. SIMOPs clash: for each active permit in the SAME zone whose time window overlaps (candidate.start < permit.end AND candidate.end > permit.start), check whether {candidate.workType, permit.workType} appears in incompatiblePairs.",
    real: "Authored: work types, their required controls, the incompatibility matrix, the zones and the five active permits. Live and real: every checklist completeness check, every zone/time overlap calculation, and every SIMOPs clash — recomputed the instant you change the candidate permit."
  }
};
