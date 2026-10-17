# S16 — Composite safety culture score

**Course slot:** Day 3 — Aggregated & Composite Safety Metrics. **Type:** interactive teaching simulation, static HTML/CSS/JS, no build step, no server, no AI model runs.

## What it teaches

A "safety culture score" that rolls incident rate, CAPA closure, survey results and near-miss reporting
into one number is convenient — and the weights chosen to combine them are a judgement call that can flip
which site looks best. This simulation makes that judgement visible and interactive:

- Four already-normalised (0-100) component scores per site: two **lagging** (incident rate, CAPA closure
  timeliness) and two **leading** (engagement survey, near-miss reporting rate).
- Four weight sliders, plus **Lagging indicators first**, **Leading indicators first** and **Equal weight**
  presets.
- A live-ranked site table and a per-site drill-down showing exactly how much each component contributed.
- A **Hide weight values** toggle for a blind "guess the weighting" classroom exercise.

**The headline demonstration:** in both scenarios, one site is authored to look strong on lagging
indicators but weak on leading ones, and a paired site the reverse. Switching between the "lagging-first"
and "leading-first" presets **flips which of the two ranks #1** — with the identical underlying data. That
flip is real, computed live, and hand-verifiable (see below).

## Files

```
S16-safety-culture-composite/
├── index.html          scenario picker, weight controls, ranking, drill-down
├── app.js               composite/ranking/contribution maths + rendering
├── styles.css            shared design tokens (light/dark)
├── data/
│   ├── manifest.js
│   ├── manufacturing-network/dataset.js   6 plants
│   ├── construction-portfolio/dataset.js  6 projects
│   └── _TEMPLATE/        copy this to add a scenario
└── README.md             this file
```

## The maths (all real, computed live)

- `composite = Σ(weight_i × score_i) / Σ(weight_i)` across the 4 components, for every site, every time a
  slider moves. Weights don't need to sum to 100 — they're normalised automatically.
- Drill-down contribution per component = `weight_i × score_i / Σ(weight_i)`; the four contributions sum
  exactly to the displayed composite.
- **Hand-check (manufacturing-network, Plant A vs Plant B):** Plant A scores `{92, 88, 45, 30}`, Plant B
  scores `{55, 60, 85, 90}` on `{incident, capa, survey, nearMiss}`. Under "lagging-first" weights
  `{40,30,15,15}`: Plant A = `0.4×92+0.3×88+0.15×45+0.15×30 = 74.45`, Plant B = `66.25` — Plant A leads.
  Under "leading-first" weights `{15,15,35,35}`: Plant A = `53.25`, Plant B = `78.5` — Plant B leads. Same
  data, opposite winner.

## What's authored vs computed live

- **Authored (by a competent person, in the dataset):** each site's four raw/normalised component scores
  and the illustrative "raw value" strings shown in the drill-down.
- **Computed live, in your browser, from your inputs:** every composite score, the full ranking, every
  drill-down contribution, and the normalised weight percentages. Nothing is pre-scripted per preset beyond
  the weight values themselves.

## Adding a scenario

See `data/_TEMPLATE/README.md`. In short: 5-6 sites with the same 4 component keys, and at least one
deliberate "strong-lagging/weak-leading vs weak-lagging/strong-leading" pair whose rank order you've
hand-verified flips between the two default presets.

## Verification

`node --check` passes on `app.js`. A jsdom smoke test (not shipped in this folder) exercises: default
render, the hand-verified composite values above, the preset-driven rank flip on both scenarios, weight
sliders changing the ranking and drill-down live, the hide-weights toggle, drill-down row selection by
clicking a site, scenario switching, theme toggle, and zero console errors.
