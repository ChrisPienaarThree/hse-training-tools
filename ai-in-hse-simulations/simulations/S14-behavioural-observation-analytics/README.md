# S14 — Behavioural-safety observation analytics

**Course:** Integrating AI in Workplace Safety Practices · **Slot:** Day 2 · Topic 1 (also Day 3 T1)
**Run time:** 10 min.

## What it teaches

> Clustering hundreds of observation cards by theme and location at once is real pattern-matching at
> scale — the location/theme structure here is genuinely uneven, not manufactured from noise. But
> flip the "poor form-filling" toggle and a location that was middling on its own becomes the top
> hotspot the instant a second location's cards get bucketed under its name. Nothing about the
> underlying hazards changed. Volume is not judgement, and a rising trend line needs context before
> it means "rising risk."

## How to run it

Open `index.html`. No server, no model. Vocabulary/weights/bias/merge pair are authored; the seeded
sampling of every observation and every chart are computed live.

## Controls

Sample size, the merge (data-quality) toggle, re-seed.

## Suggested walkthrough

1. Read the "by location" chart — the true and as-recorded bars match.
2. Flip the merge toggle — watch one bar balloon and the top-location line disagree.
3. Push the sample size up and down — the pattern gets clearer with more data, exactly like a real
   observation programme maturing.

## Scenarios

`manufacturing-site`, `logistics-hub`. Add more via `data/_TEMPLATE/`.

## Honesty rules baked in

No model runs; every count is a real seeded draw; the manufactured-hotspot effect is shown side by
side with the true split, not asserted; the trend chart is explicitly flagged as ambiguous on its own.
