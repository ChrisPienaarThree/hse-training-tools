# S23 — Roadmap / readiness generator

**Course:** Integrating AI in Workplace Safety Practices
**Slot:** Day 5 · closing workshop
**Run time:** 15–20 min facilitator-led. Designed to close the course by turning everything seen in
S1–S22 into a personal action plan.

---

## What it teaches

> Whether an AI use case is "ready to pilot" isn't a technology question — it's a readiness
> question across five things a team controls itself: data, governance, human review, a defined
> success metric, and a validation/monitoring plan. This is not a model: you pick a candidate use
> case, you set the five scores yourself, and the tool only does the arithmetic — averaging them
> into one number, picking a band, and ordering a roadmap around whichever dimension you scored
> weakest. The roadmap doesn't know which use case you picked; it only knows which number is
> lowest, which is the whole point — readiness work always starts with the honest weak spot, not
> the exciting part.

---

## How to run it

- **Open `index.html` in a browser.** No server, no internet, no install.
- No model runs. The five dimensions' generic roadmap text, each use case's starting baseline
  scores, and the band thresholds are pre-authored. Every overall score, band, and the roadmap's
  phase order are computed live from wherever you leave the five sliders.

---

## Controls

| Control | Effect |
|---|---|
| **Team** (scenario picker) | switches between a manufacturing and a construction HSE team, each with its own four candidate use cases |
| **Use case cards** | selects a candidate AI use case and resets the five sliders to its authored baseline |
| **Five dimension sliders** (0–100) | your own readiness judgement per dimension — drag away from the baseline |

---

## Suggested walkthrough

1. **Pick a use case.** Read its one-line note — it names the typical weak spot for that kind of
   system, but the sliders start at the authored baseline, not at that note's conclusion.
2. **Read the overall score and band** as-is, then read Phase 1 of the roadmap — it should match
   whichever dimension has the lowest slider value.
3. **Drag one slider below the current Phase-1 dimension's value.** Watch the roadmap reorder
   itself immediately — the new lowest dimension becomes Phase 1.
4. **Switch use case** without touching any sliders. The scores reset to that use case's own
   baseline and the roadmap reorders again, entirely from the new numbers.
5. **Switch team (scenario).** Same five dimensions, four different candidate use cases — the
   mechanism doesn't change, only the framing does.
6. **Read the five callouts**, especially "not omniscient" and "still misses things" — a full
   roadmap does not guarantee a successful deployment, only that the obvious gaps were named first.

---

## Discussion questions

- Pick your own team's most likely first AI use case from this course. Score it honestly, right
  now — what does Phase 1 turn out to be?
- Is an honest 30 on a dimension more useful to a team than an optimistic 80? What would make
  someone score optimistically here?
- The five dimensions are the same for every use case in this tool. What's a sixth dimension your
  own organisation would need to add?
- Who should actually own doing Phase 1 once this roadmap is generated? The tool doesn't decide that.

---

## Scenarios included

| id | folder | the framing |
|---|---|---|
| `manufacturing-hse-team` | `data/manufacturing-hse-team/` | four candidate use cases for a manufacturing HSE team — PPE detection, predictive maintenance, NLP coding, generative documentation |
| `construction-hse-team` | `data/construction-hse-team/` | four candidate use cases for a construction HSE team — hard-hat detection, plant-failure risk, permit/SIMOPs cross-check, generative induction drafting |

Add more by copying `data/_TEMPLATE/` — see `data/_TEMPLATE/README.md`. Both scenarios share the
same five `dimensions`; only `useCases` (and optionally `bands`/`callouts`/`notes`) differ.

---

## Files

```
S23-roadmap-readiness-generator/
├── index.html        entry point — open this
├── app.js             overall score + band + roadmap ordering (no model, no network)
├── styles.css         projector-friendly, light + dark (shares S1-S22 tokens)
├── README.md          this file
└── data/
    ├── manifest.js
    ├── manufacturing-hse-team/dataset.js
    ├── construction-hse-team/dataset.js
    └── _TEMPLATE/
        ├── dataset.js
        └── README.md    dataset contract
```

## Honesty rules baked in

- Banner: no model runs; use-case baselines authored, every score/band/roadmap order computed live
  and hand-checkable.
- Sliders start at an authored baseline but the reader owns every value shown — nothing pretends to
  assess readiness on their behalf.
- The roadmap's phase text is generic per dimension, not per use case, so it can't be mistaken for
  a tailored recommendation engine.
- The callouts panel is permanent, not a toggle you might forget to open — "not omniscient" and
  "still misses things" sit next to the roadmap, not buried in a drawer.

## Verification

`node --check` passes on `app.js` and both scenario `dataset.js` files. A jsdom smoke test exercises:
default render for both scenarios, every use-case card (baseline reset), all five sliders across a
range of values, the overall-score/band arithmetic against a hand calculation, the roadmap reorder
when a slider is dragged below the current Phase-1 dimension, and zero console errors.
