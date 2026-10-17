# S13 — Heat-stress & fatigue wearable

**Course:** Integrating AI in Workplace Safety Practices · **Slot:** Day 3 · Topic 3
**Run time:** 10–15 min.

## What it teaches

> A wearable's predictive heat-strain alert is deliberately set below true symptom onset — that gap
> is the point, a rest break before anyone feels unwell. But it is only as good as the sensor: a
> medication-affected heart-rate reading can delay or suppress the alert while the real core
> temperature keeps climbing, unseen. The fatigue side shows a simplified but real circadian +
> hours-awake + consecutive-nights model — explicitly not a validated tool, a discussion prompt.

## How to run it

Open `index.html`. No server, no model. Thresholds and coefficients are authored; the core-temp
curve, both crossing times, the lead time, and the fatigue curve are computed live.

## Controls

Ambient temperature, humidity, workload, a medication toggle; hours awake, shift start hour,
consecutive night shifts.

## Suggested walkthrough

1. Defaults: read the lead-time tile — the wearable typically warns tens of minutes before symptom onset.
2. Toggle the medication flag — watch the wearable's alert delay or disappear while the true-temperature
   line and its symptom crossing don't move.
3. Push workload/ambient temperature up — watch both lines steepen.
4. On the fatigue chart, drag consecutive nights and shift-start hour — watch the risk band climb
   fastest in the pre-dawn hours of a later shift.

## Scenarios

`warehouse-summer-shift`, `steel-plant-night-shift`. Add more via `data/_TEMPLATE/`.

## Honesty rules baked in

No model runs; both curves and every crossing time are real; the fatigue model is explicitly
labelled illustrative, not validated; population fatigue statistics are flagged as population
averages; wearable data is named as a surveillance concern, not only a safety one.
