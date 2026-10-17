# S6 — Pose estimation → ergonomic lifting risk

**Course:** Integrating AI in Workplace Safety Practices
**Slot:** Day 2 · Topic 4 (computer vision / pose estimation for ergonomic & MSD risk)
**Run time:** 10–15 min facilitator-led, or leave open to explore.

---

## What it teaches

> Pose estimation is a computer-vision model: opaque, and only as good as the camera view. What it
> feeds is a **transparent** rubric — REBA and the NIOSH Lifting Equation — where every step of the
> score is written down and checkable by hand. The value is throughput: a human assessor scores a
> handful of tasks a day; this scores every lift. So it is a **triage tool** — it tells the
> ergonomist where to go, not what the finding is. And it measures **posture, not force**; a
> **snapshot, not a shift's dose**; a **generic body, not this worker**.

---

## How to run it

- **Open `index.html` in a browser.** No server, no internet, no install.
- No pose model runs. The input ranges and the REBA / NIOSH tables are pre-authored standard
  rubrics. The joint-angle derivation, every band lookup, the REBA score and the NIOSH lifting
  index are computed live from the sliders — same honesty stance as S2/S4/S5.

---

## Controls

| Control | Effect |
|---|---|
| **Load, hand heights, reach, twist, frequency, duration, coupling** | drive both the derived posture and the two scores |
| **Jerky / shock loading** | +1 REBA force score and +1 activity score |
| **Static hold > 1 min** | +1 REBA activity score |
| **Camera: front-on / oblique** + **occlusion** | widen the joint-angle uncertainty band (the dashed "ghost" figures) and show the REBA score as a *range* |

---

## Suggested walkthrough

1. **Default sliders.** Read the skeleton and the angle chips. Open the REBA worksheet on the right
   — walk it top to bottom: each angle → a segment score → Table A / Table B → Table C → + activity
   → the number. *Nothing is hidden here.*
2. **Drag "hand height at origin" down to floor level.** Trunk and knee flexion jump, the REBA
   score climbs into "High", and the NIOSH vertical multiplier (VM) drops. Two rubrics, same cause.
3. **Raise the load past 10 kg.** The REBA force score ticks up; the NIOSH lifting index crosses
   1.0. Push it to 20 kg from the floor — the lifting index goes well past 3.
4. **Add twist (asymmetry).** REBA trunk gets its +1; NIOSH AM falls. Small posture change, real
   score change.
5. **Switch the camera to "Oblique" and tick occlusion.** The ghost figures spread apart and the
   REBA badge now shows a *range* — the same lift could score 5 or 8 depending on angle error. *This
   is the computer-vision limitation, made concrete.*
6. **Load the "patient reposition" scenario.** However you set the sliders it stays High/Very high —
   because the task itself is the hazard. The score's job here is to make the case for a hoist or
   slide sheet, not to coach lifting technique.
7. Read the **throughput** line and the **"what this score does not know"** list.

---

## Discussion questions

- Which half of this pipeline would you defend to a worker who disputes their score — and which
  half can't you?
- The oblique camera moved the score a whole action level. What would your deployment require of
  camera placement before you trusted the numbers?
- It scores each lift in isolation. How would you turn a stream of snapshot scores into a
  cumulative-exposure measure that actually predicts MSD?
- For patient handling the tool always says "High". Is that useful, or just noise? What decision
  does it actually support?
- A camera scoring staff (and, in healthcare, patients in frame) — what has to be in place for that
  to be acceptable?

---

## Scenarios included

| id | folder | the task |
|---|---|---|
| `warehouse-carton-lift` | `data/warehouse-carton-lift/` | lifting a carton from a pallet to a conveyor |
| `patient-reposition` | `data/patient-reposition/` | sliding a patient up the bed by hand — no slide sheet, no hoist |

Add more by copying `data/_TEMPLATE/` — see `data/_TEMPLATE/README.md`.

---

## Files

```
S6-ergonomic-lifting-risk/
├── index.html        entry point — open this
├── app.js            angle derivation + REBA table walk + NIOSH lifting equation + skeleton render (no pose model, no network)
├── styles.css        projector-friendly, light + dark (shares S1–S5 tokens)
├── README.md         this file
└── data/
    ├── manifest.js
    ├── warehouse-carton-lift/dataset.js
    ├── patient-reposition/dataset.js
    └── _TEMPLATE/
        ├── dataset.js
        └── README.md     dataset contract + the equations app.js runs
```

## Honesty rules baked in

- Banner: no pose model runs; REBA / NIOSH tables authored, the arithmetic is real and hand-checkable.
- The pose-estimation step is named as the opaque half; the rubric is named as the transparent half.
- The camera-view toggle shows the score as a *range* under angle uncertainty — the CV limitation is not glossed.
- The "what this score does not know" list (force vs posture, snapshot vs dose, generic body, occlusion, garbage-in) is always on screen.
- Framed throughout as a triage pointer for a human ergonomist, never a finding or grounds for discipline.
