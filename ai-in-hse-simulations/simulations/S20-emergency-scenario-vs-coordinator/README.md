# S20 — Emergency: scenario generator vs live coordinator

**Course slot:** Day 4 — Emergency Preparedness & Response. **Type:** interactive teaching simulation, static HTML/CSS/JS, no build step, no server, no AI model runs.

## What it teaches

AI-assisted tooling has a very different job before an emergency than during one — this simulation puts both
in the same page so the contrast is unavoidable.

- **BEFORE — drill scenario generator.** A seeded template generator rolls a randomised drill brief from five
  authored option lists (hazard, location, complicating factor, casualty premise, weather). This is genuinely
  useful: a handful of option lists produce thousands of distinct briefs, far more variety than a training
  calendar built from a few hand-written scenarios.
- **DURING — live incident timeline.** A scripted, timestamped raw-feed plays via Play/Step/Reset transport.
  Alongside it, an "AI summary panel" shows sparser, periodic summary checkpoints. The gap between the two —
  events behind, minutes behind, or an outright wrong claim — is computed live from wherever you are in the
  playback, not narrated in the page copy.

**The headline demonstration:** in `tank-fire-drill`, the summary panel doesn't refresh across the single most
urgent event in the timeline (a missing-contractor report) until after it's already resolved. In
`confined-space-rescue-drill`, the summary panel states an outright wrong casualty count for four minutes
before self-correcting. Two different failure modes — lag and error — same lesson: the raw feed is the primary
channel, always.

## Files

```
S20-emergency-scenario-vs-coordinator/
├── index.html                              scenario picker, generator panel, timeline + summary panel
├── app.js                                   seeded generator + timeline/gap engine + transport + rendering
├── styles.css                                shared design tokens (light/dark)
├── data/
│   ├── manifest.js
│   ├── tank-fire-drill/dataset.js                   lag failure mode
│   ├── confined-space-rescue-drill/dataset.js       error failure mode
│   └── _TEMPLATE/                             copy this to add a scenario
└── README.md                                  this file
```

## The maths (all real, computed live)

- **Generator:** `mulberry32` PRNG seeded from `(scenario id, re-seed counter)` picks one option from each of
  five authored lists. Distinct combinations = product of the five list lengths (e.g. tank-fire-drill:
  5×5×5×5×5 = 3,125).
- **Active checkpoint:** the last summary checkpoint with `afterEventIndex <= currentEventIndex`.
- **Gap:** `eventsBehind = currentEventIndex − checkpoint.afterEventIndex`; `minutesBehind =` the current
  event's timestamp minus the checkpoint-covered event's timestamp. Recomputed on every step/play tick.
- **Hand-check (tank-fire-drill):** at event index 5 (t=11min, "muster count short by one"), the active
  checkpoint still covers only up to event index 4 (t=8min) — `eventsBehind = 1`, `minutesBehind = 3`. The
  next checkpoint doesn't arrive until event index 6 (t=14min), by which point the missing contractor has
  already been found.

## What's authored vs computed live

- **Authored (by a competent person, in the dataset):** the five generator option lists, the raw-feed
  timeline, and the summary checkpoints (including which are accurate).
- **Computed live, in your browser, from your inputs:** which combination the generator rolls, the
  combinatorics count, and the events/minutes-behind gap (or wrong-claim flag) at every playback position.

## Adding a scenario

See `data/_TEMPLATE/README.md`. In short: 5 generator lists, 8-9 timeline events with one urgent moment, and
3-4 sparser checkpoints designed so at least one gap spans across that urgent moment.

## Verification

`node --check` passes on `app.js`. A jsdom smoke test (not shipped in this folder) exercises: default render,
the hand-verified gap at the tank-fire-drill's urgent event, the wrong-claim flag on the confined-space
scenario, play/step/reset transport advancing and stopping correctly, re-seed changing the generated brief,
scenario switching, theme toggle, and zero console errors.
