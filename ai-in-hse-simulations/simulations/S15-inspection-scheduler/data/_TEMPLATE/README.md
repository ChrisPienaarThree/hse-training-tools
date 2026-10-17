# Adding a scenario to S15

Copy `_TEMPLATE/` to `data/<your-id>/`, edit `dataset.js` (match the registration key/`id` to the
folder), register with a `<script src>` in `index.html` and a row in `data/manifest.js`.

- List 12-16 `assets`, each with `severity` (1-5) and `ncRate` (0-1, the monthly probability of a
  new fault arising). Vary both for a realistic spread — a few high-severity/low-rate assets, a few
  low-severity/high-rate ones.
- `budget` and `horizon` ranges rarely need scenario-specific tuning; the defaults work for 12-16 assets.
- Test: with the default budget, across a handful of re-seeds, the risk-weighted strategy's average
  detection age for the higher-risk half of assets (ranked by severity × historical rate) should be at
  or below uniform's — that's the actual claim the sim makes. It should NOT reliably catch more total
  faults or beat uniform's unweighted, whole-population average age — a schedule that concentrates a
  fixed budget on high-priority assets necessarily visits low-priority ones less, and a dataset where
  it doesn't show that trade-off isn't a realistic one.
