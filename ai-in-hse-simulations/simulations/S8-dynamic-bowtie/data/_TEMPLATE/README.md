# Adding a scenario to S8

Each scenario is one folder under `data/`. Copy `_TEMPLATE/` and fill in `dataset.js`.

## Steps

1. **Copy the folder**
   ```
   cp -R data/_TEMPLATE data/my-scenario-id
   ```

2. **Edit `data/my-scenario-id/dataset.js`**
   - Change the registration key and `id` from `"TEMPLATE-ID"` to `"my-scenario-id"` (must match the folder).
   - Pick a top event and one worst-credible `consequence` with a `severity` 1–5.
   - Write 2–3 `threats` with a rough frequency in events/year.
   - Write exactly 3 `prevention` and 3 `mitigation` barriers (the diagram is laid out for that count).
     Give each a `nominalPFD` (0–1), a `degradedMult`, an `overdueGrowthPerWk`.
   - Pick **one** genuinely plausible common-cause pair (`commonCauseWith`) — a shared power supply,
     logic solver, or the same person doing two jobs — and explain it in `commonCauseNote`.
   - Fill `digitalTwin`, `callouts` and `notes`.

3. **Register it** — a `<script src>` line in `index.html` (after `manifest.js`, before `app.js`)
   and a `{ id, label }` row in `data/manifest.js`.

4. **Test** — open `index.html`, pick the scenario, and check:
   - the default (all healthy, 0 weeks) return period is very long and the ratio reads 1.0×;
   - bypassing one barrier moves the ratio a little; bypassing two or three moves it a lot;
   - dragging "weeks since review" up ages every barrier set to Overdue and slowly grows the ratio;
   - the two common-cause barriers are tagged and the note explains why multiplying their PFDs is optimistic;
   - the risk-matrix dot for LIVE can end up in a different cell from STATIC once enough barriers degrade.

## Picking PFD values

Nominal PFDs in the 0.02–0.3 range read well: three of them multiplied together already gives a
small number, and losing even one barrier (PFD → 1.0 on bypass) produces a dramatic, visible jump —
which is the real lesson of defence-in-depth. Don't be afraid of the return period being enormous
at the "as designed" baseline; that is what good layered protection looks like. The demo's job is
to show how fast that number collapses when barriers are removed one at a time.

## The maths app.js runs (on your authored parameters)

```
pfd(barrier, status, weeks):
  healthy  -> nominalPFD
  degraded -> min(1, nominalPFD × degradedMult)
  overdue  -> min(1, nominalPFD × (1 + overdueGrowthPerWk × weeks))
  bypassed -> 1.0

topEventFreq    = Σ threats[i].freqPerYr  ×  Π pfd(prevention[j])
consequenceFreq = topEventFreq × Π pfd(mitigation[k])
returnPeriod    = 1 / consequenceFreq                      (years)

staticFreq      = same formula with every barrier "healthy" and weeks = 0
ratio           = consequenceFreq / staticFreq

likelihoodBand(freq): <1e-6 Rare · <1e-4 Unlikely · <1e-2 Possible · <1 Likely · else Frequent
matrix cell     = [likelihoodBand, severity]
```
