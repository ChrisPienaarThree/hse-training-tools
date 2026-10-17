# S10 — NLP incident coding, at volume

**Course:** Integrating AI in Workplace Safety Practices · **Slot:** Day 3 · Topic 1 (also Day 1 · Topic 2)
**Run time:** 10–15 min.

## What it teaches

> Coding accuracy is not a fixed number — it rises with training-set size along a real saturating
> curve, exactly like the independent NIOSH/BLS benchmark (82% → 90%). Below a small training size,
> the wrong codes don't just mislabel one row: the aggregate Pareto chart a safety team acts on can
> be dominated by miscoded near-misses. Terser, second-language narratives lose accuracy fastest —
> a fairness issue, not just noise. Nothing below the review threshold should reach a KPI unchecked.

## How to run it

Open `index.html`. No server, no model. Every narrative's true code and one plausible wrong
alternative are authored; the accuracy curve, the seeded per-field draw, the confidence shown, and
the Pareto aggregation are computed live.

## Controls

| Control | Effect |
|---|---|
| Training set size | moves accuracy along a real saturating curve |
| Re-seed draws | a fresh random draw of which fields land correct vs wrong |
| Mark reviewed (per low-confidence field) | forces the true code, clears the queue |

## Suggested walkthrough

1. Drag training size to its minimum. Watch several fields go red (wrong) and the Pareto chart's
   red (displayed) bars diverge from the green (true) bars.
2. Drag it to the maximum — convergence.
3. Compare a "clean" vs "poor" narrative at the same training size — poor lags every time.
4. Clear the review queue field by field; watch the tally and the chart both improve.

## Scenarios

| id | folder |
|---|---|
| `near-miss-batch` | warehouse near-misses |
| `process-batch` | process-safety near-misses |

Add more via `data/_TEMPLATE/`.

## Honesty rules baked in

No model runs; the accuracy curve and every draw are real and hand-checkable; poor-text penalty is
explicit; the Pareto chart shows displayed (possibly wrong) codes, not a sanitised view.
