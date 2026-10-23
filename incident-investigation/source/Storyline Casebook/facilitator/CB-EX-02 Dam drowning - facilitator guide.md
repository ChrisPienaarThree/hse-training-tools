# CB-EX-02 Dam drowning: facilitator guide (Storyline Casebook, ICAM)

An ICAM training case built into the Storyline Casebook. It is anonymised: the mine, the dam, the contractor and the people are fictional, but the sequence follows a real event. Do not name the real site in class material. The same event is the Tripod Beta case TB-EX-09, so a group can analyse it with both methods and compare.

## The case in brief

After heavy rain higher up in the catchment, a mine's north return-water dam rose fast and overflowed. The control room noticed only when the pump installation was flooding. The engineering manager asked the owner of a civils contractor on site to help recover the pumps. The owner brought three workers with no experience of work on water. Two of them went out in an old boat that had stood unused behind the pump station for years, while the third held a line from the bank. The current and wind carried the boat towards the spillway and the line was pulled from his hands. Afraid of going over the wall, the two workers left the boat to swim to the bank. Worker B reached the bank; Worker A, who could not swim, drowned. There was no risk assessment or job plan, no life jackets or rescue equipment at the dam, and no training for work on water, rescue or first aid for drowning.

The evidence is deliberately sparse: no drawings of the dam, no measurements, no positions of the boat and the people, and no wind direction. Worker B is the only witness from the boat and has not been interviewed yet.

## What learners get

On the Case List, under the reference cases, choose **Training case CB-EX-02 → View Training Case** to read it, or **Make a practice copy** to work on it. The practice copy is a normal case in the shared casebook, so a group can work on it together.

