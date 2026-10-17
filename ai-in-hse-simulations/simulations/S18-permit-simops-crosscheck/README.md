# S18 — AI-assisted permit-to-work & SIMOPs cross-check

**Course slot:** Day 4 — Permit-to-Work & Simultaneous Operations. **Type:** interactive teaching simulation, static HTML/CSS/JS, no build step, no server, no AI model runs.

## What it teaches

An "AI-assisted" permit cross-check is a rule engine, not a model — and this simulation makes the two rules
it runs completely explicit:

1. **Required controls** — every control on the checklist for the candidate permit's work type must be
   ticked.
2. **SIMOPs clash** — for every already-active permit in the *same zone* whose time window *overlaps* the
   candidate's, is the (candidate work type, active work type) pair listed in the incompatibility matrix?

Both checks are real: a set lookup and a genuine interval-overlap calculation, re-run on every change to the
candidate permit (work type, zone, start/end time, or checklist tick). The default candidate on load already
clashes with one active permit, so the teaching point is visible before anyone touches a control.

## Files

```
S18-permit-simops-crosscheck/
├── index.html                 scenario picker, candidate builder, results, active-permit table
├── app.js                      rule engine (checklist + SIMOPs overlap) + rendering
├── styles.css                   shared design tokens (light/dark)
├── data/
│   ├── manifest.js
│   ├── refinery-turnaround/dataset.js   6 work types, 5 active permits
│   ├── construction-site/dataset.js     6 work types, 5 active permits
│   └── _TEMPLATE/                copy this to add a scenario
└── README.md                     this file
```

## The maths (all real, computed live)

- **Required controls:** `requiredControls.filter(c => !checked.has(c))` — anything left unticked is listed.
- **Time overlap:** `candidate.start < permit.end && candidate.end > permit.start` — a genuine interval
  overlap test, not a same-day approximation.
- **SIMOPs clash:** an active permit clashes only if all three hold — same zone, overlapping time window, and
  `{candidate.workType, permit.workType}` is one of the authored `incompatiblePairs`.
- **Hand-check (refinery-turnaround default):** candidate = hot work, Unit 12 Process Area, 09:00–13:00.
  AP-1 is confined-space entry in the same zone, 08:00–16:00 — the time windows overlap (9<16 and 13>8), and
  `{hot-work, confined-space-entry}` is in the incompatibility matrix. The app should show exactly one clash,
  against AP-1, on load.

## What's authored vs computed live

- **Authored (by a competent person, in the dataset):** work types, their required controls, the SIMOPs
  incompatibility matrix, the zones, and the five active permits.
- **Computed live, in your browser, from your inputs:** every checklist-completeness check and every SIMOPs
  clash — recomputed the instant the candidate permit changes.

## Adding a scenario

See `data/_TEMPLATE/README.md`. In short: 5-6 work types with required controls, 3-4 incompatible pairs, 5
active permits, and a `defaultCandidate` you've hand-verified clashes with at least one of them.

## Verification

`node --check` passes on `app.js`. A jsdom smoke test (not shipped in this folder) exercises: default render
shows the hand-verified default clash, ticking every required control clears the controls-fail banner,
changing zone/time clears or creates SIMOPs clashes correctly against the active-permit table, work-type
switch resets the checklist, scenario switching, theme toggle, and zero console errors.
