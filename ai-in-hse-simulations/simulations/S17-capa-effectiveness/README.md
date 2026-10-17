# S17 — CAPA effectiveness tracker

**Course slot:** Day 3 — Corrective Action Effectiveness. **Type:** interactive teaching simulation, static HTML/CSS/JS, no build step, no server, no AI model runs.

## What it teaches

An "AI-assisted" CAPA tracker doesn't need to be a model at all to be useful — it needs to apply the same
two rules to every corrective action in the register, every time, at a volume no one checks by hand:

1. **Overdue** — the action is still open and its due date (plus an adjustable grace period) has passed.
2. **Closed but ineffective** — the action is closed, but a similar problem recurred within an adjustable
   window of the closure date.

Both rules run on real dates with real `Date` arithmetic — nothing is a lookup table or a scripted
outcome. Two sliders (grace period, recurrence window) let you see how much the flagged counts depend on
where those thresholds are drawn.

## Files

```
S17-capa-effectiveness/
├── index.html            scenario picker, controls, tiles, register table
├── app.js                 date-arithmetic rules + rendering
├── styles.css              shared design tokens (light/dark)
├── data/
│   ├── manifest.js
│   ├── manufacturing-site/dataset.js    10 CAPAs
│   ├── process-safety-site/dataset.js   10 CAPAs
│   └── _TEMPLATE/          copy this to add a scenario
└── README.md               this file
```

## The maths (all real, computed live)

- `daysBetween(a, b)` — exact day count between two ISO dates, via `Date`.
- **Overdue:** `status === "open" AND (referenceDate − dueDate) > graceDays`.
- **Ineffective:** `status === "closed" AND` some recurrence date falls within `recurrenceWindowDays` of
  `closedDate`.
- **Hand-check (manufacturing-site, CAPA-104):** closed 2026-03-10, recurrence 2026-06-01 — 83 days later.
  At the default 90-day window it's flagged ineffective; drag the window slider below 83 (e.g. to 60) and
  it flips to effective. Same underlying dates, different conclusion — the window is a real, adjustable
  parameter, not a fixed truth.

## What's authored vs computed live

- **Authored (by a competent person, in the dataset):** each CAPA's description, source, raised/due/closed
  dates and any recurrence dates.
- **Computed live, in your browser, from your inputs:** every days-open, days-overdue and days-to-recurrence
  calculation, every overdue/ineffective flag, and both summary tiles — recomputed on every slider move.

## Adding a scenario

See `data/_TEMPLATE/README.md`. In short: 10-12 CAPAs with a realistic spread of statuses, including one
recurrence that's deliberately window-sensitive (75-89 days after closure) so the slider has something to
visibly flip.

## Verification

`node --check` passes on `app.js`. A jsdom smoke test (not shipped in this folder) exercises: default
render, the hand-verified CAPA-104 window-sensitivity flip, overdue-grace slider changing the overdue
count, tile counts matching a manual tally of the register, scenario switching, theme toggle, and zero
console errors.
