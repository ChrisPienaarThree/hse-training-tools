# Adding a scenario to S18

Copy `_TEMPLATE/` to `data/<your-id>/`, edit `dataset.js` (match the registration key/`id` to the
folder), register with a `<script src>` in `index.html` and a row in `data/manifest.js`.

- 4 zones, 5-6 `workTypes` (each with 3-5 `requiredControls`), 3-4 `incompatiblePairs`, 5
  `activePermits` spread across the zones/times.
- `defaultCandidate` **must** deliberately zone/time-overlap at least one active permit and form
  an incompatible pair with it, so the sim shows a real SIMOPs clash the moment it loads, before
  any interaction. Hand-check both the time overlap and the pair membership.
- Test: pick 2-3 candidate permits by hand, work out which active permits they should clash with
  (same zone, overlapping time, incompatible pair) and confirm the app agrees.
