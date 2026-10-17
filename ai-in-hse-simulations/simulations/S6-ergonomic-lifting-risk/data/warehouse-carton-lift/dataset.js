/* ============================================================================
   S6 dataset — "warehouse-carton-lift"
   Pose estimation -> joint angles -> a REBA-style score + the NIOSH Lifting
   Equation, from the same slider inputs.

   AUTHORED: the input ranges, the REBA lookup tables, and the NIOSH frequency
   and coupling multiplier tables (all standard, published rubrics).
   LIVE AND REAL: the joint-angle derivation, every band lookup, the REBA
   score, the NIOSH recommended weight limit and lifting index — computed from
   the sliders by app.js and checkable by hand. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S6 = window.HSE_S6 || { scenarios: {} };
window.HSE_S6.scenarios["warehouse-carton-lift"] = {

  id: "warehouse-carton-lift",
  label: "Warehouse — carton from a pallet",
  task: "A picker lifts a carton from a pallet and places it on a conveyor. The camera watches the workstation; pose estimation scores every lift.",

  inputs: {
    load_kg:      { min: 2,  max: 30,  step: 0.5, default: 14 },
    Vorigin_cm:   { min: 5,  max: 175, step: 1,   default: 20 },   /* hand height at the pallet */
    Vdest_cm:     { min: 5,  max: 175, step: 1,   default: 80 },   /* hand height at the conveyor */
    H_cm:         { min: 20, max: 63,  step: 1,   default: 40 },   /* hands forward of mid-ankle */
    asym_deg:     { min: 0,  max: 120, step: 5,   default: 15 },   /* twist / asymmetry */
    freq_per_min: { min: 0.2, max: 12, step: 0.2, default: 3 },
    duration_idx: { default: 2 },   /* 0: ≤1 h   1: ≤2 h   2: ≤8 h */
    coupling_idx: { default: 1 },   /* 0: Good   1: Fair   2: Poor */
    shock:        { default: false },
    static_hold:  { default: false }
  },
  postureBias: { trunk: 0, knee: 0, shoulder: 0, neck: 0, elbow: 0, wrist: 0 },

  reba: {
    /* Table A  index = (neck-1)*20 + (trunk-1)*4 + (legs-1)   neck 1-3, trunk 1-5, legs 1-4 */
    tableA: [
      1,2,3,4, 2,3,4,5, 2,4,5,6, 3,5,6,7, 4,6,7,8,
      1,2,3,4, 3,4,5,6, 4,5,6,7, 5,6,7,8, 6,7,8,9,
      3,3,5,6, 4,5,6,7, 5,6,7,8, 6,7,8,9, 7,7,8,9
    ],
    /* Table B  index = (upperArm-1)*6 + (lowerArm-1)*3 + (wrist-1)   ua 1-6, la 1-2, wr 1-3 */
    tableB: [
      1,2,2, 1,2,3,  1,2,3, 2,3,4,  3,4,5, 4,5,5,
      4,5,5, 5,6,7,  6,7,8, 7,8,8,  7,8,8, 8,9,9
    ],
    /* Table C  [scoreA-1][scoreB-1]   each 1-12 */
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
    /* [ freqBreak, [FM_≤1h_Vlo, FM_≤1h_Vhi], [FM_≤2h ...], [FM_≤8h ...] ]  ; Vlo = origin < 75 cm */
    fmTable: [
      [0.2, [1.00,1.00], [0.95,0.95], [0.85,0.85]],
      [0.5, [0.97,0.97], [0.92,0.92], [0.81,0.81]],
      [1,   [0.94,0.94], [0.88,0.88], [0.75,0.75]],
      [2,   [0.91,0.91], [0.84,0.84], [0.65,0.65]],
      [3,   [0.88,0.88], [0.79,0.79], [0.55,0.55]],
      [4,   [0.84,0.84], [0.72,0.72], [0.45,0.45]],
      [5,   [0.80,0.80], [0.60,0.60], [0.35,0.35]],
      [6,   [0.75,0.75], [0.50,0.50], [0.27,0.27]],
      [7,   [0.70,0.70], [0.42,0.42], [0.22,0.22]],
      [8,   [0.60,0.60], [0.35,0.35], [0.18,0.18]],
      [9,   [0.52,0.52], [0.30,0.30], [0.00,0.15]],
      [10,  [0.45,0.45], [0.26,0.26], [0.00,0.13]],
      [11,  [0.41,0.41], [0.00,0.23], [0.00,0.00]],
      [12,  [0.37,0.37], [0.00,0.21], [0.00,0.00]]
    ],
    /* coupling multiplier [Vlo, Vhi] */
    cmTable: { "Good": [1.00, 1.00], "Fair": [0.95, 1.00], "Poor": [0.90, 0.90] }
  },

  manual: { minutesPerAssessment: 12, workdayMin: 360 },

  limitations: [
    "One 2D camera cannot see depth: trunk flexion and twist are estimates, not measurements — and the error grows on an oblique camera angle.",
    "The load is entered, not sensed. The model scores your posture; it cannot feel whether the carton is 8 kg or 18 kg.",
    "It scores a moment. MSD risk is about the cumulative dose across a shift — 200 'medium' lifts is not one 'medium' lift.",
    "Occlusion: the carton hides the hands and wrists; the torso hides the far leg. Those joints are inferred.",
    "No individual factors — stature, age, prior back injury, end-of-shift fatigue — are in the score.",
    "Garbage in: a wrong frequency or a wrong real load makes both the REBA activity score and the NIOSH lifting index wrong, with full confidence."
  ],

  notes: {
    how: "Pose estimation locates the body joints in each frame (a skeleton). Joint angles are read off the skeleton, each angle is banded into a segment score, and the segment scores are combined through the REBA lookup tables into one action level. Every step is shown in the worksheet.",
    rubric: "REBA and the NIOSH Lifting Equation are transparent, standardised rubrics. Unlike the pose-estimation step, nothing is hidden: same inputs, same score, every time — and you can check it by hand.",
    value: "A trained assessor takes ~10–15 minutes per posture and samples a handful of tasks. Pose-based scoring runs on every lift, every worker, every shift — so it is a triage tool: it tells the ergonomist which workstations to go and assess properly.",
    limits: "It measures posture, not force; a snapshot, not a shift's dose; a generic body, not this worker. Treat a high score as 'send a human', not as a finding — and never as grounds for discipline.",
    real: "Authored: the input ranges, the REBA tables, the NIOSH multiplier tables. Live and real: the joint-angle derivation, every band lookup, the REBA score, the recommended weight limit and the lifting index."
  }
};