- **Stage 1, Initial Report:** the factual first report, severity 5 / 5 (Level 4), the investigation team and the seven people involved (by role, no names).
- **Stage 2, Evidence & Data:**
  - **Evidence plan (PEEPO):** the investigator's account (with assumptions marked "I assume", "probably", "I think"), 29 evidence items grouped under People, Environment, Equipment, Procedures and Organisation, each with the ICAM element it informs; a 16-shot photography schedule; and 13 statements to test. It exports to Excel.
  - **Evidence register:** four items already logged (control room occurrence book, police recovery report, security officer's phone photos, plant rain gauge).
- **Stage 4, ECFA+ Storyline:** the core event sequence only: ten events, mostly presumptive, with no conditions.
- Stages 3 and 5 to 8 are empty. That is the exercise.

## Suggested session (90 to 120 minutes)

| Time | Activity |
|---|---|
| 10 min | Read Stage 1 and the investigator's account. Which statements are facts, which are assumptions? |
| 15 min | Evidence plan: in groups, pick the five most urgent items and say why each is perishable. Add anything missing (for example the time the control room was first alerted, or how and when to interview Worker B). Log two items into the register with **Log →** and see how they appear in Stage 2. |
| 10 min | Stage 3: write the refined description. Facts only, with evidence references, no blame. |
| 25 min | Stage 4: add the conditions to each event and the background conditions; split the decisions (control room, engineering manager, contractor) into a second timeline that merges into the launch of the boat. |
| 25 min | Stage 5: code the ICAM factors in all four columns and link each one to an event or condition. Stage 6: contributing factors and root causes. |
| 15 min | Stage 7: one strong corrective action for each root cause; check the hierarchy of control and the weak-action flag. |
| 10 min | Compare with the facilitator answer (import it, or show its Stage 8 report). |

Groups that have Claude available in the Casebook can use **Build plan with Claude** in a blank case from their own account of the event, then compare it with the given plan. Without Claude, **Build starter plan** gives the standard PEEPO lists plus the water-work pack.

## Model answer (one reasonable model)

Import `CB-EX-02 Dam drowning - facilitator answer.casebook-case.json` with **Import Case Package** on the Case List. It holds the full case: 13 events on two timelines, 22 conditions, 35 ICAM factors, 8 contributing factors, 8 root causes, 14 corrective actions and 2 key learnings. Summary:

**Absent / failed defences (10)**

| Code | Defence | Status |
|---|---|---|
| DF3 | Early warning of rising inflow from the upper catchment, with flood trigger levels | Absent |
| DF1 | Dam-level alarm to the control room before the pumps flood | Some failure |
| DF11 | Stop-work rule: no work on or near the dam while it overflows | Absent |
| DF10 | Contractor works only within an approved scope after onboarding and a competence check | Complete failure |
| DF9 | Pre-task risk assessment and job plan for work on water | Absent |
| DF12 | Supervision by someone competent in work on water | Absent |
| DF13 | Boat inspected and fit for the conditions | Absent |
| DF5 | Shore line and attendant able to hold and recover the boat | Complete failure |
| DF8 | Life jackets worn by everyone on the water | Absent |
| DF7 | Water-rescue equipment and a trained rescuer at the dam | Absent |

**Individual / team actions (7):** the engineering manager's request (IT2 Authority, an exceptional decision under pressure); the contractor owner accepting out-of-scope water work (IT11, routine scope creep); starting without a risk assessment (IT8); using the old boat uninspected (IT4); no life jackets, overalls and boots (IT5); holding the boat by hand (IT7); leaving the boat (IT10).

**Task and environmental conditions (9):** weather, current and wind (WF2); abnormal situation (WF12); no planning (WF10); non-routine task (WF11); boat and line condition (WF9); risk perception of distance and current (WF13); time pressure (HF5); panic (HF10); could not swim, heavy clothing (HF7).

**Organisational factors (9):** contractor management so slow that managers bypass it (**CM**, the systemic cause behind both the exceptional request and the routine scope creep); no quick risk assessment for unplanned work (RM); no flood triggers in the dam procedure (PR); pump installation not designed for the flood level (DE); no "people before equipment" guidance (IG); no water-safety training or swimming check (TR); no catchment monitoring or life-saving equipment (HW); disused equipment left uncontrolled (MM); emergency plan without water rescue (OR).

**Root causes:** no flood management for the dams; no stop-work rule and no "people before equipment" guidance; a contractor process managers routinely bypass; no quick planning format for unplanned work; disused equipment not controlled or inspected; no standard for work on or near water; no water-safety or rescue training; no water rescue in the emergency plan.

## Discussion points

1. **PEEPO is a prompt, not a filing system.** Some items fit more than one letter (training records: People or Organisation?). What matters is that nothing is missed and each item says which ICAM question it answers.
2. **Perishable first.** Water lines, debris lines, the boat's position, phone photos and memory fade within hours. Why are the interviews of Worker B and Worker C urgent, and how do you interview a survivor with care (trauma, guilt, loss of a colleague)?
3. **Exceptional versus routine.** The manager's request was a one-off decision under pressure; the contractor accepting out-of-scope work happens all the time on this site. ICAM asks why both made sense to the people at the time; the answer sits in the organisational factors, not in blame.
4. **Scope creep as a symptom.** A slow contractor process does not stop managers using contractors; it pushes the work outside the process, without scope, competence or risk checks. Fix the process (a fast track that keeps the checks), not only the rule.
5. **Defences on the right event.** Learners often link "life jackets" to the drift. Which event would the life jacket have changed? It belongs to the workers in the water.
6. **Presumptive until proven.** Almost every event is presumptive. Which statements to test can be settled with evidence still available, and which may never be?
7. **People before equipment.** The defence that would have prevented everything after the overflow is a stop-work rule for an overflowing dam.

## Files

- `CB-EX-02 Dam drowning - facilitator answer.casebook-case.json`: the full answer as a case package (Import Case Package).
- `make_dam_answer.js`: rebuilds the answer from the learner case in the Casebook source and checks every link.
- The learner case is built into the Casebook (artifact and offline).

Keep the facilitator files out of the learner kit.
