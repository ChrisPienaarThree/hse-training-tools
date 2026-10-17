# S11 — AI-assisted incident investigation

**Course:** Integrating AI in Workplace Safety Practices
**Slot:** Day 3 · Topic 2 (AI-assisted incident investigation)
**Run time:** 15–20 min facilitator-led.

---

## What it teaches

> A COMET-style investigation assistant can draft the mechanical parts of a report — timeline,
> causes, a search for similar past incidents — in seconds. That is real, useful speed. It is also
> exactly where a hallucinated citation is easiest to miss: a "similar incident" with a plausible
> case number, formatted identically to the real ones, that does not exist. Every panel here is
> marked **DRAFT**, and the report cannot be finalised until an investigator has verified each one —
> including checking every citation against the actual repository, not against how convincing it reads.

---

## How to run it

- **Open `index.html` in a browser.** No server, no internet, no install.
- No model runs. The narrative and every drafted section are pre-authored. Checking a case
  reference against the repository, your review checkboxes, the include/exclude decision and the
  finalize gate are computed live — same honesty stance as the rest of the series.

---

## Controls

| Control | Effect |
|---|---|
| **Section review checkboxes** (6, one per panel) | mark that you have reviewed / corrected that section |
| **Check repository** (on each similar incident) | a real lookup against the authored repository — verified or not found |
| **Include in report** | your call on whether a similar incident stays in the final report |
| **Finalize investigation report** | disabled until every gate condition is met |

---

## Suggested walkthrough

1. **Read the narrative aloud**, then scroll the drafted sections. Note the DRAFT badge on every one.
2. **Timeline.** Point out the two entries tagged "inferred" — not in the narrative, filled by a
   typical sequence. Ask: would you sign that off without checking the first-aid log?
3. **Root causes and the five whys.** These are judgement calls dressed as a structure — a
   reasonable starting point, not a finding.
4. **Similar past incidents.** Click "Check repository" on all four, one at a time. Three verify.
   The third does not — read the exact phrasing of the "no record found" result, then compare it to
   how confident and specific the original suggestion sounded.
5. **Try to leave the fabricated one included** and attempt to finalize — the gate blocks it. Untick
   "Include in report" on that one, then finalize.
6. **Read the finalize receipt** and the five callouts.

---

## Discussion questions

- If the fabricated "similar incident" had matched the narrative even more closely, would your team
  have caught it? What would make that more or less likely under time pressure?
- Which sections here would you trust an AI to draft unsupervised for a low-severity near-miss?
  Which would you never skip your own read of, regardless of severity?
- The gate enforces "checked", not "correct". What is the residual risk that remains even after
  every box is ticked?
- Who signs the finalized report, and does the tool's involvement need to be disclosed in it?
- What would it take at your site to actually build the "repository" this demo checks against?

---

## Scenarios included

| id | folder | the incident |
|---|---|---|
| `forklift-collision` | `data/forklift-collision/` | two forklifts collide at an undefined yard junction; a fractured arm |
| `chemical-splash` | `data/chemical-splash/` | a technician is splashed during a solvent transfer after a gauge fault went unreported |

Add more by copying `data/_TEMPLATE/` — see `data/_TEMPLATE/README.md`.

---

## Files

```
S11-incident-investigation-assistant/
├── index.html        entry point — open this
├── app.js            checklist state + repository lookup + finalize gate (no model, no network)
├── styles.css         projector-friendly, light + dark (shares S1–S9 tokens)
├── README.md          this file
└── data/
    ├── manifest.js
    ├── forklift-collision/dataset.js
    ├── chemical-splash/dataset.js
    └── _TEMPLATE/
        ├── dataset.js
        └── README.md    dataset contract + authoring guidance
```

## Honesty rules baked in

- Banner: no model runs; the narrative and drafts are authored, your interaction state is real.
- Every panel carries a DRAFT badge; nothing reaches "finalized" without an explicit human sign-off.
- The fabricated similar-incident citation is indistinguishable in format from the real ones — the
  lesson is that it does not announce itself, and checking is the only defence.
- Timeline entries are honestly split into stated-in-narrative vs inferred-by-the-assistant.
- Root-cause categorisation and action ownership are framed as human judgement calls throughout.
