# S7 — Predictive site-risk cockpit

**Course:** Integrating AI in Workplace Safety Practices
**Slot:** Day 2 · Topic 3 (predictive analytics for safety risk); also Day 3 · Topic 1
(near-miss analytics) and the model-reliability / drift material.
**Run time:** 15–20 min facilitator-led, or leave open to explore.

---

## What it teaches

> A predictive site-risk dashboard is a **logistic model** fed by **leading indicators**. It can
> be genuinely useful — *if* it drives action tied to a specific driver. But two things quietly
> break it in production:
>
> - **Model drift.** The coefficients are frozen at the day the model was fitted; the site keeps
>   changing. Accuracy decays and nothing on the screen says so. Retraining fixes it — until it
>   drifts again.
> - **Under-reporting bias.** Fewer near-miss reports look like less risk. If reporting slips, the
>   predicted number falls while the real risk doesn't — false comfort, printed in green. And
>   retraining on that data just bakes the blind spot in.

Plus: leading vs lagging indicators, per-organisation validation, and the very thin independent
evidence that these predictions change outcomes.

---

## How to run it

- **Open `index.html` in a browser.** No server, no internet, no install.
- Nothing was trained. The coefficients, means/SDs, drift terms and thresholds are authored. The
  standardisation, the logistic prediction, the drifting "true" risk, the seeded weekly outcomes
  and every gap are computed live — same honesty stance as S4/S5/S6.

---

## Controls

| Control | Effect |
|---|---|
| **Leading-indicator sliders** | drive the prediction and the factor waterfall |
| **Weeks since the model was fitted** | advances time — the true risk drifts away from the frozen prediction |
| **Reporting culture** | scales the near-miss count the model is *fed*, without changing the real hazard |
| **Retrain now** | re-fits the model at the current week (closes the drift gap; **not** the under-reporting gap) |
| **Re-seed outcomes** | a new random draw of the weekly recordable events |

---

## Suggested walkthrough

1. **Default state.** Predicted ~11%, model health **Good**, predicted ≈ estimated-true. Walk the
   factor waterfall — each bar is `coefficient × standardised indicator`. Read the recommended
   actions: every one is tied to a driver.
2. **Raise "overdue actions" and "agency crew".** Prediction climbs, the bars grow, new actions
   appear. This is the tool working as intended.
3. **Drag "weeks since fitted" out to ~30.** The red *true-risk* line pulls away from the blue
   *frozen-prediction* line on the chart; model health goes **Drifting → Stale**; the calibration
   gap widens. The dashboard number now understates the risk and never flags it.
4. **Press "Retrain now".** The prediction snaps back to the truth and health returns to Good. Note
   the caption: nothing told you *when* to do that.
5. **Reset time. Now drag "reporting culture" down to ~60%.** The predicted number *falls*. But the
   *estimated true risk* holds — or rises, because a collapsing reporting culture is itself a
   hazard. The "Reporting-culture check" panel shows the two side by side: **false comfort**.
6. **Press "Retrain now" while reporting is low.** The gap does **not** close — you just retrained
   on under-reported data.
7. Read the five **"what the cockpit cannot show you"** callouts.

---

## Discussion questions

- Which of your current dashboards is a frozen model? When was it last refitted, and who owns that?
- The drift was invisible on the dashboard. What signal *would* have caught it, and where would it live?
- If reporting drops, this model says "safer". What independent check would you pair it with?
- The model runs on leading indicators but the board asks about the lagging rate. How do you hold both?
- A 1,200-study review found two that measured whether prediction changed an outcome. What would
  *your* before/after measurement look like?

---

## Scenarios included

| id | folder | profile |
|---|---|---|
| `distribution-centre` | `data/distribution-centre/` | overdue actions, agency crew and fatigue dominate; peak-season drift |
| `construction-project` | `data/construction-project/` | permit load and subcontractor mix dominate; faster drift as the project ramps |

Add more by copying `data/_TEMPLATE/` — see `data/_TEMPLATE/README.md`.

---

## Files

```
S7-predictive-site-risk-cockpit/
├── index.html        entry point — open this
├── app.js            standardisation + logistic prediction + drift/true-risk + seeded weekly outcomes + render (no training, no network)
├── styles.css        projector-friendly, light + dark (shares S1–S6 tokens)
├── README.md         this file
└── data/
    ├── manifest.js
    ├── distribution-centre/dataset.js
    ├── construction-project/dataset.js
    └── _TEMPLATE/
        ├── dataset.js
        └── README.md     dataset contract + the equations app.js runs
```

## Honesty rules baked in

- Banner: nothing was trained; coefficients authored, the arithmetic is real and hand-checkable.
- The "true risk" the prediction is judged against is shown explicitly, not hidden.
- Retrain visibly fixes drift and visibly fails to fix under-reporting.
- The thin-evidence callout is tagged as independent and repeated in the drawer.
- Framed as a tool to direct attention and action, never a verdict or a performance grade.
