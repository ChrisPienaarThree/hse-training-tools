# Adding a scenario to S7

Each scenario is one folder under `data/`. Copy `_TEMPLATE/` and fill in `dataset.js`.

## Steps

1. **Copy the folder**
   ```
   cp -R data/_TEMPLATE data/my-scenario-id
   ```

2. **Edit `data/my-scenario-id/dataset.js`**
   - Change the registration key and `id` from `"TEMPLATE-ID"` to `"my-scenario-id"` (must match the folder).
   - Define 5–7 `indicators`. Each needs `min/max/step/default` for the slider and `mean/sd/coef`
     for the model. Safer-when-higher indicators (training, induction) get a **negative** `coef`.
   - Mark the near-miss / minor-event indicator `underreportable: true` — that is the one the
     reporting-culture slider deflates.
   - Give one or two indicators a small `driftPerWk` (e.g. `0.005`) so their effect grows as the
     site changes — this is what "model drift" looks like.
   - Set `intercept` so the default sliders produce your real base rate (`logit(0.10) ≈ -2.2`).
   - Fill `drift.latentPerWeek`, the `health` thresholds, the per-driver `actions`, the `callouts`
     and the `notes`.

3. **Register it** — a `<script src>` line in `index.html` (after `manifest.js`, before `app.js`)
   and a `{ id, label }` row in `data/manifest.js`.

4. **Test** — open `index.html`, pick the scenario, and check:
   - the default predicted probability is near your intended base rate;
   - raising a positive-coef indicator raises the prediction and its factor bar;
   - advancing "weeks since fitted" makes the true-risk line pull away from the frozen prediction,
     the model-health pill goes Drifting → Stale, and **Retrain** closes the gap;
   - dropping the reporting-culture slider makes the predicted number fall while the estimated true
     risk holds or rises, and a Retrain here does **not** close that gap.

## The maths app.js runs (on your authored parameters)

```
z_i(v)      = (v - mean_i) / sd_i
reported_i  = underreportable_i ? round(true_i · reportingFactor) : true_i
refitWeeks  = weeks-since-fit at the last Retrain (0 initially)
nowWeeks    = weeks-since-fit slider

logit_pred  = intercept
            + latentPerWeek·refitWeeks + seasonal(baseWeek + refitWeeks)
            + Σ (coef_i + driftPerWk_i·refitWeeks) · z_i(reported_i)

logit_true  = intercept
            + latentPerWeek·nowWeeks + seasonal(baseWeek + nowWeeks)
            + Σ (coef_i + driftPerWk_i·nowWeeks) · z_i(true_i)
            + culturePenaltyAtWorst · (1 − reportingFactor)/(1 − reportingFloor)

p_pred / p_true = sigmoid(logit_*)            (30-day probabilities)
p_week          = 1 − (1 − p_30)^(7/30)       (for the weekly outcome series)
observed(w)     = seeded Bernoulli(p_true_week(w))     over the trailing 26 weeks
back-tested actual (30 d) = mean(observed, trailing 26 w) × 30/7
calibration gap = | p_pred − back-tested actual |
model health    = from weeks-since-fit vs driftWeeksWarn/Stale and the gap vs gapWarn/Stale
```

`seasonal(w) = drift.seasonalAmp · sin(2π·(w + seasonalPhase) / seasonalPeriod)`.

Everything is real arithmetic on your authored parameters — hand-checkable.
