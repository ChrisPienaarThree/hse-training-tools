/* ============================================================================
   S19 dataset TEMPLATE — copy to data/<your-scenario-id>/, no model runs.
   app.js scans whatever text is CURRENTLY in the prompt box (live, including
   edits) against the scoring.* keyword lists below, capped per dimension,
   summed into a 0-10 checklist score and a predicted-risk% formula. Selecting
   a preset swaps in its authored draft and tallies its claims' grounded flags
   live — but free-text editing never generates a new draft (there is no
   model to call).
   AFTER FILLING IN: add a <script src> line in index.html + a manifest.js row.
   ============================================================================ */
window.HSE_S19 = window.HSE_S19 || { scenarios: {} };
window.HSE_S19.scenarios["TEMPLATE-ID"] = {
  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  context: "TODO — what document is being drafted and what source notes constrain it.",
  sourceNotes: [
    "TODO — 5-6 short factual bullet points; these are the ONLY ground truth the drafts may use."
  ],
  scoring: {
    specific: { max: 3, keywords: ["TODO specific detail 1", "TODO specific detail 2"] },
    grounded: { max: 2, keywords: ["using only", "based only on", "notes below", "attached", "do not add information not in"] },
    format: { max: 2, keywords: ["word", "bullet", "format as", "minutes", "email"] },
    constraints: { max: 3, keywords: ["do not include", "flag", "uncertain", "if unsure", "cite", "only include"] }
  },
  presets: [
    /* Exactly 4, in increasing quality order. IMPORTANT: hand-check that your keyword lists
       actually score preset 1 near 0 and preset 4 near the max (9-10) — write the prompt text
       first, then check which keywords it contains, not the other way round. Each draft's
       `claims` array should show MORE fabricated (grounded:false) claims in the low-scoring
       presets and ZERO in the top preset — that link between checklist score and fabrication
       rate is the whole teaching point. */
    { id: "vague", label: "1. Vague", prompt: "TODO", draft: { text: "TODO", claims: [{ text: "TODO", grounded: false }] } },
    { id: "some-specificity", label: "2. Some specificity", prompt: "TODO", draft: { text: "TODO", claims: [{ text: "TODO", grounded: true }, { text: "TODO", grounded: false }] } },
    { id: "grounded-format", label: "3. Grounded + format", prompt: "TODO", draft: { text: "TODO", claims: [{ text: "TODO", grounded: true }] } },
    { id: "grounded-constrained", label: "4. Grounded + constrained", prompt: "TODO", draft: { text: "TODO", claims: [{ text: "TODO", grounded: true }] } }
  ],
  callouts: {
    scale: "TODO",
    ladder: "TODO — name the specific fabricated claim(s) in the low-scoring presets' drafts.",
    notOmniscient: "The checklist score is a keyword scan of your prompt text, not a judgement of whether the resulting draft will actually be accurate.",
    stillMisses: "Editing the prompt box updates the checklist score live — but this simulation cannot generate a new draft for text you type.",
    humanCall: "A well-built prompt lowers predicted risk — it does not eliminate the review gate."
  },
  notes: {
    what: "TODO",
    math: "checklistScore = specificScore(0-3) + groundedScore(0-2) + formatScore(0-2) + constraintsScore(0-3), each a capped count of keyword matches in the current prompt text. predictedRisk% = clamp(95 − score×9, 5, 95).",
    real: "Authored: source notes, presets, drafts, claim tags. Live and real: the checklist score/risk and the claim tally, recomputed live."
  }
};
