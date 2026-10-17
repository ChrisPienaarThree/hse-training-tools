# Adding a scenario to S19

Copy `_TEMPLATE/` to `data/<your-id>/`, edit `dataset.js` (match the registration key/`id` to the
folder), register with a `<script src>` in `index.html` and a row in `data/manifest.js`.

- 5-6 `sourceNotes` — the only facts any draft is allowed to use.
- `scoring` keyword lists per dimension (specific/grounded/format/constraints) — write your 4
  preset prompts FIRST, then pick keywords that actually appear in the better prompts and not the
  vague one. Hand-check the resulting score for each preset.
- Exactly 4 `presets`, increasing in quality, each with a `draft.text` and a `draft.claims` array.
  Tag every factual claim `grounded: true` (traceable to a source note) or `grounded: false`
  (fabricated/embellished/contradicts a note). The low-scoring presets should have fabricated
  claims; the top preset should have zero.
- Test: hand-compute the checklist score for each of the 4 preset prompts against your keyword
  lists and confirm the scores rise in order and the fabricated-claim count falls to zero by
  preset 4.
