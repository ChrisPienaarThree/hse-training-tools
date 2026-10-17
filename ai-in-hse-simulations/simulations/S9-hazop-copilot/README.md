# S9 — AI-assisted HAZOP co-pilot

**Course:** Integrating AI in Workplace Safety Practices
**Slot:** Day 2 · Topic 6 (workshop: AI-assisted risk assessment); also Day 2 · Topic 2
(AI-enhanced risk assessment)
**Run time:** 15–20 min facilitator-led, ideally as an actual small-group exercise.

---

## What it teaches

> A HAZOP deviation has a bounded set of credible causes, consequences and safeguard types — that
> structure is why AI assistance here carries much lower hallucination risk than free-text
> generation. An AI co-pilot can assemble that starting checklist in seconds from a wide base of
> comparable studies and incidents. What it cannot do is know **this site**: the pump with a
> documented cold-weather seal history, the informal workaround your operators use under schedule
> pressure, the near-miss report that never made it into any training corpus. And listing a
> safeguard is not the same as confirming it works — "present" still needs a status.

---

## How to run it

- **Open `index.html` in a browser.** No server, no internet, no install.
- No model runs. Every deviation's candidate causes, consequences, expected safeguards and
  site-specific "human catch" are pre-authored. Your checklist state, your own added entries, the
  review gate and the running worksheet are computed live — same honesty stance as the rest of the series.

---

## Controls

| Control | Effect |
|---|---|
| **Deviation picker** | select a guide-word / parameter combination for this node |
| **Accept / Reject** (on the one flagged AI cause) | the team's decision on a plausible-but-wrong suggestion |
| **Safeguard checkboxes** | "I've verified this" (present) or "I've raised an action" (unverified/missing) |
| **Add** (your team's pass) | genuinely add your own free-text entries — this half is real, not scripted |
| **Reveal what a site team caught** | shows the authored site-specific catch for this deviation |
| **Mark this deviation reviewed** | disabled until every gate condition is met; adds a row to the worksheet |

---

## Suggested walkthrough

1. **Pick the first deviation.** Read the AI's causes, consequences and safeguards aloud — this is
   what a competent engineer would expect for this kind of deviation on any similar site.
2. **Find the flagged cause** (marked in red, with Accept/Reject buttons). Read the note. Ask the
   room: does this actually fit? Reject it. *Narrow answer space ≠ no hallucination risk.*
3. **Work the safeguards.** Note the mix of verified / unverified / missing. Point out that
   "present-unverified" looks exactly like "present-verified" until someone checks.
4. **Before revealing anything, spend two minutes as a group**: what would YOU add, especially
   anything specific to this site? Type entries into "your team's pass".
5. **Click Reveal.** Compare what the room came up with to the authored site-specific catch. It is
   always a maintenance-log fact, an audit finding or a near-miss — never something generic.
6. **Try to mark the deviation reviewed before finishing the gate** — it's disabled. Clear every
   condition, then close it out and watch the worksheet grow.
7. **Repeat for two or three more deviations**, then read the worksheet tallies and the five callouts.

---

## Discussion questions

- Where does your organisation already hold the kind of site-specific knowledge that showed up in
  "what a site team caught" — and is it anywhere a HAZOP team can actually search it?
- The AI suggestion pool is generic by construction. What would make it *specific* to your site
  without it becoming just another document nobody reads?
- One AI-suggested cause didn't fit. What is the cost of a team that stops checking because the
  suggestions are usually right?
- "Present-unverified" is common in this exercise. What would it take at your site to close that
  gap systematically rather than one HAZOP action at a time?
- If a co-pilot like this ran ahead of every workshop and pre-filled the worksheet, what would the
  chair need to insist on before trusting it?

---

## Scenarios included

| id | folder | the node |
|---|---|---|
| `reactor-feed-line` | `data/reactor-feed-line/` | a continuous stirred-tank reactor's feed line — 5 deviations |
| `loading-bay-tanker` | `data/loading-bay-tanker/` | a road-tanker loading bay for a flammable solvent — 5 deviations |

Add more by copying `data/_TEMPLATE/` — see `data/_TEMPLATE/README.md`.

---

## Files

```
S9-hazop-copilot/
├── index.html        entry point — open this
├── app.js            checklist state + review gate + worksheet logic (no model, no network)
├── styles.css         projector-friendly, light + dark (shares S1–S8 tokens)
├── README.md          this file
└── data/
    ├── manifest.js
    ├── reactor-feed-line/dataset.js
    ├── loading-bay-tanker/dataset.js
    └── _TEMPLATE/
        ├── dataset.js
        └── README.md    dataset contract + authoring guidance
```

## Honesty rules baked in

- Banner: no model runs; deviation content is authored, your interaction state is real.
- At least one AI-suggested cause is deliberately a wrong pattern-match, with an explicit
  accept/reject step — hallucination risk is lower here, not zero.
- Every "human catch" is traceably site-specific (a log, an audit, a near-miss) — never something a
  generic model could plausibly know, which is the whole point of the contrast.
- Safeguards carry an honest status (verified / unverified / missing), not a flat "present" list.
- Framed throughout as a faster starting checklist for the chair and scribe, never a HAZOP-in-a-box.
