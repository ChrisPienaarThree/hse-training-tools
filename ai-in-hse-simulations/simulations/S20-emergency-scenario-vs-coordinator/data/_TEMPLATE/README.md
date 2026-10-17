# Adding a scenario to S20

Copy `_TEMPLATE/` to `data/<your-id>/`, edit `dataset.js` (match the registration key/`id` to the
folder), register with a `<script src>` in `index.html` and a row in `data/manifest.js`.

- `generator`: 5 option lists (4-6 items each) for the BEFORE panel's seeded template generator.
- `timeline.events`: 8-9 timestamped raw-feed entries. Include one clearly urgent event partway
  through that the checkpoints deliberately don't reflect for several minutes.
- `timeline.checkpoints`: 3-4 sparser AI-summary snapshots, each with `afterEventIndex` (the last
  raw event it reflects) and `isAccurate`. Design at least one gap where the checkpoint right
  before your urgent event doesn't get refreshed until well after it — that lag is the whole
  teaching point. Optionally make one checkpoint `isAccurate:false` with a stated wrong fact
  (not just staleness) for the "erred" failure mode instead of (or alongside) the "lagged" one.
- Test: hand-walk the timeline event by event and confirm which checkpoint is active, and the
  events-behind/minutes-behind gap, at 2-3 points — including right after your urgent event.
