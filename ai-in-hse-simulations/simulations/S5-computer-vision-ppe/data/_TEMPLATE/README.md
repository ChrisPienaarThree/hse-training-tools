# Adding a scenario to S5

Each scenario is one folder under `data/`. Copy `_TEMPLATE/` and fill in `dataset.js`.

## Steps

1. **Copy the folder**
   ```
   cp -R data/_TEMPLATE data/my-scenario-id
   ```

2. **Edit `data/my-scenario-id/dataset.js`**
   - Change the registration key and `id` from `"TEMPLATE-ID"` to `"my-scenario-id"` (must match the folder).
   - Keep the seven detector `key`s (`hard_hat`, `hi_vis_vest`, `gloves`, `harness_at_height`,
     `restricted_zone`, `forklift_proximity`, `spill`) — the scene renderer and the `gt` bindings use them.
   - Set each detector's ideal `baseTPR` / `baseFPR` / `confMean` / `confSd`. Make the safety-critical
     ones (harness, proximity) *harder* than the easy ones (hard hat) — that inversion is a teaching point.
   - Script the scene: `motion` entries (linear `from`→`to` over `[f0,f1]`), static `shapes`, and
     `flags` as lists of inclusive `[f0,f1]` frame windows.
   - Bind ground truth in `gt`: which flags make each detector's ground truth positive, and where its
     box is drawn (`anchor`).
   - Write the three `callouts` and the five `notes`.

3. **Register it** — a `<script src>` line in `index.html` (after `manifest.js`, before `app.js`)
   and a `{ id, label }` row in `data/manifest.js`.

4. **Test** — open `index.html`, pick the scenario, press play, and check:
   - detections appear near the right worker / zone / spill and jitter with motion blur;
   - dragging *lighting* / *weather* up visibly raises the false-alarm count and drops recall;
   - the supervisor-trust meter falls as false alarms accrue, and a real serious alert eventually
     shows "MISSED — dismissed while fatigued";
   - raising the confidence threshold cuts false alarms *and* recall together;
   - "deployed elsewhere" degrades every metric.

## The maths app.js runs (on your authored parameters)

Per frame `f`, per active detector `d`, with a seeded RNG keyed by `(seed, f, d.key)`:

```
effTPR  = clamp(d.baseTPR × Π_k (1 + conditions[k].tpr × slider[k]) × [siteMismatch.tpr], 0.03, 0.99)
effFPR  = clamp(d.baseFPR × Π_k (1 + conditions[k].fpr × slider[k]) × [siteMismatch.fpr], 0.001, 0.85)
effConf = d.confMean + Σ_k (conditions[k].conf × slider[k]) + [siteMismatch.conf]

if groundTruth(d, f):  with prob effTPR emit a detection (else it's a miss)
always:                with prob effFPR emit a false detection
keep a detection iff its sampled confidence ≥ threshold slider
tally TP / FP / FN / TN ; a kept detection → an alert
```

Alert-fatigue pass over alerts in frame order: trust starts at 1.0; each **false** alarm subtracts
`fatigue.falsePenalty`; each attended **true** alarm adds `fatigue.trueRecover`; every frame adds
`fatigue.passiveRecover`. Below `fatigue.fatigueBelow` the supervisor auto-dismisses; a dismissed
**true** alarm on a `seriousDetectors` detector is counted as a **missed hazard**. Trust recovers
above `fatigue.recoverAbove`.

Everything on the page — the confusion matrix, precision / recall / false-alarm rate / F1, the
trust curve, the missed-hazard count — is computed from these outcomes. Only the parameters are authored.
