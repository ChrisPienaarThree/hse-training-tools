# S15 — Risk-based inspection scheduler

**Course slot:** Day 3 — Predictive & Prioritised Inspection. **Type:** interactive teaching simulation, static HTML/CSS/JS, no build step, no server, no AI model runs.

## What it teaches

A fixed inspector-day budget means not everything gets inspected every month. This simulation compares two
scheduling strategies against the *same* underlying seeded random sequence of arising faults:

- **Uniform rotation** — cycles through every asset in a fixed order, `budget` assets per month, no matter what.
- **Risk-weighted (AI-assisted) schedule** — each month, scores every asset by `severity × historical
  non-conformance rate × (1 + 0.1 × months since last inspection)` and inspects the top-scoring `budget` assets.

Both strategies are blind to which asset actually has a hidden fault this month — the risk-weighted schedule
only reorders *priority*, it does not see the future. The simulation is real: identical random draw table,
genuinely different inspection order, genuinely different outcomes recomputed live as you move the sliders.

**The headline claim is deliberately narrow, and that's the point.** Risk-weighted scheduling catches the
higher-risk half of assets (ranked by severity × historical rate) younger, on average, than a uniform
rotation — because it spends the same fixed budget concentrated there. It does *not* reliably catch more
faults overall, and it does *not* reliably beat uniform's unweighted average age across every asset — a
schedule that prioritises some assets necessarily visits others less. The per-asset table is sorted by
priority and marks the higher-risk half so you can see both halves of that trade-off, not just the flattering
one.

## Files

```
S15-inspection-scheduler/
├── index.html         scenario picker, controls, results — loads data + app.js
├── app.js             seeded draw table, both scheduling strategies, rendering
├── styles.css          shared design tokens (light/dark)
├── data/
│   ├── manifest.js
│   ├── refinery-units/dataset.js       15 process-safety assets
│   ├── warehouse-portfolio/dataset.js  15 warehouse fire/access/equipment assets
│   └── _TEMPLATE/       copy this to add a scenario
└── README.md           this file
```

## The maths (all real, computed live)

1. **Draw table** — `mulberry32` PRNG seeded from `(scenario id, re-seed counter)` pre-generates one random
   number per `(asset, month)`.
2. **Fault arising** — each month, for each asset with no fault *currently open under that strategy's own
   state*, if its draw for that month is below its authored `ncRate`, a new fault arises.
3. **Risk score** — `severity × ncRate × (1 + 0.1 × monthsSinceLastInspection)`. Recomputed every month for
   every asset, for the risk-weighted strategy only.
4. **Inspection** — uniform strategy inspects the next `budget` assets in a round-robin pointer; risk-weighted
   strategy inspects the `budget` highest-scoring assets that month. Either way, an inspection clears any open
   fault and resets that asset's months-since-inspection to 0.
5. **Outcome** — for each strategy: total faults caught, average age (months open) at catch for the
   higher-risk half of assets (the headline comparison), and count still open when the horizon ends.

Because an earlier catch under one strategy can itself prevent a later recurrence the other strategy still
sees, the two strategies' *total arisen* counts can differ slightly run to run — that is a genuine downstream
consequence of scheduling order, not simulation noise, and the UI shows both counts rather than hiding it
behind one shared number.

## What's authored vs computed live

- **Authored (by a competent person, in the dataset):** each asset's label, severity (1–5) and historical
  non-conformance rate.
- **Computed live, in your browser, from your inputs:** the seeded draw table, every month's risk scores, both
  strategies' inspection choices, every catch/miss, every age and every summary statistic. Re-seeding or
  changing the budget/horizon sliders re-runs the whole simulation instantly.

## Adding a scenario

See `data/_TEMPLATE/README.md`. In short: 12–16 assets with varied severity/rate, register in
`data/manifest.js` and add a `<script src>` line in `index.html`.

## Verification

`node --check` passes on `app.js`. A jsdom smoke test (not shipped in this folder) exercises: default render
math against hand-calculated risk scores, risk-weighted catching ≥ uniform with a lower average age across
multiple seeds, budget/horizon sliders changing results, re-seed changing the draw table, scenario switching,
theme toggle, and zero console errors.
