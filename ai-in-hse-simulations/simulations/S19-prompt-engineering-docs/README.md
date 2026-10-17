# S19 — Prompt engineering & the review gate

**Course slot:** Day 4 — Generative Documentation & Prompt Engineering. **Type:** interactive teaching simulation, static HTML/CSS/JS, no build step, no server, no AI model runs.

## What it teaches

This is the one simulation in the suite that is deliberately *only* about the prompt, not the output — it
complements S2/S3 (which are about how an LLM works) by asking: does the quality of what you ask for predict
the quality of what you get?

- A fixed set of **source notes** — the only facts any draft is allowed to use.
- **Four preset prompts**, of visibly increasing quality, each with a pre-authored draft (the kind of output a
  prompt like it tends to produce).
- A **live checklist score** (Specific / Grounded / Format / Constraints, 0-10) computed by scanning whatever
  text is in the prompt box — including your own edits — against authored keyword lists.
- A **predicted hallucination risk %**, a transparent formula of the checklist score.
- A **claim-by-claim tally** on the selected draft: how many of its factual claims are tagged grounded
  (traceable to a source note) vs fabricated.

**The headline demonstration:** the checklist score and the fabrication rate move together. The vague preset
scores near 0 and its draft invents unsupported claims; the grounded-and-constrained preset scores 9/10 and
every claim in its draft traces to a source note.

## Files

```
S19-prompt-engineering-docs/
├── index.html               scenario picker, prompt box, score panel, draft + claim tally
├── app.js                    live keyword-scan scorer + claim tally + rendering
├── styles.css                 shared design tokens (light/dark)
├── data/
│   ├── manifest.js
│   ├── toolbox-talk/dataset.js       Bay 4 sling near-miss
│   ├── incident-summary/dataset.js   loading-dock hand injury
│   └── _TEMPLATE/               copy this to add a scenario
└── README.md                    this file
```

## The maths (all real, computed live)

- Each dimension's score = count of its keyword list's entries found (case-insensitive substring match) in
  the current prompt text, capped at that dimension's max (Specific 3, Grounded 2, Format 2, Constraints 3).
- `predictedRisk% = clamp(95 − totalScore×9, 5, 95)`.
- **Hand-check (toolbox-talk):** preset 1 ("Write a toolbox talk about crane safety.") matches none of the
  keyword lists → score 0 → risk 95%. Preset 4 (grounded, 120-word/bullet format, explicit "do not include"/
  "uncertain" constraints, names Bay 4/the sling/14 people) → specific 3 + grounded 2 + format 2 +
  constraints 2 = 9 → risk `95 − 81 = 14%`.
- Claim tally = a live `filter`/`count` over the selected preset's authored `claims` array — not a number
  typed into the page copy.

## What's authored vs computed live

- **Authored (by a competent person, in the dataset):** the source notes, the four preset prompts, their
  drafts, and every claim's grounded/fabricated tag.
- **Computed live, in your browser, from your inputs:** the checklist score and predicted-risk formula
  (recomputed on every keystroke in the prompt box) and the grounded/fabricated claim tally for whichever
  preset is selected.
- **What this sim does NOT do:** generate new text. Editing the prompt box changes the live score; it cannot
  produce a new draft for text that isn't one of the four presets — the page says so explicitly.

## Adding a scenario

See `data/_TEMPLATE/README.md`. In short: write your 4 preset prompts first, then choose keyword lists that
actually discriminate between them, and hand-verify the resulting scores rise in order with the fabricated
claim count falling to zero by preset 4.

## Verification

`node --check` passes on `app.js`. A jsdom smoke test (not shipped in this folder) exercises: default render,
the hand-verified score/risk values for presets 1 and 4 on both scenarios, live score updates on prompt-box
edits, claim tally matching a manual count of the authored `claims` array, preset switching, scenario
switching, theme toggle, and zero console errors.
