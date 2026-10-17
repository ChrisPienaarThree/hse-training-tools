# Adding a scenario to S13

Copy `_TEMPLATE/` to `data/<your-id>/`, edit `dataset.js` (match the registration key/`id` to the
folder), register with a `<script src>` in `index.html` and a row in `data/manifest.js`.

- Pick `heat.ambientTemp`/`humidity`/`workload` defaults so the true core-temperature curve crosses
  `symptomThreshold` (38.5°C) comfortably within `shiftMinutes` — if it never crosses, the lead-time
  tile has nothing to show. `heatCoef: 0.45` with a hot/strenuous default combination usually works.
- `fatigue.shiftStartHour` + `hoursAwake` + `consecutiveNights` drive a shared, generic fatigue
  formula (see the comment at the top of `_TEMPLATE/dataset.js`) — no per-scenario maths to write,
  just realistic defaults for the shift pattern you're describing.
- Test: toggling the medication flag should visibly delay or suppress the wearable's warning while
  the true-temperature line and the symptom crossing stay unchanged.
