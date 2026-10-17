# S2 — How an LLM writes, one token at a time

**Course:** Integrating AI in Workplace Safety Practices
**Slot:** Day 1 · Topic 2a (tokens, embeddings, autoregressive generation, context window, temperature, hallucination)
**Run time:** 10–15 min facilitator-led, or leave open for delegates.

---

## What it teaches

> A large language model does exactly one thing: predict the next token, append it, and repeat.
> "Hallucination" is not a glitch bolted onto that process — it is what the same process does when
> the needed fact is not in the context window or the temperature is high enough to knock the
> correct token off the top.

The demo asks the model for **one specific fact** that is written in a reference block
(an exposure limit; a permit validity period). You control:

| Control | What it really does | The lesson |
|---|---|---|
| **Temperature** | divides the logits before the softmax | low = sharp distribution, copies the source; high = flat, improvises |
| **Top-k** | how many candidate tokens survive before the softmax | narrow k → temperature can barely act; wide k → tail tokens in play |
| **Context window** | how many trailing tokens the model can attend to | drag it down until the reference reads **EVICTED** — the fact is now unavailable |
| **Decoding** | greedy (argmax) vs seeded sampling | greedy ignores temperature until the ranking flips; sampling makes it and the seed matter |

The **Next-token prediction** panel shows the live probability bar chart for the current step
(the correct fact token is <u>underlined</u>, the chosen token is green). The **Output so far**
panel builds the sentence token by token, and at the end a **verdict** says whether the output
matched the reference or hallucinated.

---

## How to run it

- **Open `index.html` in a browser.** No server, no internet, no install.
- All "AI output" is pre-authored data in `data/<scenario>/dataset.js`. The softmax, temperature,
  top-k and seeded sampling maths are real and run in the page; the *logits* are authored so the
  demonstration is reproducible. Say this to the room.

---

## Suggested walkthrough

1. **Out of the box** (temperature 0.30, sample, full context): press **Auto-run**. The sentence
   builds and the verdict is green — the fact token was copied from the reference.
2. **Step through it once.** Use **Generate next token** and read the bar chart at each step. Note
   most steps have one dominant candidate — that is the ~5-logit gap. Point out the
   **fact-bearing step**: the correct number sits far above the distractors.
3. **Raise the temperature to ~1.3.** Step to the fact step and watch the bar chart *flatten*
   (distribution flatness climbs). With sampling, re-roll the seed a few times — eventually a wrong
   number wins. Teaching point: *fluency and invention are the same dial.*
4. **Reset. Drop temperature back to 0.30.** Now drag the **context window** left. Watch the
   `system` badge flip to EVICTED, then `reference` go PARTIAL, then EVICTED. Run again → the fact
   step switches to the **ungrounded** candidate set, the correct value is no longer on top, and the
   verdict is red. Teaching point: *hallucination here has a mechanical cause you just triggered.*
5. **Set Top-k = 1.** Temperature now does nothing (only one candidate). Set Top-k = 12 and raise
   temperature — maximum drift. Teaching point: *these knobs interact.*
6. Open **How this works** for the autoregressive / embeddings / grounding notes.

---

## Discussion questions

- Where in your real workflows is the "reference" reliably in the model's context, and where is it not?
- If fluency and hallucination are the same mechanism, what does that mean for "make it sound more confident" as a prompt?
- Greedy decoding looks safer here. What do you lose by always taking the top token?
- The wrong answers the model gave (50 ppm, 24 hours) were *plausible*. How would a reviewer who
  doesn't know the real value catch them?
- What would you require of a vendor's LLM feature before it drafts anything that feeds a safety decision?

---

## Scenarios included

| id | folder | the fact in play |
|---|---|---|
| `exposure-limit`  | `data/exposure-limit/`  | 8-hour TWA for a fictional Solvent B-12 = **25 ppm** (SDS extract) |
| `permit-validity` | `data/permit-validity/` | max hot-work permit validity = **12 hours** (procedure extract) |

Add more by copying `data/_TEMPLATE/` — see `data/_TEMPLATE/README.md`.

---

## Files

```
S2-token-by-token/
├── index.html        entry point — open this
├── app.js            tokeniser + softmax/temperature/top-k/sampling + rendering (no model, no network)
├── styles.css        projector-friendly, light + dark (shares S1's design tokens)
├── README.md         this file
└── data/
    ├── manifest.js               ordered scenario list for the picker
    ├── exposure-limit/dataset.js
    ├── permit-validity/dataset.js
    └── _TEMPLATE/
        ├── dataset.js            copy this to build a new scenario
        └── README.md             dataset contract + notes on authoring logits
```

## Honesty rules baked in

- Banner states no model runs and what maths *is* real.
- Reference sources are marked `[FICTIONAL, for demonstration only]` so nobody memorises a fake real-world limit.
- The hallucination-rate figure is tagged **independent**.
- The verdict is explicit about *why* an answer was right or wrong (in-context + low temp, vs evicted / sampled off-top).
