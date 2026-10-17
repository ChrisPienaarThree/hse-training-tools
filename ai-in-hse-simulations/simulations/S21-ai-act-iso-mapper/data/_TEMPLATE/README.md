# Adding a scenario to S21

Copy `_TEMPLATE/` to `data/<your-id>/`, edit `dataset.js` (match the registration key/`id` to the
folder), register with a `<script src>` in `index.html` and a row in `data/manifest.js`.

- Keep the 6 `questions` and their categories as-is unless you have a specific reason to change the
  underlying rule set.
- Exactly 3 `presets`, ideally landing in 3 different tiers. Hand-walk the priority order
  (prohibited > high-risk > limited-risk > minimal-risk) for each preset's answers and confirm the
  tier your `note` claims.
- Reuse the same `isoMapping` rows verbatim from an existing scenario — they're generic reference
  content, not scenario-specific.
- Test: hand-classify all 3 presets and confirm the app agrees; type a filter term into the Part B
  search box and confirm the row count shown matches a manual count.
