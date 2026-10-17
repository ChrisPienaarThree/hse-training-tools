# S21 — EU AI Act high-risk screener & ISO 45001 ↔ 42001 mapper

**Course slot:** Day 4 — EU AI Act; Day 5 — Management System Integration. **Type:** interactive teaching simulation, static HTML/CSS/JS, no build step, no server, no AI model runs.

## What it teaches

Two related, but distinct, regulatory/governance questions in one page:

- **Part A — is this AI use case even legal, and what does it cost to get wrong?** Six yes/no questions,
  evaluated in a fixed priority order (prohibited > high-risk > limited-risk > minimal-risk — first match
  wins), classify a described AI use case and show its obligations and illustrative penalty exposure. Three
  presets per scenario show how ordinary-sounding safety tools land in surprisingly different tiers.
- **Part B — once it's in scope, how do you manage it?** A filterable ISO 45001 (OH&S) ↔ ISO 42001 (AI
  management systems) clause-mapping table. Both standards share the same Annex SL harmonised structure, so
  the mapping is mostly clause-for-clause — the table exists to make integration concrete, not to reinvent a
  parallel system.

**The headline demonstration:** in `computer-vision-tools`, a PPE compliance detector — "just a safety
camera" — lands in the **high-risk** tier because flagging individual workers for non-compliance is worker
monitoring under Annex III, while a facial fatigue/attention monitor lands as **prohibited** because
inferring emotion in the workplace is one of the Act's banned practices outright. Neither outcome is what
most people expect on first guess.

## Files

```
S21-ai-act-iso-mapper/
├── index.html                          scenario picker, Part A screener, Part B mapping table
├── app.js                               rule engine + live filter + rendering
├── styles.css                            shared design tokens (light/dark)
├── data/
│   ├── manifest.js
│   ├── computer-vision-tools/dataset.js       3 CV presets
│   ├── predictive-and-nlp-tools/dataset.js    3 predictive/NLP presets
│   └── _TEMPLATE/                        copy this to add a scenario
└── README.md                             this file
```

## The maths (all real, computed live)

- **Classification:** for each tier in priority order `prohibited > high-risk > limited-risk > minimal-risk`,
  check whether any checked question belongs to that tier; the first tier with a hit wins; no hits at all →
  minimal-risk. A plain, deterministic rule evaluation over whatever boxes are checked — preset or manual.
- **Hand-check (computer-vision-tools):** the PPE detector preset checks only q4 (worker monitoring/evaluation,
  category `high-risk`) — no `prohibited`-category question is checked, so the first hit is `high-risk`. The
  facial fatigue monitor preset checks only q3 (workplace emotion inference, category `prohibited`) — that's
  the first tier checked, so it wins outright regardless of anything else.
- **Part B filter:** a live, case-insensitive substring match across the clause number and both standards'
  titles and the integration note, recomputed on every keystroke; the "showing N of 12" count is a real
  `Array.filter().length`, not a static label.

## What's authored vs computed live

- **Authored (by a competent person, in the dataset):** the six questions and their tier categories, the
  three presets per scenario and their pre-checked answers, the tier obligations/penalty text, and the ISO
  clause-mapping table content.
- **Computed live, in your browser, from your inputs:** which tier your checked answers classify into (preset
  or manually toggled), and which mapping rows currently match your filter text.

## A note on the legal content

The six questions are a simplified teaching model of the EU AI Act's tiering logic, not legal advice, and the
penalty figures are illustrative training figures based on the Act's published tiers (Article 99) — verify
against current official guidance before using any of this in a real compliance decision. The page says so
explicitly in its banner.

## Adding a scenario

See `data/_TEMPLATE/README.md`. In short: keep the 6 questions as-is, write 3 presets landing in different
tiers, and reuse the same `isoMapping` rows verbatim.

## Verification

`node --check` passes on `app.js`. A jsdom smoke test (not shipped in this folder) exercises: default render,
the hand-verified tier for each of the 3 presets on both scenarios, manual checkbox toggling reclassifying
live, the priority order (a prohibited-category checkbox overriding an already-checked high-risk one), the
Part B filter narrowing the table and its count live, scenario switching, theme toggle, and zero console
errors.
