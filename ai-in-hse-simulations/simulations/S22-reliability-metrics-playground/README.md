# S22 — AI reliability metrics playground

**Course:** Integrating AI in Workplace Safety Practices
**Slot:** Day 5 · Topic 4 (evaluating AI reliability)
**Run time:** 15–20 min facilitator-led. Works well as a closing session tying the whole suite together.

---

## What it teaches

> Precision, recall, specificity and false-alarm rate are not interchangeable, and "accuracy" hides
> which one you're actually getting. At a rare event rate, a detector that never fires anything
> scores brilliant accuracy and zero recall — the single most common way a reliability claim
> misleads in a safety context. Moving the decision threshold trades false alarms against misses
> along a fixed curve; it does not make a weak model better. And concept drift moves your operating
> point off that curve quietly, exactly like S7's calibration gap and S5's false-alarm creep — this
> is the shared vocabulary behind every trust meter in the suite.

---

## How to run it

- **Open `index.html` in a browser.** No server, no internet, no install.
- No model runs. Population size, default prevalence/separation/drift rate and the framing labels
  are pre-authored. Every score is a seeded random draw; every confusion-matrix count, every
  metric, the swept ROC curve and its AUC, and the recalibrated threshold are computed live — same
  honesty stance as the rest of the series.

---

## Controls

| Control | Effect |
|---|---|
| **Prevalence** (+ presets) | how common the real event actually is — does not change the model, only what a naive baseline can hide behind |
| **Model discriminative power** | how separated the two score distributions are — sets the best achievable ROC curve |
| **Decision threshold** | moves you along the current curve: fewer false alarms ⇄ lower recall |
| **Weeks since deployment** | drifts the negative-class scores toward the threshold over time |
| **Recalibrate threshold** | snaps to the best trade-off (Youden's J) on the *current*, possibly drifted, population |
| **Reset / Re-seed** | back to scenario defaults / a fresh random population |

---

## Suggested walkthrough

1. **Default state.** Read the confusion matrix and the metrics row. Point at the baseline card:
   "never flag anything" already scores very high accuracy at this prevalence.
2. **Drag the threshold up, then down.** Watch precision and recall trade in opposite directions,
   and watch the red dot slide along the ROC curve. It never leaves the curve.
3. **Drag "model discriminative power" down to its minimum.** The whole curve collapses toward the
   diagonal (a coin flip) and the AUC drops. No threshold choice rescues a model with no
   discriminative power — that is the point of separating this slider from the threshold slider.
4. **Reset. Push prevalence down to the "rare" preset.** Watch the baseline accuracy climb toward
   ~98% while its recall stays at zero. Ask: would a report that only quoted accuracy have caught this?
5. **Advance "weeks since deployment."** At the *same* threshold, recall and precision both
   degrade — the operating point has drifted off the curve you validated. Press **Recalibrate** and
   watch it snap back onto the (now-shifted) best trade-off.
6. **Read the five callouts**, especially the tie-back to S1/S5/S7.

---

## Discussion questions

- Which of the earlier simulations' "trust meters" or thresholds map onto which metric here?
- If you could only report one number to a safety committee, which would you pick — and what would
  you insist went with it?
- At what point does "recalibrate whenever it drifts" become its own governance problem — who
  decides when, and against what ground truth?
- For a rare, severe event, would you rather over-alarm or under-alarm? What does that answer do to
  where you'd sit on the ROC curve?
- What would you need from a vendor to trust their AUC claim on your own data, not theirs?

---

## Scenarios included

| id | folder | the framing |
|---|---|---|
| `ppe-alert` | `data/ppe-alert/` | the PPE camera detector from S5 — is this really a hard-hat violation? |
| `elevated-risk-day` | `data/elevated-risk-day/` | the predictive cockpit from S7 — is this really an elevated-risk day? (deliberately a weaker default model, matching S7's evidence-base caveat) |

Add more by copying `data/_TEMPLATE/` — see `data/_TEMPLATE/README.md`. Unlike most simulations in
this suite, S22's scenarios only supply *framing* — the statistical machinery is shared.

---

## Files

```
S22-reliability-metrics-playground/
├── index.html        entry point — open this
├── app.js             population generation + confusion matrix + metrics + ROC/AUC + recalibration (no model, no network)
├── styles.css         projector-friendly, light + dark (shares S1–S11 tokens)
├── README.md          this file
└── data/
    ├── manifest.js
    ├── ppe-alert/dataset.js
    ├── elevated-risk-day/dataset.js
    └── _TEMPLATE/
        ├── dataset.js
        └── README.md    dataset contract — framing only; the maths is shared
```

## Honesty rules baked in

- Banner: no model runs; population parameters authored, every score/count/metric/curve computed live and hand-checkable.
- The accuracy-paradox baseline is always visible, not a toggle you might forget to check.
- Threshold and model quality are deliberately separate sliders so "moving the threshold" can never
  be mistaken for "improving the model."
- Drift is framed honestly as invisible until measured — recalibration is offered, never automatic.
