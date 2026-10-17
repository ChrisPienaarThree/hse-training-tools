# Adding a scenario to S14

Copy `_TEMPLATE/` to `data/<your-id>/`, edit `dataset.js` (match the registration key/`id` to the
folder), register with a `<script src>` in `index.html` and a row in `data/manifest.js`.

- 5-6 `themes`, 4-5 `locations`, 3 `shifts`. Give each item a `weight` (relative, any positive number).
- Use `locations[].biasThemes` to make 2-3 locations genuinely skew toward particular themes — that
  structure is what the hotspot chart should reveal.
- `dataQuality.mergeA`/`mergeB` must be two real location `key`s; pick a pair where merging them
  visibly changes which location looks like the top hotspot.
- Test: the "as recorded" and "true" views should match when the merge toggle is off, and diverge
  clearly (a different top-ranked location) when it's on.
