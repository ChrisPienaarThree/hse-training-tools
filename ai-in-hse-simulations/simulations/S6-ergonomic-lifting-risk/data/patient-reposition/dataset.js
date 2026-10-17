/* ============================================================================
   S6 dataset — "patient-reposition"
   Manual patient handling: repositioning a patient up the bed by hand, no
   slide sheet, no hoist. Same pose -> REBA + NIOSH pipeline as the warehouse
   scenario; a very different risk profile.

   Authored: input ranges, REBA tables, NIOSH tables. Live: angle derivation,
   band lookups, both scores. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S6 = window.HSE_S6 || { scenarios: {} };
window.HSE_S6.scenarios["patient-reposition"] = {

  id: "patient-reposition",
  label: "Healthcare — repositioning a patient",
  task: "A care worker slides a patient up the bed by hand — no slide sheet, no hoist — reaching across a low bed and twisting toward the head of the bed.",

  inputs: {
    load_kg:      { min: 10, max: 45,  step: 1,   default: 30 },   /* partial body weight taken by the handler */
    Vorigin_cm:   { min: 40, max: 110, step: 1,   default: 62 },   /* bed height */
    Vdest_cm:     { min: 40, max: 110, step: 1,   default: 62 },
    H_cm:         { min: 25, max: 63,  step: 1,   default: 46 },   /* reaching across the bed */
    asym_deg:     { min: 0,  max: 135, step: 5,   default: 30 },   /* twisting toward the head of the bed */
    freq_per_min: { min: 0.2, max: 6,  step: 0.2, default: 1 },
    duration_idx: { default: 2 },   /* 0: ≤1 h   1: ≤2 h   2: ≤8 h */
    coupling_idx: { default: 2 },   /* a person has no handholds -> Poor */
    shock:        { default: true },   /* the patient can slip / brace unpredictably */
    static_hold:  { default: false }
  },
  postureBias: { trunk: 8, knee: -6, shoulder: 4, neck: 5, elbow: 0, wrist: 6 },

  reba: {
    tableA: [
      1,2,3,4, 2,3,4,5, 2,4,5,6, 3,5,6,7, 4,6,7,8,
      1,2,3,4, 3,4,5,6, 4,5,6,7, 5,6,7,8, 6,7,8,9,
      3,3,5,6, 4,5,6,7, 5,6,7,8, 6,7,8,9, 7,7,8,9
    ],
    tableB: [
      1,2,2, 1,2,3,  1,2,3, 2,3,4,  3,4,5, 4,5,5,
      4,5,5, 5,6,7,  6,7,8, 7,8,8,  7,8,8, 8,9,9
    ],
    tableC: [
      [1,1,1,2,3,3,4,5,6,7,7,7],
      [1,2,2,3,4,4,5,6,6,7,7,8],
      [2,3,3,3,4,5,6,7,7,8,8,8],
      [3,4,4,4,5,6,7,8,8,9,9,9],
      [4,4,4,5,6,7,8,8,9,9,9,9],
      [6,6,6,7,8,8,9,9,10,10,10,10],
      [7,7,7,8,9,9,9,10,10,11,11,11],
      [8,8,8,9,10,10,10,10,10,11,11,11],
      [9,9,9,10,10,10,11,11,11,12,12,12],
      [10,10,10,11,11,11,11,12,12,12,12,12],
      [11,11,11,11,12,12,12,12,12,12,12,12],
      [12,12,12,12,12,12,12,12,12,12,12,12]
    ],
    actionLevels: [
      { lo: 1,  hi: 1,  band: "Negligible", tone: "ok",   action: "No action required." },
      { lo: 2,  hi: 3,  band: "Low",        tone: "ok",   action: "Change may be needed." },
      { lo: 4,  hi: 7,  band: "Medium",     tone: "warn", action: "Further investigation; change soon." },
      { lo: 8,  hi: 10, band: "High",       tone: "bad",  action: "Investigate and implement change." },
      { lo: 11, hi: 15, band: "Very high",  tone: "bad",  action: "Implement change now." }
    ]
  },

  niosh: {
    LC: 23,
    fmTable: [
      [0.2, [1.00,1.00], [0.95,0.95], [0.85,0.85]],
      [0.5, [0.97,0.97], [0.92,0.92], [0.81,0.81]],
      [1,   [0.94,0.94], [0.88,0.88], [0.75,0.75]],
      [2,   [0.91,0.91], [0.84,0.84], [0.65,0.65]],
      [3,   [0.88,0.88], [0.79,0.79], [0.55,0.55]],
      [4,   [0.84,0.84], [0.72,0.72], [0.45,0.45]],
      [5,   [0.80,0.80], [0.60,0.60], [0.35,0.35]],
      [6,   [0.75,0.75], [0.50,0.50], [0.27,0.27]]
    ],
    cmTable: { "Good": [1.00, 1.00], "Fair": [0.95, 1.00], "Poor": [0.90, 0.90] }
  },

  manual: { minutesPerAssessment: 15, workdayMin: 360 },

  limitations: [
    "A person is not a rigid load. They shift, brace and slip, so the weight and its centre of gravity change mid-lift — something neither REBA nor the NIOSH equation was built for.",
    "One 2D camera cannot see depth: the reach across the bed and the twist toward the head are estimated, and worse on an oblique ward camera.",
    "The 'load' is a guess — the fraction of body weight the handler actually takes depends on the patient's ability to assist, which changes minute to minute.",
    "Occlusion is severe: bedding, the patient and a second handler hide most of the skeleton.",
    "It scores this repositioning in isolation, not the twentieth one of a shift, nor the handler's history.",
    "Privacy and consent: a camera scoring care staff — and patients in frame — carries its own risks that the score does not show."
  ],

  notes: {
    how: "Pose estimation finds the handler's joints, reads the joint angles, bands each into a segment score, and walks the REBA tables to one action level. The worksheet shows every step; the NIOSH panel does the load-and-geometry side.",
    rubric: "REBA and the NIOSH Lifting Equation are published, checkable rubrics — the transparent half of the pipeline. The pose-estimation step that feeds them is the opaque half.",
    value: "Manual patient-handling assessments are slow and sampled. Continuous pose scoring flags which wards and which tasks are worst — a pointer for the moving-and-handling lead, not a verdict on a nurse.",
    limits: "Here the tools will read HIGH almost however the handler stands, because the task itself is the hazard. The fix is equipment — a slide sheet or a hoist — not 'lift more carefully'. The score's job is to make that case, not to coach posture.",
    real: "Authored: input ranges, REBA tables, NIOSH multiplier tables. Live and real: the angle derivation, every band lookup, the REBA score, the recommended weight limit and lifting index."
  }
};
