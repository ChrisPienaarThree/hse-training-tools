/* ============================================================================
   S19 dataset — "toolbox-talk"
   Nothing generative runs here. Four preset prompts, of deliberately
   increasing quality, each carry a pre-authored draft — the kind of output a
   prompt like it tends to produce. The checklist score IS live: app.js scans
   whatever text is in the prompt box (edit it freely) against the keyword
   lists below and computes a real 0-10 score and a predicted hallucination
   risk. The claims/grounded tally on the selected draft is also live —
   app.js counts how many authored claims are tagged grounded vs fabricated.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S19 = window.HSE_S19 || { scenarios: {} };
window.HSE_S19.scenarios["toolbox-talk"] = {
  id: "toolbox-talk",
  label: "Toolbox talk",
  context: "Source notes from a Bay 4 near-miss are the only facts a drafting prompt is allowed to use. Try each preset prompt and watch how prompt quality changes both the checklist score and how much of the draft is actually grounded in the notes.",
  sourceNotes: [
    "Location: Bay 4 assembly area",
    "Hazard: overhead crane routinely lifts steel panels above the walkway",
    "Event: a panel sling slipped on 2026-05-14 — no injury; the panel dropped roughly 0.3m and landed clear of the walkway",
    "Root cause (preliminary): incorrect sling angle used for this panel's shape",
    "Existing control: exclusion-zone barrier tape, frequently pushed aside by staff taking a shortcut",
    "Audience: day shift assembly team, approximately 14 people"
  ],
  /* Keyword lists app.js scans the (editable) prompt text against, live. Each list is capped at
     its own max points; the four dimension scores sum to a 0-10 checklist score. */
  scoring: {
    specific: { max: 3, keywords: ["bay 4", "2026-05-14", "14 people", "sling", "0.3m", "panel"] },
    grounded: { max: 2, keywords: ["using only", "based only on", "notes below", "attached", "do not add information not in"] },
    format: { max: 2, keywords: ["word", "bullet", "format as", "minutes", "email"] },
    constraints: { max: 3, keywords: ["do not include", "flag", "uncertain", "if unsure", "cite", "only include"] }
  },
  presets: [
    {
      id: "vague",
      label: "1. Vague",
      prompt: "Write a toolbox talk about crane safety.",
      draft: {
        text: "Crane safety is one of the most important topics on any site. Crane-related incidents cause dozens of injuries across this industry every year, and this is one of the most common causes of workplace fatalities. Always inspect your crane before use, keep clear of suspended loads, and report anything unusual to your supervisor.",
        claims: [
          { text: "Crane-related incidents cause dozens of injuries across this industry every year.", grounded: false },
          { text: "This is one of the most common causes of workplace fatalities.", grounded: false }
        ]
      }
    },
    {
      id: "some-specificity",
      label: "2. Some specificity",
      prompt: "Write a toolbox talk about the recent crane incident in Bay 4 for the assembly team.",
      draft: {
        text: "Last week, a recent incident in Bay 4 involved a crane load. The load nearly struck a worker before falling — a stark reminder of what can go wrong. The cause was an incorrect sling angle. Please stay alert around suspended loads and report any near misses.",
        claims: [
          { text: "A recent incident in Bay 4 involved a crane load.", grounded: true },
          { text: "The load nearly struck a worker before falling.", grounded: false },
          { text: "The cause was an incorrect sling angle.", grounded: true }
        ]
      }
    },
    {
      id: "grounded-format",
      label: "3. Grounded + format",
      prompt: "Using only the facts in the notes below, write a 120-word toolbox talk for the day shift assembly team (~14 people) about the Bay 4 sling incident. Format as 3 short bullet points plus one discussion question. [NOTES ATTACHED]",
      draft: {
        text: "• On 2026-05-14, a steel panel sling slipped in Bay 4 and the panel dropped about 0.3m from the walkway; no one was injured.\n• The preliminary root cause was an incorrect sling angle for the panel shape.\n• The exclusion-zone barrier tape has often been pushed aside on shortcuts through the area.\nDiscussion question: what would make it easier to walk the long way round instead of through the barrier tape?",
        claims: [
          { text: "On 2026-05-14, a steel panel sling slipped in Bay 4 and the panel dropped about 0.3m from the walkway; no one was injured.", grounded: true },
          { text: "The preliminary root cause was an incorrect sling angle for the panel shape.", grounded: true },
          { text: "The exclusion-zone barrier tape has often been pushed aside.", grounded: true }
        ]
      }
    },
    {
      id: "grounded-constrained",
      label: "4. Grounded + constrained",
      prompt: "Using only the facts in the notes below, write a 120-word toolbox talk for the day shift assembly team (~14 people) about the Bay 4 sling incident. Format as 3 short bullet points plus one discussion question. Do not include any statistic not in the notes. If you are uncertain whether a detail is correct, say so explicitly rather than guessing. [NOTES ATTACHED]",
      draft: {
        text: "• On 2026-05-14, a steel panel sling slipped in Bay 4 and the panel dropped about 0.3m from the walkway; no one was injured.\n• The root cause is described as preliminary — final investigation findings may differ.\n• The exclusion-zone barrier tape has often been pushed aside on shortcuts through the area.\nDiscussion question: what would make it easier to walk the long way round instead of through the barrier tape?",
        claims: [
          { text: "On 2026-05-14, a steel panel sling slipped in Bay 4 and the panel dropped about 0.3m from the walkway; no one was injured.", grounded: true },
          { text: "The root cause is described as preliminary and may change once the investigation is complete.", grounded: true },
          { text: "The exclusion-zone barrier tape has often been pushed aside.", grounded: true },
          { text: "This root cause is preliminary and may change — flagged explicitly rather than stated as settled fact.", grounded: true }
        ]
      }
    }
  ],
  callouts: {
    scale: "A supervisor writing a dozen toolbox talks a year notices when one contains a made-up statistic. A team generating hundreds a year, across every site, is exactly the volume where a fabricated detail slips through unnoticed — unless the prompt itself was built to prevent it.",
    ladder: "Presets 1 and 2 both produce a draft with at least one claim that isn't in the source notes at all. Presets 3 and 4 produce drafts where every claim traces back to a specific note — because the prompt explicitly said to use only the notes, and said so in a format the checklist can actually detect.",
    notOmniscient: "The checklist score is a keyword scan of your prompt text, not a judgement of whether the resulting draft will actually be accurate. A high score means the prompt asked for the right things — it does not guarantee the output delivered them (that's exactly why preset 4 still needs a human reviewer, same as preset 1).",
    stillMisses: "Editing the prompt box updates the checklist score live — but this simulation cannot generate a new draft for text you type. Only the four calibrated presets have an authored draft attached; free-text editing is here to show you how the score reacts, not to write a talk for you.",
    humanCall: "A well-built prompt lowers predicted risk — it does not eliminate the review gate. Every generated draft still needs a person who knows the site to check it against the actual source material before it goes out."
  },
  notes: {
    what: "Four preset prompts of increasing quality, each with a pre-authored draft. A live checklist scores whatever prompt text is currently in the box against four keyword-based dimensions; a live claim tally counts how many of the selected draft's factual claims are tagged grounded vs fabricated.",
    math: "checklistScore = specificScore(0-3) + groundedScore(0-2) + formatScore(0-2) + constraintsScore(0-3), each a capped count of keyword-list matches found in the current prompt text (case-insensitive substring search). predictedRisk% = clamp(95 − score×9, 5, 95). Claim tally = count of the selected draft's authored claims with grounded:true vs grounded:false.",
    real: "Authored: the source notes, the four preset prompts, their drafts, and each claim's grounded/fabricated tag. Live and real: the checklist score and predicted-risk formula (recomputed from whatever prompt text is currently in the box, including your edits) and the claim tally for whichever draft is selected."
  }
};
