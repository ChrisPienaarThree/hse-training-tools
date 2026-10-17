# Adding a scenario to S22

Each scenario is one folder under `data/`. Unlike most simulations in this suite, S22's *maths*
is generic and lives once in `app.js` — a scenario only supplies **framing**: what a case is,
what the two classes mean, and sensible defaults.

## Steps

1. **Copy the folder**
   ```
   cp -R data/_TEMPLATE data/my-scenario-id
   ```

2. **Edit `data/my-scenario-id/dataset.js`**
   - Change the registration key and `id` from `"TEMPLATE-ID"` to `"my-scenario-id"` (must match the folder).
   - Write `posLabel` / `negLabel` / `eventNoun` / `context` so every metric on the page reads as
     a sentence about THIS use case, not abstract statistics.
   - Pick `defaults.prevalencePct` (how common the real event actually is) and
     `defaults.separation` (the gap between the two score means; both distributions have sd 0.15,
     so `separation / 0.15` is roughly the effect size — 0.15 is heavy overlap / a weak model, 0.45
     gives ~93% recall at a 7% false-alarm rate / a solid detector, 0.75+ is close to perfect) to
     match how good a detector of this kind realistically is — don't be generous; the demo is more
     useful when the starting point is realistic. The slider itself runs 0.1–0.9.
   - Write `alwaysNegativeNote` — a concrete sentence describing what "never flag anything" would
     look like operationally for this use case (this powers the accuracy-paradox comparison).
   - Fill the five `callouts` and four `notes`, tying `tieback` to earlier simulations that share
     this scenario's framing if any do.

3. **Register it** — a `<script src>` line in `index.html` (after `manifest.js`, before `app.js`)
   and a `{ id, label }` row in `data/manifest.js`.

4. **Test** — open `index.html`, pick the scenario, and check:
   - the default confusion matrix and metrics look sensible for the stated prevalence/separation;
   - dragging the threshold trades precision against recall in the expected direction;
   - dragging "model discriminative power" down visibly lowers the ROC curve and the achievable AUC;
   - the "always negative" comparison shows high accuracy / zero recall at low prevalence;
   - advancing "weeks since deployment" degrades the metrics at the fixed threshold, and
     "Recalibrate" moves the threshold back toward the best trade-off on the drifted population.

## What's generic vs what you author

The population generation, confusion matrix, every metric, the ROC sweep and AUC, the "always
negative" baseline, and the recalibration search are **one implementation in `app.js`**, shared by
every scenario. You are only authoring the words around it and the starting numbers. If you find
yourself wanting different *maths* for a scenario (a different score distribution shape, a
different drift model), that's a sign it should be a new capability in `app.js`, not a per-scenario
override — keep the contract simple.
