# Adding a scenario to S6

Each scenario is one folder under `data/`. Copy `_TEMPLATE/` and fill in `dataset.js`.

## Steps

1. **Copy the folder**
   ```
   cp -R data/_TEMPLATE data/my-scenario-id
   ```

2. **Edit `data/my-scenario-id/dataset.js`**
   - Change the registration key and `id` from `"TEMPLATE-ID"` to `"my-scenario-id"` (must match the folder).
   - Set the `inputs` ranges and defaults for the task (a floor lift starts near `Vorigin_cm: 15`,
     an overhead task near `Vorigin_cm: 165`).
   - Use `postureBias` to shape the scenario's posture — additive **degrees** on each derived angle
     (e.g. `trunk: 8` for a stooped task, `shoulder: 10` for constant overhead reach).
   - Keep the REBA and NIOSH tables as they are (standard rubrics) unless you are deliberately
     modelling a different scheme.
   - Write the six `limitations` and the five `notes`.

3. **Register it** — a `<script src>` line in `index.html` (after `manifest.js`, before `app.js`)
   and a `{ id, label }` row in `data/manifest.js`.

4. **Test** — open `index.html`, pick the scenario, and check:
   - the skeleton pose looks plausible for the task at the default sliders;
   - lowering `Vorigin_cm` raises trunk and knee flexion and the REBA score;
   - raising `load_kg` past 10 kg adds the REBA force point and pushes the NIOSH lifting index up;
   - the camera-view toggle (front-on / oblique) widens the joint-angle uncertainty band;
   - the REBA worksheet adds up by hand and the NIOSH multipliers match the equation.

## What app.js computes (live, from the sliders)

**Joint angles** — a simple biomechanical proxy standing in for the pose-estimation output:
lower origin → more trunk + knee flexion; longer reach → more trunk flexion + shoulder elevation;
higher origin → shoulder elevation and neck extension; plus your `postureBias`.

**REBA**
```
trunk / neck / legs  → banded → Table A[neck][trunk][legs]  + force score (load, shock)  → Score A
upper arm / lower arm / wrist → banded → Table B[ua][la][wr] + coupling score            → Score B
Table C[Score A][Score B]  + activity score (static hold, frequency > 4/min, shock)      → REBA score
REBA score → action level band
```

**NIOSH Lifting Equation**
```
HM = 25 / H            (H in cm; clamp 25–63)
VM = 1 − 0.003·|V−75|  (V in cm; 0 above 175)
DM = 0.82 + 4.5/D      (D = |Vorigin − Vdest|, min 25 cm)
AM = 1 − 0.0032·A      (A = asym_deg; 0 above 135)
FM = fmTable lookup by frequency × duration × (Vorigin < 75)
CM = cmTable[coupling][Vorigin < 75]
RWL = LC(23) · HM · VM · DM · AM · FM · CM
Lifting Index = load_kg / RWL
```

Everything above is real arithmetic on your authored parameters — checkable by hand.
