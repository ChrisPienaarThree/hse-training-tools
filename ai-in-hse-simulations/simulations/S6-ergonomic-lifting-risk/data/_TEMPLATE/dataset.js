/* ============================================================================
   S6 dataset TEMPLATE  —  copy this folder to data/<your-scenario-id>/

   Pose estimation -> joint angles -> a REBA-style score + the NIOSH Lifting
   Equation, from one set of sliders.

   app.js does, live from the sliders:
     1. derive joint angles (trunk / knee / shoulder / neck / elbow / wrist)
        from load / heights / reach / twist, plus your `postureBias` offsets;
     2. band each angle into a REBA segment score;
     3. walk REBA Table A (+ force) and Table B (+ coupling) into Table C,
        add the activity score -> the REBA score and action level;
     4. compute NIOSH RWL = LC × HM × VM × DM × AM × FM × CM and LI = load / RWL.

   YOU AUTHOR: the input ranges/defaults, `postureBias`, the limitation list
   and the notes. The REBA tables and NIOSH multiplier tables below are the
   STANDARD published rubrics — keep them unless you are deliberately modelling
   a different scheme (e.g. RULA).

   AFTER FILLING IN
   1. add  <script src="data/<your-id>/dataset.js"></script>  to index.html
   2. add  { id: "<your-id>", label: "..." }  to data/manifest.js
   ============================================================================ */
window.HSE_S6 = window.HSE_S6 || { scenarios: {} };
window.HSE_S6.scenarios["TEMPLATE-ID"] = {

  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  task: "TODO — one or two sentences: who is doing what, and that a camera scores it.",

  inputs: {
    load_kg:      { min: 2,  max: 30,  step: 0.5, default: 12 },
    Vorigin_cm:   { min: 5,  max: 175, step: 1,   default: 25 },   /* hand height at the start of the lift */
    Vdest_cm:     { min: 5,  max: 175, step: 1,   default: 80 },   /* hand height at the end */
    H_cm:         { min: 20, max: 63,  step: 1,   default: 40 },   /* hands forward of the mid-ankle point */
    asym_deg:     { min: 0,  max: 135, step: 5,   default: 15 },   /* twist / asymmetry angle */
    freq_per_min: { min: 0.2, max: 12, step: 0.2, default: 3 },
    duration_idx: { default: 2 },   /* 0: ≤1 h   1: ≤2 h   2: ≤8 h */
    coupling_idx: { default: 1 },   /* 0: Good   1: Fair   2: Poor */
    shock:        { default: false },   /* rapid / jerky force build-up -> +1 REBA force score */
    static_hold:  { default: false }    /* a body part held static > 1 min -> +1 REBA activity score */
  },
  /* additive degree offsets applied to the derived angles, to shape a scenario's posture */
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
    /* [ freqBreak, [FM_≤1h_Vlo, FM_≤1h_Vhi], [FM_≤2h ...], [FM_≤8h ...] ]  ; Vlo = origin < 75 cm.
       app.js takes the last row whose freqBreak ≤ the frequency slider. */
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
    cmTable: { "Good": [1.00, 1.00], "Fair": [0.95, 1.00], "Poor": [0.90, 0.90] }
  },

  manual: { minutesPerAssessment: 12, workdayMin: 360 },

  limitations: [
    "TODO — the 2D / depth limitation for this task.",
    "TODO — posture is measured, force/load is not.",
    "TODO — a snapshot, not the shift's cumulative dose.",
    "TODO — occlusion in this scene.",
    "TODO — no individual factors.",
    "TODO — a garbage-in risk specific to this task."
  ],

  notes: {
    how: "TODO — pose estimation -> joint angles -> banded -> REBA tables -> action level; the worksheet shows each step.",
    rubric: "TODO — REBA / NIOSH are transparent published rubrics; the pose step is the opaque one.",
    value: "TODO — manual assessment is slow & sampled; continuous scoring is a triage pointer for the ergonomist.",
    limits: "TODO — posture not force; snapshot not dose; generic body; 'send a human', not a finding.",
    real: "Authored: input ranges, REBA tables, NIOSH multiplier tables. Live and real: angle derivation, band lookups, the REBA score, the recommended weight limit and lifting index."
  }
};
