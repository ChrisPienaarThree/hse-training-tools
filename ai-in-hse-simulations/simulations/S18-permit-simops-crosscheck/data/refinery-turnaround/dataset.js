/* ============================================================================
   S18 dataset — "refinery-turnaround"
   A rule engine, not a model: app.js checks a candidate permit's ticked
   checklist against the required-controls list for its work type, and
   checks the candidate's zone/time window for real overlap against every
   active permit, flagging a SIMOPs clash only where the (work type, work
   type) pair appears in the incompatibility matrix below.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S18 = window.HSE_S18 || { scenarios: {} };
window.HSE_S18.scenarios["refinery-turnaround"] = {
  id: "refinery-turnaround",
  label: "Refinery turnaround",
  context: "Five permits are already active across a refinery unit during a turnaround. Build a candidate permit and the checklist and SIMOPs cross-checks run live against them.",
  zones: ["Unit 12 Process Area", "Tank Farm Bund 3", "Workshop Yard", "North Pipe Rack"],
  workTypes: [
    { key: "hot-work", label: "Hot work", requiredControls: ["Fire watch present", "Gas test <10% LEL", "Fire extinguisher at site", "Combustibles cleared 10m radius"] },
    { key: "confined-space-entry", label: "Confined space entry", requiredControls: ["Atmosphere tested before entry", "Continuous gas monitoring", "Rescue plan in place", "Attendant posted at entry point"] },
    { key: "work-at-height", label: "Work at height", requiredControls: ["Fall arrest harness inspected", "Anchor point rated & tagged", "Exclusion zone below barricaded", "Rescue plan for suspended worker"] },
    { key: "excavation", label: "Excavation", requiredControls: ["Underground services located & marked", "Trench shoring/battering in place", "Spoil pile set back from edge", "Excavation inspected by competent person"] },
    { key: "electrical-isolation", label: "Electrical isolation", requiredControls: ["Circuit isolated & locked out", "Isolation verified with test meter", "Danger tags applied at isolation point", "Permit holder retains isolation key"] },
    { key: "crane-lift", label: "Crane lift", requiredControls: ["Lift plan approved", "Rigging inspected", "Exclusion zone barricaded", "Ground bearing capacity confirmed"] }
  ],
  /* SIMOPs incompatibility matrix: unordered pairs that must not run concurrently in the same zone.
     Any pair NOT listed here is treated as compatible. */
  incompatiblePairs: [
    ["hot-work", "confined-space-entry"],
    ["crane-lift", "work-at-height"],
    ["excavation", "crane-lift"]
  ],
  activePermits: [
    { id: "AP-1", workType: "confined-space-entry", zone: "Unit 12 Process Area", start: 8, end: 16, description: "Vessel V-204 internal inspection" },
    { id: "AP-2", workType: "work-at-height", zone: "North Pipe Rack", start: 7, end: 15, description: "Pipe rack insulation removal" },
    { id: "AP-3", workType: "excavation", zone: "Tank Farm Bund 3", start: 6, end: 18, description: "Bund wall repair trenching" },
    { id: "AP-4", workType: "electrical-isolation", zone: "Workshop Yard", start: 9, end: 12, description: "MCC panel replacement" },
    { id: "AP-5", workType: "hot-work", zone: "Workshop Yard", start: 13, end: 17, description: "Fabrication welding — handrail repair" }
  ],
  defaultCandidate: { workType: "hot-work", zone: "Unit 12 Process Area", start: 9, end: 13 },
  callouts: {
    scale: "A shift permit office signs off dozens of permits a day during a turnaround. A cross-check that takes a computer milliseconds — every zone, every active permit, every incompatibility pair — is exactly the kind of tedious, error-prone comparison a rule engine is good at.",
    twoChecks: "Two separate, plain checks run here: does the checklist for this work type have every required control ticked, and does this permit's zone and time window overlap an active permit it's listed as incompatible with. Neither is a judgement call — both are lookups.",
    notOmniscient: "The incompatibility matrix only knows the pairs it was given. A genuine new hazard combination nobody has written into the matrix yet will pass this check silently — the matrix is only as complete as the people who built it.",
    stillMisses: "A tidy checklist with every box ticked is not the same as controls that are actually in place on site. This cross-check verifies the paperwork is internally consistent — it has no way to confirm the fire watch is actually standing there.",
    humanCall: "The permit issuer is still the one who decides whether to issue, defer, or add extra controls when a clash is flagged. The tool's job is to make sure that decision is made with the full, correct picture in front of them — not to make it."
  },
  notes: {
    what: "Build a candidate permit (work type, zone, time window, checklist) and see it cross-checked live against a required-controls list and five already-active permits.",
    math: "Required controls: every item in the work type's requiredControls list must be ticked. SIMOPs clash: for each active permit in the SAME zone whose time window overlaps (candidate.start < permit.end AND candidate.end > permit.start), check whether {candidate.workType, permit.workType} appears in incompatiblePairs.",
    real: "Authored: work types, their required controls, the incompatibility matrix, the zones and the five active permits. Live and real: every checklist completeness check, every zone/time overlap calculation, and every SIMOPs clash — recomputed the instant you change the candidate permit."
  }
};
