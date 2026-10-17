/* ============================================================================
   S19 dataset — "incident-summary"
   Same live checklist-scoring and claim-tally mechanic as toolbox-talk,
   applied to a loading-dock injury incident summary instead. Shape:
   ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S19 = window.HSE_S19 || { scenarios: {} };
window.HSE_S19.scenarios["incident-summary"] = {
  id: "incident-summary",
  label: "Incident summary",
  context: "Source notes from a loading-dock hand injury are the only facts a drafting prompt is allowed to use. Try each preset prompt and watch how prompt quality changes both the checklist score and how much of the draft is actually grounded in the notes.",
  sourceNotes: [
    "Location: Loading Dock 7, Warehouse B",
    "Date/time: 2026-04-02, 14:20",
    "What happened: dock worker sustained a hand laceration while adjusting a pallet strap",
    "Immediate cause: strap tensioner slipped under load",
    "Status: first aid given on-site; worker returned to light duties the same day, no lost time",
    "Contributing factor (preliminary): the tensioner had a known wear issue reported three weeks earlier but not yet replaced"
  ],
  scoring: {
    specific: { max: 3, keywords: ["loading dock 7", "2026-04-02", "14:20", "laceration", "tensioner", "warehouse b"] },
    grounded: { max: 2, keywords: ["using only", "based only on", "notes below", "attached", "do not add information not in"] },
    format: { max: 2, keywords: ["word", "bullet", "format as", "minutes", "email"] },
    constraints: { max: 3, keywords: ["do not include", "flag", "uncertain", "if unsure", "cite", "only include"] }
  },
  presets: [
    {
      id: "vague",
      label: "1. Vague",
      prompt: "Write an incident summary for the loading dock injury.",
      draft: {
        text: "On the loading dock, a worker suffered a serious hand injury requiring surgery. This is the third such incident this quarter, highlighting an ongoing problem with dock safety. Management should review pallet-handling procedures immediately.",
        claims: [
          { text: "A worker suffered a serious hand injury requiring surgery.", grounded: false },
          { text: "This is the third such incident this quarter.", grounded: false }
        ]
      }
    },
    {
      id: "some-specificity",
      label: "2. Some specificity",
      prompt: "Write an incident summary about the loading dock 7 hand injury for the site safety committee.",
      draft: {
        text: "A dock worker at Loading Dock 7 sustained a hand injury. The worker was taken to hospital for treatment. The immediate cause was the strap tensioner slipping under load.",
        claims: [
          { text: "A dock worker at Loading Dock 7 sustained a hand injury.", grounded: true },
          { text: "The worker was taken to hospital for treatment.", grounded: false },
          { text: "The immediate cause was the strap tensioner slipping under load.", grounded: true }
        ]
      }
    },
    {
      id: "grounded-format",
      label: "3. Grounded + format",
      prompt: "Using only the facts in the notes below, write a 100-word incident summary of the Loading Dock 7 hand laceration on 2026-04-02 for the site safety committee. Format as: Date/Location, What happened, Immediate cause, Status. [NOTES ATTACHED]",
      draft: {
        text: "Date/Location: 2026-04-02, 14:20, Loading Dock 7, Warehouse B.\nWhat happened: a dock worker sustained a hand laceration while adjusting a pallet strap.\nImmediate cause: the strap tensioner slipped under load.\nStatus: first aid was given on-site; the worker returned to light duties the same day, with no lost time.",
        claims: [
          { text: "2026-04-02, 14:20, Loading Dock 7, Warehouse B.", grounded: true },
          { text: "A dock worker sustained a hand laceration while adjusting a pallet strap.", grounded: true },
          { text: "The strap tensioner slipped under load.", grounded: true },
          { text: "First aid was given on-site; the worker returned to light duties the same day, with no lost time.", grounded: true }
        ]
      }
    },
    {
      id: "grounded-constrained",
      label: "4. Grounded + constrained",
      prompt: "Using only the facts in the notes below, write a 100-word incident summary of the Loading Dock 7 hand laceration on 2026-04-02 for the site safety committee. Format as: Date/Location, What happened, Immediate cause, Status. Do not include any detail not in the notes. If a contributing factor is still preliminary, flag it as preliminary rather than stating it as settled. [NOTES ATTACHED]",
      draft: {
        text: "Date/Location: 2026-04-02, 14:20, Loading Dock 7, Warehouse B.\nWhat happened: a dock worker sustained a hand laceration while adjusting a pallet strap.\nImmediate cause: the strap tensioner slipped under load.\nStatus: first aid was given on-site; the worker returned to light duties the same day, with no lost time.\nContributing factor (flagged as preliminary): the tensioner had a known wear issue reported three weeks earlier but not yet replaced — this has not been confirmed as a root cause.",
        claims: [
          { text: "2026-04-02, 14:20, Loading Dock 7, Warehouse B.", grounded: true },
          { text: "A dock worker sustained a hand laceration while adjusting a pallet strap.", grounded: true },
          { text: "The strap tensioner slipped under load.", grounded: true },
          { text: "First aid was given on-site; the worker returned to light duties the same day, with no lost time.", grounded: true },
          { text: "The tensioner had a known wear issue reported three weeks earlier, flagged explicitly as a preliminary, unconfirmed contributing factor.", grounded: true }
        ]
      }
    }
  ],
  callouts: {
    scale: "A safety committee reading one incident summary a month notices an embellished detail. A site generating dozens a year across every incident is exactly the volume where an exaggerated claim — 'hospitalised', 'the third this quarter' — slips into a permanent record unnoticed.",
    ladder: "Presets 1 and 2 both produce a draft with at least one claim that isn't in the source notes at all — including a claim that directly contradicts the notes (P2's draft sends the worker to hospital; the notes say first aid on-site, same-day return to light duty). Presets 3 and 4 stick to exactly what the notes say.",
    notOmniscient: "The checklist score is a keyword scan of your prompt text, not a judgement of whether the resulting draft will actually be accurate. A high score means the prompt asked for the right things — it does not guarantee the output delivered them.",
    stillMisses: "Editing the prompt box updates the checklist score live — but this simulation cannot generate a new draft for text you type. Only the four calibrated presets have an authored draft attached; free-text editing is here to show you how the score reacts, not to write a summary for you.",
    humanCall: "A well-built prompt lowers predicted risk — it does not eliminate the review gate. Every generated incident summary still needs a person who was there, or who read the underlying investigation, to check it against the actual facts before it becomes the record."
  },
  notes: {
    what: "Four preset prompts of increasing quality, each with a pre-authored draft. A live checklist scores whatever prompt text is currently in the box against four keyword-based dimensions; a live claim tally counts how many of the selected draft's factual claims are tagged grounded vs fabricated.",
    math: "checklistScore = specificScore(0-3) + groundedScore(0-2) + formatScore(0-2) + constraintsScore(0-3), each a capped count of keyword-list matches found in the current prompt text (case-insensitive substring search). predictedRisk% = clamp(95 − score×9, 5, 95). Claim tally = count of the selected draft's authored claims with grounded:true vs grounded:false.",
    real: "Authored: the source notes, the four preset prompts, their drafts, and each claim's grounded/fabricated tag. Live and real: the checklist score and predicted-risk formula (recomputed from whatever prompt text is currently in the box, including your edits) and the claim tally for whichever draft is selected."
  }
};
