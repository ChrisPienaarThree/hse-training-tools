# Adding a scenario to S23

Copy `_TEMPLATE/` to `data/<your-id>/`, edit `dataset.js` (match the registration key/`id` to the
folder), register with a `<script src>` in `index.html` and a row in `data/manifest.js`.

- Keep the `dimensions` array **identical** across every scenario in this sim — five fixed keys
  (`dataQuality`, `governance`, `humanInLoop`, `successMetric`, `validationPlan`), each with a
  generic `phase` roadmap instruction that does not mention any specific use case. `app.js` reads
  these by key and renders the `phase` text verbatim; only copy this array, don't reword it,
  unless you are deliberately changing the shared roadmap text for every scenario at once.
- List 3-5 `useCases`, each with a `baseline` object giving all 5 dimension keys a 0-100 starting
  score and a one-line `note` explaining that use case's typical weak spot. **Spread the baseline
  scores out** — a use case that's uniformly strong or weak on all five dimensions defeats the
  point of a roadmap that reorders around whichever one is weakest.
- `bands` is a list of `{ max, label, detail }` in ascending `max` order — app.js picks the first
  band whose `max` exceeds the live overall score (mean of the 5 dimensions). Keep thresholds
  consistent with other scenarios unless you have a specific reason to diverge, since the two
  scenarios are meant to be comparable.
- `callouts` (scale/reorders/notOmniscient/stillMisses/humanCall) and `notes` (what/math/real) are
  shown in the UI's callout panel and facilitator-notes drawer respectively — `reorders` and the
  `math`/`real` notes describe the shared mechanism and can usually be copied near-verbatim; the
  rest should be scenario-specific.
- Nothing about the overall score, band, or roadmap order should be authored per use case — that's
  all computed live in `app.js` from whatever the five sliders currently hold. Test by hand: set
  one use case's sliders so its lowest score is, say, `humanInLoop`, and confirm the roadmap's
  Phase 1 card is the human-in-the-loop phase text.
