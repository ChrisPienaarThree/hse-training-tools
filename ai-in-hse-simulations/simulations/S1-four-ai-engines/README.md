# S1 — Four kinds of AI, one incident

**Course:** Integrating AI in Workplace Safety Practices
**Slot:** Day 1 · Topic 1 (AI / ML / DL / GenAI) and Topic 2 (AI technologies for HSE)
**Run time:** 12–18 min as a facilitator-led walkthrough, or leave it open for delegates to explore.

---

## What it teaches

> "AI for HSE" is never one thing. It is at least four different families of tool, each with a
> different **input**, a different **output**, a different **way to be validated**, and a
> different **way to fail**.

The demo takes **one workplace near-miss** and feeds it to four engines at once:

| Panel | Family | Input it gets | What it returns |
|---|---|---|---|
| Computer vision | detection / classification | a camera still | bounding boxes + class + confidence |
| Predictive model | regression-style risk score | structured site metrics | one probability + a risk band + factor weights |
| NLP classifier | text classification | the free-text narrative | coded fields (event type, source, body part…) + confidence |
| Generative (LLM) | text generation | a prompt + the facts | a drafted toolbox talk |

The bottom table is the actual takeaway — a **buyer's checklist**: for any "AI safety" product a
vendor shows you, which of these four is it, and therefore what evidence should you demand.

---

## How to run it

- **Just open `index.html` in a browser.** No server, no internet, no install. Works offline from a
  USB stick or a training-room laptop.
- Everything is pre-authored data in `data/<scenario>/dataset.js`. **No model runs.** The sliders
  step between authored states; they do not compute anything. Say this to the room — it is the point.
- Theme button top-right cycles system / light / dark for the projector.

---

## Suggested walkthrough

1. **Read the situation card aloud.** One near-miss. Everyone has the same facts.
2. **Computer vision.** Point out confidence values, then drag *Image conditions* from Good to Very
   poor. Watch recall collapse and false positives appear. Land the confusion matrix: precision /
   recall / **false-alarm rate** — and the alert-fatigue line. *"A vendor demo reel tells you nothing
   about your site."*
3. **Predictive model.** Note the single number, then the factor-weight bars — this is
   *explainability*. Toggle the state slider to **"under-reported"**: the score drops, the risk did
   not. Toggle to **"drift"**: the number still looks confident, the backtest AUC has decayed.
4. **NLP classifier.** Switch the narrative from *written up properly* to *as actually written* (a
   terse / second-language version of the **same** incident). One field miscodes; others fall below
   the review threshold. *"Output quality tracks input quality — that is a fairness problem."*
5. **Generative.** Read the low-temperature draft — it is genuinely good. Drag temperature up: the
   model invents a regulation, invents a statistic, assumes an outcome and assigns blame, all in the
   same confident voice. Make them tick the **review checklist** to enable sign-off. *"There is no
   accuracy score here. The validation is you, and your name on it."*
6. **Synthesis table.** Walk the five rows. This is what they take away.

---

## Discussion questions

- For each panel: what would you need to see from a vendor before you would trust it on your site?
- The vision model missed 4 in 10 real hazards in poor light but still fired constant false alarms.
  Which is worse operationally? Which is worse legally?
- The predictive score fell when reporting got worse. How would you even detect that in production?
- If a generative draft goes out with an invented regulation and someone acts on it, who is
  accountable — the tool, the buyer, the reviewer who signed off?
- Which of the four is the *easiest* to validate honestly? Which is the hardest?

---

## Scenarios included

| id | folder | situation |
|---|---|---|
| `warehouse-fall` | `data/warehouse-fall/` | picker over-reaches from a leaning ladder at 4.1 m in a high-bay DC; carton dropped into an occupied aisle; no injury |
| `forklift-pedestrian` | `data/forklift-pedestrian/` | reversing counterbalance forklift stops ~1 m from a pedestrian crossing outside the walkway through a damaged barrier |

Add more by copying `data/_TEMPLATE/` — see `data/_TEMPLATE/README.md`.

---

## Files

```
S1-four-ai-engines/
├── index.html        entry point — open this
├── app.js            render + interaction logic (no model, no network)
├── styles.css        projector-friendly, light + dark
├── README.md         this file
└── data/
    ├── manifest.js               ordered list of scenarios for the picker
    ├── warehouse-fall/
    │   ├── dataset.js            all four engines' authored output for this scenario
    │   └── scene.svg             synthetic camera still (illustration, not a photo)
    ├── forklift-pedestrian/
    │   ├── dataset.js
    │   └── scene.svg
    └── _TEMPLATE/
        ├── dataset.js            copy this to build a new scenario
        ├── scene.svg
        └── README.md             how to add a scenario
```

## Honesty rules baked into every dataset

- Header banner states plainly that nothing runs and all output is authored.
- Every external number is tagged **independent** vs **vendor-reported**.
- Every panel shows a real failure mode, not just a success.
- Every panel names the human who stays in the loop.
