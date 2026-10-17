# Adding a scenario to S16

Copy `_TEMPLATE/` to `data/<your-id>/`, edit `dataset.js` (match the registration key/`id` to the
folder), register with a `<script src>` in `index.html` and a row in `data/manifest.js`.

- Keep the 4 component keys exactly as `incident`, `capa`, `survey`, `nearMiss` — `app.js` reads
  them by name. Each is already a normalised 0-100 score where higher is better.
- List 5-6 `sites`, each with a `scores` object (all 4 keys) and a `raw` object giving a
  human-readable original value per component (for realism, not used in the maths).
- **Design at least one deliberate pair** where one site is strong on the two lagging components
  and weak on the two leading ones, and another site the reverse. Hand-check with the default
  `lagging-first`/`leading-first` presets (weights `{40,30,15,15}` and `{15,15,35,35}`) that the
  #1-ranked site actually flips between the pair — that flip is the whole teaching point.
- Test: `composite = Σ(weight_i × score_i) / Σ(weight_i)` for a couple of sites under a couple of
  presets, by hand, and confirm the app's ranking matches.
