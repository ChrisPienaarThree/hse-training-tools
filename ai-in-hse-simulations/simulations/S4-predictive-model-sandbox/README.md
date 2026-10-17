# S4 — Four predictive models, one dataset

**Course:** Integrating AI in Workplace Safety Practices
**Slot:** Day 1 · Topic 2b (predictive models: regression, decision trees, random forests / gradient boosting, anomaly detection)
**Run time:** 12–18 min facilitator-led, or leave open to explore.

---

## What it teaches

> "Predictive analytics" is not one thing. Take the same structured data and score it with a
> regression, a single decision tree, a boosted ensemble and an anomaly detector, and you get
> four different numbers, four different ways to explain a decision, and four different failure
> modes. **Accuracy and explainability trade off** — and the right choice depends on whether a
> person has to defend each individual decision.

For one prediction target you get:

| Model | How it predicts | Explanation | Typical AUC here |
|---|---|---|---|
| **Regression** | weighted sum of features → S-curve | the coefficient table *is* the model | ~0.74 |
| **Decision tree** | one path of yes/no splits to a leaf | follow the highlighted path | ~0.68 (lower, unstable) |
| **Ensemble (boosted stumps)** | many weak rules, each nudging the score | contributions attributed *after the fact* (SHAP-style) | ~0.81 (best) |
| **Anomaly detector** | distance from the training distribution (z-scores) | "unlike anything seen", not "high risk" | n/a — unsupervised, no labels |

---

## How to run it

- **Open `index.html` in a browser.** No server, no internet, no install.
- Nothing was trained. The coefficients, the tree, the rules and the feature means/SDs are
  pre-authored. Every prediction, contribution bar and z-score is computed **live** from the
  sliders by the standard maths (sigmoid, tree traversal, a sum of rules, z-scores). Say this to
  the room — it is the same honesty stance as S2.

---

## Suggested walkthrough

1. **Pick "Crew B — under pressure".** Look at the four model cards: they broadly agree this crew
   is elevated risk, but the numbers differ. Disagreement between models on the same case is normal
   and worth discussing.
2. **Open the Regression detail.** The coefficient table has one fixed weight per factor. The
   contribution bars = weight × your value. *This is the whole model — there is nothing else to
   explain.*
3. **Open the Decision tree detail.** Follow the highlighted path — three questions to a leaf. Now
   nudge one slider across a split point (e.g. housekeeping 3.1 → 2.9) and watch the prediction
   **jump**. A single tree predicts in steps and is unstable.
4. **Open the Ensemble detail.** No single path. The rule list shows ~14 weak rules, each pushing
   the score up or down; the per-feature bars are an *approximate reconstruction*, not the
   mechanism. Best accuracy, hardest to defend line-by-line.
5. **Pick "Crew C — unusual mix".** All three predictors say low risk (~6–13%). Open the **Anomaly
   detector**: it flags an OUTLIER — overtime is 5+ SD from normal. It says nothing about incident
   risk; it says *this crew is not like the data the models were built on, so don't trust their
   numbers.* Different question, no labels needed.
6. **Scoreboard.** Walk the rows: prediction, AUC, how you explain one decision, data needed,
   failure mode, what to ask the vendor.

---

## Discussion questions

- For a decision a worker could challenge (a "high-risk" flag that changes their duties), which of
  these four could you actually defend to them? To a tribunal?
- The ensemble had the best AUC. What would you need from the vendor before you would let it drive
  an action on its own?
- The single tree lurched when one value crossed a split. Where in your data would that
  step-behaviour be dangerous?
- Anomaly detection needs no outcome labels. Where could you use it *today* that a predictive model
  would need years of incident history first?
- "Crew C" scored low everywhere but was an outlier. What's the safe way to treat a low score on an
  out-of-distribution case?

---

## Scenarios included

| id | folder | target |
|---|---|---|
| `crew-incident-risk` | `data/crew-incident-risk/` | P(recordable incident on this crew in the next 30 days) |
| `equipment-failure-risk` | `data/equipment-failure-risk/` | P(unplanned failure of this asset in the next 90 days) |

Add more by copying `data/_TEMPLATE/` — see `data/_TEMPLATE/README.md`.

---

## Files

```
S4-predictive-model-sandbox/
├── index.html        entry point — open this
├── app.js            sigmoid / tree traversal / stump sum / z-scores + rendering (no training, no network)
├── styles.css        projector-friendly, light + dark (shares S1–S3 tokens)
├── README.md         this file
└── data/
    ├── manifest.js
    ├── crew-incident-risk/dataset.js
    ├── equipment-failure-risk/dataset.js
    └── _TEMPLATE/
        ├── dataset.js
        └── README.md     dataset contract + the maths app.js runs
```

## Honesty rules baked in

- Banner: nothing was trained; the parameters are authored, the maths is real and runs on your slider values.
- AUC figures are labelled "authored" — they are illustrative, not benchmarks.
- The ensemble's per-feature contribution is labelled **approximate attribution** (real tools use SHAP).
- The anomaly detector's output is explicitly *not* a risk number — the verdict text says so.
