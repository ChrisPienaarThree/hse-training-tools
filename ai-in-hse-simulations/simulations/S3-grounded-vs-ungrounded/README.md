# S3 — Grounded vs ungrounded

**Course:** Integrating AI in Workplace Safety Practices
**Slot:** Day 1 · Topic 2a (also Day 3 · Topic 2 investigation; Day 4 · Topics 1 & 6 documentation and prompting)
**Run time:** 12–18 min facilitator-led.

---

## What it teaches

> Put the same question to the same model twice. Once with nothing but the question. Once with the
> actual standard pasted into the prompt. The ungrounded answer *sounds* identical — same fluent,
> confident voice — but it invents clause numbers, intervals and credentials. The grounded answer
> quotes the text, cites the clause, and says "not in the source" where that is true. The
> difference in **reviewer effort** is the whole business case for retrieval grounding.

Three ideas, made concrete:

1. **Retrieval grounding** — the fix for hallucination is not a better model, it is putting the
   source in the prompt and instructing "answer only from this".
2. **A verifiable output format** — one claim per line, each with the paragraph it rests on, and an
   explicit "not in the source". The citation chips let a reviewer confirm each line in seconds.
3. **The mandatory review gate** — neither answer is finished when the model stops. The gate on the
   ungrounded pane will not unlock until every red/amber line has been checked against a document
   the model never had. The grounded gate needs only its inference line confirmed.

---

## How to run it

- **Open `index.html` in a browser.** No server, no internet, no install.
- Nothing is generated. Both answers and every verdict are pre-authored; the tallies, the gate
  logic and the scoreboard are computed live. Say this to the room.

---

## Controls

| Control | Effect |
|---|---|
| **View** | side by side / ungrounded only / grounded only |
| **Topic familiarity** (common → niche) | swaps the ungrounded answer and its independent base-rate estimate — niche is confidently, badly wrong |
| **Source given to the grounded model** (full / snippet) | "snippet" withholds the later paragraphs; the grounded model then correctly says "outside the supplied text" |
| **Citation chips** `¶2` | click to highlight that paragraph in the source box |
| **Mark verified / Acknowledge inference** | clears a flagged line; the review gate unlocks when all are cleared |

---

## Suggested walkthrough

1. **Start side by side, familiarity = middle.** Read the ungrounded answer aloud. It is fluent and
   authoritative. Now point at the red pills: an invented clause number, an invented re-test
   interval, an invented certificate.
2. **Read the grounded answer.** Every green line has a `¶` chip — click one, watch the source
   paragraph highlight. Note the blue "bounded" line: the model *declined* to invent the interval.
3. **Push topic familiarity to niche.** The ungrounded answer now contradicts the standard on the
   oxygen range and the test order — the sort of error that gets someone hurt. The grounded answer
   barely changes.
4. **Pull familiarity back to common.** The ungrounded answer is *mostly right now* — but two lines
   are still wrong, and nothing marks them. That is the real hazard: not that it is always wrong,
   but that you cannot tell which 1-in-20 line is.
5. **Switch the grounded source to "snippet only".** The withheld paragraphs grey out. The grounded
   answer switches those lines to "outside the supplied text" instead of guessing. Teaching point:
   *grounding is only as good as what you retrieved.*
6. **Work the review gates.** Try to "Approve for use" the ungrounded answer — it is blocked. Clear
   each flagged line (imagine you went and read the standard). Watch the effort estimate. Then do
   the grounded one: a couple of clicks.
7. **Scoreboard.** Walk the rows. Same model, same question — the columns differ only by whether the
   source was in the prompt, and how much of it.

---

## Discussion questions

- Where in your workflows does the model actually have the source in context, and where is it
  answering "from memory"?
- The ungrounded answer at "common familiarity" was 80% right. Is 80% useful, or is it the most
  dangerous state of all?
- What would a "verifiable output format" look like for your incident reports? Your risk assessments?
- Who owns the review gate — the author, a checker, the approver? What stops it becoming a rubber stamp?
- "Snippet only" still produced a safe answer by refusing. What has to be true about your retrieval
  system for that refusal to be reliable?

---

## Scenarios included

| id | folder | the standard in play |
|---|---|---|
| `confined-space-gas-tests` | `data/confined-space-gas-tests/` | atmospheric testing order, limits and re-test rule — fictional standard **OES-7** |
| `hot-work-fire-watch` | `data/hot-work-fire-watch/` | fire-watch duration, who may stand it, post-watch check — fictional procedure **HW-12** |

Add more by copying `data/_TEMPLATE/` — see `data/_TEMPLATE/README.md`.

---

## Files

```
S3-grounded-vs-ungrounded/
├── index.html        entry point — open this
├── app.js            tally + render + review-gate logic (no model, no network)
├── styles.css        projector-friendly, light + dark (shares S1/S2 tokens)
├── README.md         this file
└── data/
    ├── manifest.js
    ├── confined-space-gas-tests/dataset.js
    ├── hot-work-fire-watch/dataset.js
    └── _TEMPLATE/
        ├── dataset.js
        └── README.md      dataset contract + verdict palette
```

## Honesty rules baked in

- Banner: no model runs; treat both columns as the same model, only the source differs.
- All sources are marked `[FICTIONAL, for demonstration only]`.
- The worked examples deliberately concentrate the failures; the meter caption states the real
  independent base rate (~3–5% mainstream, up to ~27% niche) alongside.
- The hallucination-rate figure is tagged **independent**.
