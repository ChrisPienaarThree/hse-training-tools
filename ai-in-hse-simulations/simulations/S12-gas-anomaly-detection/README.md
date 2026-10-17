# S12 — Gas-detection anomaly detection

**Course:** Integrating AI in Workplace Safety Practices · **Slot:** Day 3 · Topic 3 (also Day 1 T2b, Day 2 T5)
**Run time:** 10–15 min.

## What it teaches

> A multivariate anomaly detector doesn't wait for one sensor to breach its fixed limit — it asks
> whether the whole pattern still looks like normal operation, and it can flag a developing leak
> while the alarmed channel is still well under its hardware setpoint. It needs no failure labels,
> only a clean baseline of "normal" — but the score is only as good as that baseline, and it changes
> nothing about the fixed alarm, which still has to trip.

## How to run it

Open `index.html`. No server, no model. Channel baselines/noise/ramp rates are authored; the seeded
traces, baseline statistics, anomaly score, both detectors' first-crossing times and the lead time
are computed live.

## Controls

Leak start & rate, anomaly sensitivity, the fixed setpoint, wind speed/direction (dispersion
sketch — illustrative, not a validated model), re-seed.

## Suggested walkthrough

1. Defaults: read the lead time tile — the anomaly detector usually fires well before the setpoint.
2. Set leak rate to 0 — confirm the anomaly detector stays quiet on genuinely normal operation.
3. Push sensitivity to its loosest setting — watch false triggers appear near the baseline window edge.
4. Point at the decoy channel on the chart — it never moves, yet the detector still uses it.

## Scenarios

`compressor-house` (gas/pressure/temperature), `tank-farm` (vapour/level/background). Add more via `data/_TEMPLATE/`.

## Honesty rules baked in

No model runs; every trace and score is real and seeded; the dispersion sketch is explicitly
labelled illustrative; the demo never claims to replace the fixed hardware alarm.
