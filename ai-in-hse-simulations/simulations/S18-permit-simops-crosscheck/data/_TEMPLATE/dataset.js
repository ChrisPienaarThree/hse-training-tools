/* ============================================================================
   S18 dataset TEMPLATE — copy to data/<your-scenario-id>/, no model runs.
   app.js runs two live rule checks on the candidate permit you build:
     required controls: every item in the selected work type's
       requiredControls list must be ticked
     SIMOPs clash: for each active permit in the SAME zone whose time window
       overlaps (candidate.start < permit.end AND candidate.end >
       permit.start), is {candidate.workType, permit.workType} listed in
       incompatiblePairs?
   AFTER FILLING IN: add a <script src> line in index.html + a manifest.js row.
   ============================================================================ */
window.HSE_S18 = window.HSE_S18 || { scenarios: {} };
window.HSE_S18.scenarios["TEMPLATE-ID"] = {
  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  context: "TODO — what site this is and why permits need cross-checking here.",
  zones: ["TODO zone 1", "TODO zone 2", "TODO zone 3", "TODO zone 4"],
  workTypes: [
    { key: "hot-work", label: "Hot work", requiredControls: ["TODO", "TODO", "TODO", "TODO"] }
    /* 5-6 work types total, each with 3-5 requiredControls */
  ],
  incompatiblePairs: [
    ["hot-work", "confined-space-entry"]
    /* 3-4 pairs; every pair NOT listed is treated as compatible */
  ],
  activePermits: [
    { id: "AP-1", workType: "TODO", zone: "TODO zone 1", start: 8, end: 16, description: "TODO" }
    /* 5 total, spread across zones/times so some overlap the default candidate and some don't */
  ],
  defaultCandidate: { workType: "TODO", zone: "TODO zone 1", start: 9, end: 13 },
  /* IMPORTANT: pick defaultCandidate so it deliberately zone/time-overlaps at least one active
     permit AND forms an incompatible pair with it — the sim should show a real clash on load,
     without requiring any interaction first. Hand-check the overlap and the pair membership. */
  callouts: {
    scale: "TODO",
    twoChecks: "Two separate, plain checks run here: does the checklist for this work type have every required control ticked, and does this permit's zone and time window overlap an active permit it's listed as incompatible with. Neither is a judgement call — both are lookups.",
    notOmniscient: "The incompatibility matrix only knows the pairs it was given. A genuine new hazard combination nobody has written into the matrix yet will pass this check silently.",
    stillMisses: "A tidy checklist with every box ticked is not the same as controls that are actually in place on site.",
    humanCall: "The permit issuer still decides whether to issue, defer, or add controls when a clash is flagged. The tool's job is to make sure that decision is made with the full picture — not to make it."
  },
  notes: {
    what: "TODO",
    math: "Required controls: every item ticked. SIMOPs clash: same zone AND overlapping time window AND the work-type pair is in incompatiblePairs.",
    real: "Authored: work types, required controls, the incompatibility matrix, zones and active permits. Live and real: every checklist and clash check, recomputed on every change to the candidate permit."
  }
};
