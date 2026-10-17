# Adding a scenario to S12

Copy `_TEMPLATE/` to `data/<your-id>/`, edit `dataset.js` (match the registration key/`id` to the
folder), register with a `<script src>` in `index.html` and a row in `data/manifest.js`.

- `channels[0]` is the one the fixed setpoint alarm watches — give it realistic units.
- Include at least one **decoy channel** with `rampPerMin: 0` — a channel that never moves during
  the leak, to show the multivariate detector isn't just re-implementing a single-sensor alarm.
- Pick `rampPerMin` values so that at `leakRate: 1`, the primary channel crosses a sensible
  `setpoint.default` roughly 40–80 minutes after `leakStart.default`, inside the `minutes` window.
- Test: at `leakRate: 0` (no leak) the anomaly detector should not fire; increasing sensitivity
  should never fire earlier than the true leak start; the lead time should be positive at the
  default settings.
