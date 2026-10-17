# Adding a scenario to S4

Each scenario is one folder under `data/`. Copy `_TEMPLATE/` and fill in `dataset.js`.

## Steps

1. **Copy the folder**
   ```
   cp -R data/_TEMPLATE data/my-scenario-id
   ```

2. **Edit `data/my-scenario-id/dataset.js`**
   - Change the registration key and `id` from `"TEMPLATE-ID"` to `"my-scenario-id"` (must match the folder).
   - Define `features[]` (each: `key`, `label`, `min`, `max`, `step`, `mean`, `sd`). The `key`s are used
     everywhere — `regression.coef`, `tree` nodes, `ensemble.stumps`, `anomaly.scatterX/Y`, `cases`.
   - Author the four models' parameters. `op` is always `">="`.
   - Give 3 preset `cases`. Make one of them an **unusual mix**: values that are each plausible but
     jointly far from the means, so the anomaly detector fires while the predictors stay low.

3. **Register it** — a `<script src>` line in `index.html` (after `manifest.js`, before `app.js`)
   and a `{ id, label }` row in `data/manifest.js`.

4. **Test** — open `index.html`, pick the scenario, and check:
   - each preset case gives sensible, not-identical predictions across the four models;
   - dragging a feature slider updates all four live;
   - the tree highlights a single path to a leaf;
   - the "unusual mix" case flags in the anomaly view and shows the out-of-range feature(s).

## The maths app.js runs (on your authored parameters)

| model | computation |
|---|---|
| regression | `p = sigmoid(intercept + Σ coef[k] · x[k])` |
| tree | traverse `{f, op, thr, yes, no}` (go `yes` when `x[f] >= thr`) to a `{p, n}` leaf |
| ensemble | `p = sigmoid(base + Σ stump)` where each `stump = (x[f] >= thr) ? yes : no` |
| anomaly | `z[k] = (x[k] − mean[k]) / sd[k]`; flag if `rms(z) > thresholdRms` **or** `max|z| > thresholdMax` |

Per-feature **contributions**:
- regression: `coef[k] · x[k]` (in log-odds), shown as diverging bars.
- ensemble: sum of the stump outputs for that feature, minus their outputs at the feature mean
  (a crude live attribution — the panel says so; real tools use SHAP).

## Authoring tips

- Start from the mean case: set `intercept` / `base` so it lands near your true base rate, then
  place the preset cases.
- Two stumps per feature (a "getting bad" threshold and a "very bad" threshold) gives a smooth,
  believable ensemble surface.
- Keep the tree to depth 3 so it draws cleanly on a projector.
- `cloud` only needs the two scatter features; 25–30 points is plenty.
