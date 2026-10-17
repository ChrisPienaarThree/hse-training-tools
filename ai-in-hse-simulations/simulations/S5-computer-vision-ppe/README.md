# S5 — Computer vision on a safety camera

**Course:** Integrating AI in Workplace Safety Practices
**Slot:** Day 2 · Topic 4 (computer vision for hazard detection); also Day 1 · Topic 2, and the
reliability-metrics / alert-fatigue material.
**Run time:** 15–20 min facilitator-led, or leave open to explore.

---

## What it teaches

> "Computer vision for safety" is one video pipeline running several detectors. Each detector has
> its own difficulty, its own false-alarm rate and its own failure mode — a single "accuracy"
> number hides all of it. Degrade the image and **recall falls while false alarms rise**. Every
> false alarm spends supervisor trust, and below the fatigue line the alerts get dismissed on
> sight — **including the real one**. And every figure was set at the validation site; on an unseen
> camera the model is guessing.

---

## How to run it

- **Open `index.html` in a browser.** No server, no internet, no install.
- No vision model runs. Each detector's ideal reliability, the condition-effect coefficients and
  the ground-truth hazard windows are pre-authored. A **real seeded per-frame detector draw**, the
  accumulating confusion matrix, every metric and the alert-fatigue curve are computed live. Same
  seed + settings → same run. (Same honesty stance as S2 and S4.)

---

## Controls

| Control | Effect |
|---|---|
| **Play / step / scrub / re-seed** | run the ~150-frame clip; re-seed for a different random draw of the same model |
| **Image conditions** (lighting, motion blur, occlusion, weather) | each scales the detectors' effective recall **down** and false-alarm rate **up** |
| **Deployment: validated here / elsewhere** | "elsewhere" applies a site-mismatch penalty — recall ×0.7, false alarms ×2.2 |
| **Detectors running** | toggle each of the seven; a detector for a hazard that is not present can only false-alarm |
| **Confidence threshold** | raise it → fewer false alarms **and** lower recall |
| **Confusion-matrix focus** | all detectors combined, or one at a time |

---

## Suggested walkthrough

1. **Press Play at the default settings.** Watch boxes appear near the worker / zone / spill and
   jitter. Green = true detection, amber dashed = false alarm. The confusion matrix fills up; the
   supervisor-trust meter drifts down as false alarms accrue.
2. **Focus the matrix on "Hard hat missing", then "Gloves missing".** Same pipeline, same
   conditions — hard hat recall stays high, gloves recall is poor. *Difficulty is per-detector.*
3. **Drag lighting and weather up to ~0.6.** Re-run. Recall collapses, the false-alarm rate on the
   "Restricted-zone entry" detector explodes, and the trust meter hits the red "tuned out" state.
   Scroll the alert log to the first **MISSED HAZARD** line — a real serious alert dismissed
   because the supervisor had stopped looking.
4. **Reset conditions. Raise the confidence threshold to ~0.8.** False alarms drop — and so does
   recall, in the same drag. Show there is no setting that gives both.
5. **Flip "Deployed elsewhere".** Every metric degrades at once, and nothing on the readout warns
   the supervisor that the model is now out of its validated envelope.
6. **Turn off the detectors this site doesn't need** (forklift proximity in the steel scene). Fewer
   false alarms, no loss of real coverage.
7. **Scorecard.** Walk the per-detector table and the three callouts.

---

## Discussion questions

- If the safety-critical detector (harness at height) is also the least reliable, what does a
  vendor's single "95% accurate" claim actually tell you?
- How many false alarms per shift before your supervisors mute the panel? How would you measure that?
- The threshold is one slider for the whole pipeline. What would per-detector thresholds need?
- "Deployed elsewhere" degraded everything silently. What would a deployment gate look like that
  refuses to run without a site-specific labelled test set?
- A missed hazard here came from a *chatty minor* detector burying a *serious* one. How do you rank
  or route alerts so that cannot happen?

---

## Scenarios included

| id | folder | the scene |
|---|---|---|
| `warehouse-aisle` | `data/warehouse-aisle/` | picking aisle: PPE, a crossing forklift (proximity), a dock-edge restricted zone, a static spill |
| `steel-erection` | `data/steel-erection/` | work at height: a worker unclips their harness, a second drifts toward an edge-protection gap; no mobile plant |

Add more by copying `data/_TEMPLATE/` — see `data/_TEMPLATE/README.md`.

---

## Files

```
S5-computer-vision-ppe/
├── index.html        entry point — open this
├── app.js            scene interpreter + seeded per-frame detector + confusion matrix + alert-fatigue model (no vision model, no network)
├── styles.css        projector-friendly, light + dark (shares S1–S4 tokens)
├── README.md         this file
└── data/
    ├── manifest.js
    ├── warehouse-aisle/dataset.js
    ├── steel-erection/dataset.js
    └── _TEMPLATE/
        ├── dataset.js
        └── README.md     dataset contract + the maths app.js runs
```

## Honesty rules baked in

- Banner: no vision model runs; parameters authored, the per-frame simulation and all metrics are real and reproducible from the seed.
- The confusion matrix uses "frames with no hazard and no alert" as true negatives, so the false-alarm rate is meaningful.
- Alert fatigue is presented as a measurable safety hazard, with the false-alarm → missed-hazard chain shown explicitly in the alert log.
- "Deployed elsewhere" makes the site-pilot point unavoidable: never trust numbers from another site.
