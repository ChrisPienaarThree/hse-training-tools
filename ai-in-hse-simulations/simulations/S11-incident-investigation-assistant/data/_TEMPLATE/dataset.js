/* ============================================================================
   S11 dataset TEMPLATE  —  copy this folder to data/<your-scenario-id>/

   An AI-drafted incident investigation for one narrative: timeline, immediate
   causes, root causes (categorised + a 5-whys chain), contributing factors,
   draft corrective actions, an executive summary, and a "similar incidents"
   search against a repository. ONE similar incident must be a fabrication —
   a plausible reference number with no matching repository record.

   RULES
   - Everything is PRE-AUTHORED. No model runs.
   - `timeline` entries not explicitly stated in the narrative should carry
     `inferred: true` and a `note` saying what to confirm and how.
   - `similarIncidents` needs exactly 4 entries; `repository` needs at least 4
     REAL entries matching 3 of them (plus 1-2 extra unrelated real entries
     for realism) and must NOT contain an entry for the 4th "similar
     incident" — that is the fabricated one.
   - Keep each drafted list to 3-5 items so it reads cleanly on a projector.

   AFTER FILLING IN
   1. add  <script src="data/<your-id>/dataset.js"></script>  to index.html
   2. add  { id: "<your-id>", label: "..." }  to data/manifest.js
   ============================================================================ */
window.HSE_S11 = window.HSE_S11 || { scenarios: {} };
window.HSE_S11.scenarios["TEMPLATE-ID"] = {

  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  incidentRef: "INC-YYYY-NNNN",
  narrative: "TODO — the incident narrative, written as it would be reported: what happened, who was involved, what safeguards were or weren't in place, any known pre-existing equipment or procedural issue.",

  timeline: [
    { time: "TODO", event: "TODO — stated in the narrative", inferred: false },
    { time: "TODO", event: "TODO — NOT stated; a reasonable inference", inferred: true, note: "TODO — what to confirm and how." }
  ],

  immediateCauses: ["TODO", "TODO", "TODO"],

  rootCauses: [
    { category: "TODO e.g. Design / Layout", text: "TODO" },
    { category: "TODO e.g. Training / Competence", text: "TODO" },
    { category: "TODO e.g. Procedures", text: "TODO" }
  ],

  fiveWhys: [
    "Why did [the injury/loss] happen? Because ...",
    "Why did that happen? Because ...",
    "Why did that happen? Because ...",
    "Why did that happen? Because ...",
    "Why does that underlying condition exist? Because ..."
  ],

  contributingFactors: ["TODO", "TODO", "TODO"],

  correctiveActions: [
    { text: "TODO", rootCauseLink: "TODO — matches a rootCauses.category", timeframe: "TODO e.g. 7 days" },
    { text: "TODO", rootCauseLink: "TODO", timeframe: "TODO" }
  ],

  execSummaryDraft: "TODO — one paragraph: what happened, the key causal thread, what the draft actions target.",

  similarIncidents: [
    { ref: "INC-YYYY-NNNN", desc: "TODO", similarity: "TODO — why the AI judged this similar" },
    { ref: "INC-YYYY-NNNN", desc: "TODO", similarity: "TODO" },
    { ref: "INC-YYYY-NNNN", desc: "TODO — the FABRICATED one", similarity: "TODO — still a plausible-sounding match" },
    { ref: "INC-YYYY-NNNN", desc: "TODO", similarity: "TODO" }
  ],
  /* the ground truth. Deliberately OMIT the reference used for the fabricated similarIncidents entry. */
  repository: [
    { ref: "INC-YYYY-NNNN", title: "TODO", date: "YYYY-MM-DD", summary: "TODO — matches similarIncidents[0]" },
    { ref: "INC-YYYY-NNNN", title: "TODO", date: "YYYY-MM-DD", summary: "TODO — matches similarIncidents[1]" },
    { ref: "INC-YYYY-NNNN", title: "TODO", date: "YYYY-MM-DD", summary: "TODO — matches similarIncidents[3]" },
    { ref: "INC-YYYY-NNNN", title: "TODO — unrelated, for realism", date: "YYYY-MM-DD", summary: "TODO — real record the AI did not surface" }
  ],

  callouts: {
    comet: "This mirrors a COMET-style investigation assistant: fast drafting of the mechanical parts of a report, so the investigator's time goes to judgement and verification.",
    draftEverywhere: "Every panel is marked DRAFT. None of it is a finding until an investigator has reviewed, corrected and signed for it.",
    fabricatedCase: "One 'similar incident' has no matching repository record. It reads exactly like the real ones. This is what a hallucinated citation looks like — check every citation against the source, never against how confident it sounds.",
    inferredVsStated: "Timeline entries marked 'inferred' were not in the narrative. That might be right. It is not evidence until someone confirms it.",
    humanJudgement: "Root-cause categorisation, action ownership and the executive summary's framing are judgement calls the investigation team makes, not the assistant."
  },
  notes: {
    what: "From one incident narrative, the assistant drafts a timeline, causes, contributing factors, actions, an executive summary, and a similar-incidents search — the standard shape of an investigation report.",
    gate: "The report cannot be finalised until every section has been reviewed, and every similar-incident result has been checked against the repository, with anything unverifiable removed.",
    real: "Authored: the narrative, every drafted section, the similar-incident search results and the repository. Live and real: checking a case reference against the repository, your review checkboxes, the include/exclude decision, and the finalize gate."
  }
};
