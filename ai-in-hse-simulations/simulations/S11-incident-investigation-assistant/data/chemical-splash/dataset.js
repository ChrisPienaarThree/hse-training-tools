/* ============================================================================
   S11 dataset — "chemical-splash"
   Same AI-drafted investigation pattern, a process-safety exposure instead of
   a yard collision. Authored narrative and drafted sections; live checklist,
   repository verification and finalize gate. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S11 = window.HSE_S11 || { scenarios: {} };
window.HSE_S11.scenarios["chemical-splash"] = {

  id: "chemical-splash",
  label: "Solvent transfer — chemical splash",
  incidentRef: "INC-2026-0091",
  narrative: "During a routine transfer of Solvent B-12 [fictional] from a 200L drum to a day-tank at 10:42, a technician disconnected the transfer hose before confirming the line had been depressurised. Residual pressure in the line caused a splash of solvent to the technician's forearm and the front of their coverall. The technician was wearing the correct gloves but had lifted their face shield to check the day-tank level gauge moments before the disconnection. They moved to the emergency eyewash/shower station and rinsed for the full exposure duration. First aid was provided on site; no hospital attendance was required. The transfer procedure requires the line to be bled to a drain point before disconnection, confirmed by a pressure gauge reading of zero; the gauge on this line has been intermittently sticking for several weeks per informal operator reports, though no fault had been formally logged.",

  timeline: [
    { time: "10:38", event: "Technician begins the transfer of Solvent B-12 from drum to day-tank", inferred: false },
    { time: "10:41", event: "Technician lifts face shield to read the day-tank level gauge", inferred: false },
    { time: "10:42", event: "Technician disconnects the transfer hose without confirming the line pressure gauge reads zero", inferred: false },
    { time: "10:42", event: "Residual pressure causes a splash of solvent to the forearm and coverall", inferred: false },
    { time: "10:43", event: "Technician moves to the emergency eyewash/shower station", inferred: true, note: "Exact time not stated — inferred from the stated rinse duration. Confirm with the technician or any CCTV timestamp." },
    { time: "10:50", event: "First aid provided on site", inferred: true, note: "Inferred typical response time; confirm against the first-aid log." }
  ],

  immediateCauses: [
    "The transfer line was disconnected before the pressure gauge was confirmed at zero",
    "Face shield was raised at the moment of disconnection",
    "The pressure gauge on this line has a known intermittent sticking fault"
  ],

  rootCauses: [
    { category: "Maintenance / Asset Integrity", text: "The gauge's intermittent sticking had been reported informally by operators for weeks with no formal fault log, so it was never scheduled for repair or calibration." },
    { category: "Procedures", text: "The transfer procedure relies on a single gauge reading with no independent check — such as a visual bleed-to-drain confirmation — before disconnection." },
    { category: "Communication / Reporting Culture", text: "There is no formal route in use for 'it sometimes sticks' observations — they stay as verbal handover comments rather than becoming a work order." }
  ],

  fiveWhys: [
    "Why was the technician splashed? Because residual pressure was still in the line at disconnection.",
    "Why was there residual pressure at disconnection? Because the gauge read — or was believed to read — zero when it was not.",
    "Why was a faulty gauge reading relied upon? Because the procedure has no independent check beyond the single gauge.",
    "Why was the fault not fixed beforehand? Because it had only been reported informally, never logged.",
    "Why does informal-only reporting happen? Because there is no easy, used-in-practice route for equipment quirks that fall short of a full near-miss report."
  ],

  contributingFactors: [
    "Face shield was raised to read the day-tank gauge at the moment of disconnection",
    "Informal reports of the gauge sticking had circulated among operators for weeks without escalation",
    "The day-tank level gauge is not visible with the face shield down, which encourages shields to be lifted"
  ],

  correctiveActions: [
    { text: "Repair or replace the pressure gauge on this transfer line and add it to the calibration schedule", rootCauseLink: "Maintenance / Asset Integrity", timeframe: "7 days" },
    { text: "Add a bleed-to-drain visual confirmation step to the transfer procedure, independent of the gauge reading", rootCauseLink: "Procedures", timeframe: "14 days" },
    { text: "Introduce a simple 'quick-flag' route for equipment quirks that turns informal reports into logged work orders", rootCauseLink: "Communication / Reporting Culture", timeframe: "30 days" }
  ],

  execSummaryDraft: "On the date of the incident, a technician was splashed with Solvent B-12 during a drum-to-day-tank transfer after disconnecting the line before residual pressure had cleared. The technician's face shield was raised at the time, so exposure reached skin despite correct gloves. A pressure gauge on the line had an unreported intermittent fault. First aid was provided on site; no hospital attendance was required. Draft corrective actions target the gauge, the transfer procedure's reliance on a single check, and how equipment quirks get reported.",

  similarIncidents: [
    { ref: "INC-2023-077", desc: "Solvent splash during a similar drum transfer; face shield raised to read a gauge.", similarity: "Same disconnection-before-depressurised pattern." },
    { ref: "INC-2022-140", desc: "Near-miss: technician noticed the line still pressurised before disconnecting; no splash.", similarity: "Same equipment type, caught before injury." },
    { ref: "INC-2020-305", desc: "Gauge found reading incorrectly after a transfer-line incident on an unrelated unit.", similarity: "Gauge reliability as a root cause." },
    { ref: "INC-2024-012", desc: "PPE gap (face shield raised) contributed to a chemical exposure during sampling.", similarity: "Face shield raised at the point of exposure." }
  ],
  /* the ground truth. INC-2020-305 is deliberately absent — the AI's third "similar incident" above
     does not correspond to any real repository record. */
  repository: [
    { ref: "INC-2023-077", title: "Solvent splash, drum transfer", date: "2023-08-14", summary: "Technician splashed during hose disconnection; line not confirmed depressurised. Face shield raised." },
    { ref: "INC-2022-140", title: "Near-miss, pressurised line", date: "2022-05-30", summary: "Technician noticed residual pressure before disconnecting; reported as a near-miss, no injury." },
    { ref: "INC-2024-012", title: "PPE gap during sampling", date: "2024-01-25", summary: "Face shield raised during a sampling task; minor exposure to skin." },
    { ref: "INC-2021-158", title: "Day-tank overfill", date: "2021-10-02", summary: "Day-tank overfilled during a transfer — different equipment and cause. Not a close match to this incident." },
    { ref: "INC-2019-266", title: "Gauge calibration drift", date: "2019-12-11", summary: "A different line's gauge found out of calibration during a routine PM check. No incident resulted." }
  ],

  callouts: {
    comet: "This mirrors a COMET-style investigation assistant: an AI drafts the mechanical parts of a report — timeline, causes, similar-case search — fast, so the investigator's time goes to judgement and verification, not formatting and searching.",
    draftEverywhere: "Every panel is marked DRAFT. None of it is a finding until an investigator has reviewed, corrected and signed for it.",
    fabricatedCase: "One of the four 'similar incidents' the AI found has no matching record in the repository. It reads exactly like the real ones — same format, a plausible reference number, a plausible one-line description. This is what a hallucinated citation looks like in an investigation tool, and it is why every citation gets checked against the source, never against how confident it sounds.",
    inferredVsStated: "Timeline entries marked 'inferred' were not in the narrative — the AI filled a gap using a typical sequence. That might be right. It is not evidence until someone confirms it.",
    humanJudgement: "Root-cause categorisation, corrective-action ownership and the executive summary's framing are judgement calls. An AI can propose a structure; only the investigation team decides what the site actually does about it."
  },
  notes: {
    what: "From one incident narrative, the assistant drafts a timeline, immediate and root causes, contributing factors, corrective actions, an executive summary, and a search for similar past incidents — the standard shape of an investigation report.",
    gate: "The report cannot be finalised until every section has been reviewed, and every similar-incident result has been checked against the repository — with anything unverifiable removed before it reaches the report.",
    real: "Authored: the narrative, every drafted section, the similar-incident search results and the repository. Live and real: checking a case reference against the repository, your review checkboxes, the include/exclude decision, and the finalize gate."
  }
};
