/* ============================================================================
   S11 dataset — "forklift-collision"
   An AI-drafted incident investigation: timeline, causes, root causes,
   corrective actions, an executive summary, and a "similar incidents" search
   against the site's case repository — one of which does not exist.

   AUTHORED: the narrative, every drafted section, the similar-incident search
   results and the repository. LIVE AND REAL: checking a case reference
   against the repository, your review checkboxes, the include/exclude
   decision, and the finalize gate. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S11 = window.HSE_S11 || { scenarios: {} };
window.HSE_S11.scenarios["forklift-collision"] = {

  id: "forklift-collision",
  label: "Yard forklift collision",
  incidentRef: "INC-2026-0183",
  narrative: "At 07:14 on a Tuesday, forklift FLT-06, operated by a contract driver on their second shift at the site, was reversing out of aisle 9 in the despatch yard carrying a stacked pallet that partially obstructed the rear view. The reversing alarm was operating. A second forklift, FLT-02, was crossing the junction from aisle 10 at the same time. The two vehicles made contact at low speed; FLT-06's load shifted and a carton struck the FLT-02 operator's arm, causing a fracture. The FLT-02 operator was taken to hospital. The site's yard traffic plan does not define priority at the aisle 9/10 junction. FLT-06's driver had completed site induction two days earlier but had not yet completed the yard-specific traffic briefing, which is normally given in week two.",

  timeline: [
    { time: "07:10", event: "FLT-06 collects a stacked pallet from aisle 9; load height obstructs the driver's rear view", inferred: false },
    { time: "07:13", event: "FLT-06 begins reversing out of aisle 9 toward the yard junction", inferred: false },
    { time: "07:13", event: "FLT-02 approaches the same junction from aisle 10", inferred: false },
    { time: "07:14", event: "The two vehicles make contact at the junction; FLT-06's load shifts", inferred: false },
    { time: "07:14", event: "A carton from the shifted load strikes the FLT-02 operator's arm", inferred: false },
    { time: "07:16", event: "First aider attends; ambulance called", inferred: true, note: "Timing not stated in the narrative — inferred from a typical response sequence. Confirm against the first-aid log." },
    { time: "08:05", event: "FLT-02 operator transported to hospital", inferred: false }
  ],

  immediateCauses: [
    "FLT-06's rear view was obstructed by the stacked load height",
    "No defined right-of-way at the aisle 9/10 junction",
    "FLT-06's driver had not yet completed the yard-specific traffic briefing"
  ],

  rootCauses: [
    { category: "Design / Layout", text: "The yard traffic plan does not assign priority at the aisle 9/10 junction — a layout gap, not a one-off driver error." },
    { category: "Training / Competence", text: "The yard-specific traffic briefing is scheduled for week two of induction, leaving a window where a new driver operates in the yard without it." },
    { category: "Procedures", text: "There is no site rule limiting load height when reversing, or requiring a banksman at blind junctions." }
  ],

  fiveWhys: [
    "Why was the FLT-02 operator injured? Because a carton from FLT-06's shifted load struck their arm.",
    "Why did the load shift? Because the two vehicles made contact at the junction.",
    "Why did the vehicles make contact? Because neither driver had right-of-way information and FLT-06's rear view was obstructed.",
    "Why was the obstructed rear view not addressed by a rule? Because there is no site rule on load height when reversing at blind junctions.",
    "Why does no such rule exist? Because the yard traffic plan has not been reviewed since aisle 10 was added last year."
  ],

  contributingFactors: [
    "The FLT-06 driver was two days into induction, on a contract rather than permanent engagement",
    "The despatch yard was operating above normal activity due to a same-day order surge",
    "The reversing alarm was functioning correctly and gave no additional warning value at this specific blind junction"
  ],

  correctiveActions: [
    { text: "Define and mark right-of-way at the aisle 9/10 junction (mirrors, signage, or a stop-and-check rule)", rootCauseLink: "Design / Layout", timeframe: "7 days" },
    { text: "Move the yard-specific traffic briefing to day one of induction, before any yard driving is authorised", rootCauseLink: "Training / Competence", timeframe: "30 days" },
    { text: "Introduce a maximum load-height rule for reversing at blind junctions, with a banksman required above that height", rootCauseLink: "Procedures", timeframe: "30 days" }
  ],

  execSummaryDraft: "On the date of the incident, a collision between two forklifts in the despatch yard resulted in a fractured arm to the FLT-02 operator. The load on FLT-06 obstructed the driver's rear view during a reversing manoeuvre at a junction with no defined right-of-way. Contributing factors include a training-sequence gap for new starters and yard congestion from a same-day order surge. Draft corrective actions target the junction layout, the induction sequence, and load-height rules for reversing.",

  similarIncidents: [
    { ref: "INC-2023-114", desc: "Near-miss: two forklifts closed rapidly at the aisle 4/5 junction; no contact.", similarity: "Same blind-junction pattern, different aisle pair." },
    { ref: "INC-2022-081", desc: "Forklift struck a pedestrian crossing at an unmarked yard junction; minor injury.", similarity: "No defined right-of-way at a yard junction." },
    { ref: "INC-2021-233", desc: "Load fell from a forklift during a sharp reversing turn near the loading dock; no injury.", similarity: "Load stability during a reversing manoeuvre." },
    { ref: "INC-2024-057", desc: "New contract driver involved in a low-speed yard collision during their first week.", similarity: "New/contract driver, early in induction." }
  ],
  /* the ground truth: what the repository actually contains. INC-2021-233 is deliberately absent —
     the AI's third "similar incident" above does not correspond to any real record. */
  repository: [
    { ref: "INC-2023-114", title: "Near-miss — aisle 4/5 junction close pass", date: "2023-06-02", summary: "Two forklifts closed to under 1m at the aisle 4/5 junction. No right-of-way markings. No injury." },
    { ref: "INC-2022-081", title: "Pedestrian struck at yard crossing", date: "2022-11-19", summary: "Forklift struck a pedestrian at an unmarked crossing point. Minor injury, three days lost time." },
    { ref: "INC-2024-057", title: "Contract driver yard collision, week one", date: "2024-03-08", summary: "New contract driver, day 4 of induction, low-speed collision with a stationary trailer. No injury." },
    { ref: "INC-2020-019", title: "Racking struck during reversing", date: "2020-09-14", summary: "Forklift reversed into racking; no load-height or junction factor. Not a close match to this incident." },
    { ref: "INC-2019-201", title: "Reversing alarm fault", date: "2019-04-22", summary: "Reversing alarm found non-functional after a near-miss. Different causal pattern to this incident." }
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
