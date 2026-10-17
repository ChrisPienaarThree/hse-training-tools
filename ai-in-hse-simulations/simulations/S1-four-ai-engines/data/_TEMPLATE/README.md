# Adding a scenario to S1

Each scenario is one folder under `data/`. The folder **is** the dataset — copy this
`_TEMPLATE/` folder and fill it in.

## Steps

1. **Copy the folder**
   ```
   cp -R data/_TEMPLATE data/my-scenario-id
   ```
   Use a short kebab-case id (`crane-lift`, `lockout-bypass`, `line-break`…).

2. **Edit `data/my-scenario-id/dataset.js`**
   - Change the registration key and `id` from `"TEMPLATE-ID"` to `"my-scenario-id"` (they must match the folder name).
   - Fill in every `TODO`. Keep the object shape exactly — `app.js` reads these keys by name.
   - `conditions[0]`, `states[0]`, `outputs[0]` are the "best case / as-shipped" state.
     Later entries get progressively worse, or add a planted defect the reviewer should catch.
   - Tag any figure from the literature as `(independent)` or `(vendor-reported)`.

3. **Replace `data/my-scenario-id/scene.svg`**
   - Keep `viewBox="0 0 400 300"`. Flat shapes only. It is an illustration, not a photo — label it as such.
   - Bounding boxes in `dataset.js` are `[x%, y%, width%, height%]` over this image.

4. **Register it** — two one-line edits:
   - `index.html`: add `<script src="data/my-scenario-id/dataset.js"></script>` in the data block
     (after `manifest.js`, before `app.js`).
   - `data/manifest.js`: add `{ id: "my-scenario-id", label: "Short label for the picker" }`
     in the position you want it in the dropdown.

5. **Test** — open `index.html`, pick your scenario, exercise every slider and toggle in all four panels.

## The dataset contract (what each key must contain)

| key | type | notes |
|---|---|---|
| `id`, `label` | string | `id` matches folder + registration key |
| `situation.headline` | string | one sentence: what nearly happened |
| `situation.facts[]` | string[] | 4–6 bullets, the shared facts |
| `vision.conditions[]` | array | each: `name`, `detections[]` (`label`, `conf`, `box[4]`, optional `alert`/`falsePositive`), `matrix{tp,fp,fn,tn}`, `alertFatigueNote` |
| `vision.validation` | object | `method`, `independentNote`, `humanRole` |
| `vision.failure` | string | one line |
| `predictive.features[]` | array | `name`, `value` (string), `contribution` (log-odds weight, +/-) |
| `predictive.states[]` | array | `name`, `probability` (0–1), `band`, `note` |
| `predictive.validation` / `.failure` | as vision |
| `nlp.narratives` | object | `clean` and `poor` — the SAME incident written two ways |
| `nlp.codes[]` | array | `field`, `clean{value,conf}`, `poor{value,conf, optional miscode:true}` |
| `nlp.contributingTags[]` | string[] | shown as chips |
| `nlp.lowConfidenceThreshold` | number | rows below this are flagged "route to a human" |
| `nlp.validation` / `.failure` | as vision |
| `generative.prompt` | string | include a "do not cite rules I didn't give you" instruction |
| `generative.outputs[]` | array | `temperature` label, `body[]` (one string per paragraph), `issues[]` (`text` = exact substring of a body paragraph, `tag`, `why`) |
| `generative.hallucinationRate` | string | the 3–5% / 27% framing |
| `generative.reviewChecklist[]` | string[] | 3–5 items; all must be ticked to enable sign-off |
| `generative.validation` / `.failure` | as vision |
| `synthesis.rows[]` | array | 6 rows of 5 cells: `[rowLabel, vision, predictive, nlp, generative]` |
