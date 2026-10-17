# Adding a scenario to S10

Copy `_TEMPLATE/` to `data/<your-id>/`, edit `dataset.js` (change the registration key/`id` to match
the folder), register it with a `<script src>` line in `index.html` and a row in `data/manifest.js`.

- Keep field vocabularies small and **shared across every narrative** (e.g. 5-6 event types total)
  so the Pareto chart aggregates meaningfully.
- Give each narrative a `trueCodes` and one plausible-but-wrong `altCodes` set per field.
- Mix `quality: "clean"` and `quality: "poor"` narratives (poor = terse / second-language, same incident type).
- `fieldDifficulty` (0-1) sets how reliably that field codes at "ideal" training size and text quality.
- Test: at a low training-size slider value, the Pareto chart should visibly diverge from the true
  counts; at the maximum, it should converge; poor-quality narratives should lag clean ones at every
  setting.
