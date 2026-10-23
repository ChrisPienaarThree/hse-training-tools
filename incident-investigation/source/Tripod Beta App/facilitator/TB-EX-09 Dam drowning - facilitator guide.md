# TB-EX-09 Dam drowning: facilitator guide

A Tripod Beta training case built into the Tripod Beta Investigator. It is anonymised: the mine, the dam, the contractor and the people are fictional, but the sequence follows a real event. Do not name the real site in class material.

## The case in brief

After heavy rain higher up in the catchment, a mine's return-water dam rose fast and overflowed. The mine became aware too late, and the pump installation at the dam was flooding. The engineering manager asked the owner of a small contractor on site to help recover the pumps. The contractor brought three workers with no experience of work on water. Two of them used an old boat that had stood unused on site for years while the third held a line from the bank, but the current and wind pushed the boat towards the overflow faster than he could hold it. Afraid of going over the wall, the two workers left the boat to swim to the bank. They misjudged the distance and their clothing and boots dragged them down. One reached the bank; the other, who could not swim, drowned. The survivor is the only witness from the boat. There was no pre-task risk assessment or job plan, no life jackets or rescue equipment, and no training for work on water, rescue or first aid for drowning.

The evidence is deliberately sparse: there are no drawings of the dam, no measurements, no positions of the boat and the people, and no wind direction.

## What learners get

Open **Cases ▸ Reference cases ▸ TB-EX-09** and choose **Make a practice copy**. The copy holds:

- **Incident** tab: the description and a team.
- **Evidence plan** tab: the investigator's account (with assumptions marked "I assume", "probably", "I think"), 28 evidence items (the surviving worker's interview first), a 16-shot photography schedule and 13 statements to test. Learners can export it to Excel.
- **Tripod tree** tab: the core diagram only, four trios:
  1. Heavy rainfall in the catchment + the dam and pump installation → **dam overflows; pump installation flooded** (Event-Agent)
  2. Overflowing dam + old boat with two workers → **boat drifts out of control towards the spillway** (Event-Agent)
  3. Drifting boat + the two workers → **workers leave the boat and enter the water** (Event-Object)
  4. Deep, moving water + workers in the water → **one worker drowns; the other reaches the bank** (main event)

The Rules check shows four "no barrier" warnings. That is the starting point.

## Suggested session (75 to 90 minutes)

| Time | Activity |
|---|---|
| 10 min | Read the Incident tab and the investigator's account. Discuss: which statements are facts and which are assumptions? |
| 15 min | Evidence plan: in groups, rank the five most urgent items and say why they are perishable. Add anything missing (e.g. the time the control room was first alerted, and when and how to interview the survivor). |
| 30 min | Tree: in a practice copy, add the barriers on each trajectory, then the Immediate Cause, Preconditions and Underlying Causes (with BRF) for each Failed Barrier, and Underlying Causes for each Missing or Inadequate Barrier. Use the Rules check until it is clear of errors. |
| 15 min | Compare with the facilitator answer (open the `.tripod.json` in the app, or show the report). |
| 10 min | SMART actions for three of the Underlying Causes; discussion. |

Groups can also use **Draft the tree with Claude** (artifact) or the copy-prompt route, then critique the draft against the evidence. That works well as a discussion of why a draft is a hypothesis, not a finding.

## Model answer (one reasonable model)

The full tree is in `TB-EX-09 Dam drowning - facilitator answer.tripod.json` (open it with **Open case file…**) and `... (report).html`. Summary:

| Trio | Barrier | Type | Immediate Cause (error type) |
|---|---|---|---|
| 1 Flood | Early warning of rising inflow from the upper catchment, with flood trigger levels | Missing | (Underlying Causes: no catchment monitoring [DF]; no flood trigger levels in the dam procedure [PR]) |
| 1 Flood | Pump installation sited and protected for the flood level | Inadequate | (Underlying Cause: design did not consider maximum flood level [DE]) |
| 2 Drift | All work on or near the dam stopped while it overflows | Failed | Engineering manager asks the contractor to recover the pumps from the overflowing dam (**exceptional violation**) |
| 2 Drift | Contractor works only within an approved scope after onboarding and competence check | Failed | Contractor owner accepts water work outside his scope and experience (**routine violation**: contractor scope creep) |
| 2 Drift | Pre-task risk assessment and job plan for work on water | Failed | Work starts with no risk assessment or plan (routine violation) |
| 2 Drift | Boat inspected and fit for the conditions | Failed | Old boat taken into use without inspection (knowledge-based mistake) |
| 2 Drift | Shore line and attendant able to hold the boat | Failed | Shore attendant underestimates current and wind and loses control (knowledge-based mistake) |
| 3 Leave boat | Workers stay with the boat and wait for rescue | Failed | Workers leave the boat in panic to swim to the bank (knowledge-based mistake under pressure) |
| 4 Drowning | Life jackets worn | Missing | (no life-saving equipment required or provided [DF]) |
| 4 Drowning | Clothing and PPE suited to work on water | Inadequate | (PPE selection ignores drowning risk [PR]) |
| 4 Drowning | Water rescue equipment and trained rescuer at the dam | Missing | (emergency plan does not cover water rescue [DF]) |
| 4 Drowning | First aid for drowning available | Missing | (first-aid training does not cover drowning [TR]) |

Key Preconditions and Underlying Causes:

- Pressure to restore pumping and save equipment ← no guidance on putting people before equipment in an emergency (**IG**); no flood response in the dam procedure (**PR**).
- Calling a contractor directly is quicker than the formal process; doing odd jobs keeps the client relationship ← **contractor management process so cumbersome that managers routinely bypass it (OR)**. This is the systemic cause behind both the exceptional request and the routine scope creep.
- Nobody had worked on water, so hazards were not recognised ← contractor competence not checked against the task (**TR**).
- "No time" to plan in an emergency; current and wind never assessed ← no quick risk assessment format for emergency or unplanned work (**PR**).
- The boat was there and looked quickest ← disused equipment left on site, uncontrolled (**HK**).
- Fear of the spillway; misjudged distance; could not swim ← no boat-in-distress procedure (**PR**); no water-safety training or swimming check (**TR**).

BRF profile: PR 5, DF 3, TR 3, IG 1, OR 1, HK 1, DE 1 (plus DF on the early warning).

## Discussion points

1. **Exceptional versus routine violation.** The manager's request was a first-time decision under pressure with no rule to follow (exceptional). The contractor accepting out-of-scope work is routine on this site. Tripod asks *why both made sense to the people at the time*: the Preconditions, not blame.
2. **Scope creep as a symptom.** A cumbersome contractor process does not stop managers using contractors; it pushes the work outside the process, without scope, competence or risk checks. The action is to fix the process (fast track with checks), not only to forbid the practice.
3. **Barriers on the right trajectory.** Learners often put "life jackets" in trio 2. Ask: which Event would it have prevented? It protects the Object (the people in the water) in trio 4.
4. **Missing or Failed?** "Early warning" is Missing if nobody was ever expected to provide it; if a procedure required someone to monitor upstream rain and they did not, it becomes a Failed Barrier with an Immediate Cause. Let the evidence decide.
5. **Sparse evidence and the survivor.** The surviving worker is the only witness from the boat: interview him early, separately and with care (trauma, guilt, loss of a colleague). Which statements in the account can be tested with what is still available? What will be lost first (water line, phone videos, memory)? Mark tree elements **assumed** until confirmed.
6. **People before equipment.** The first barrier that would have prevented everything after trio 1 is a stop-work rule for an overflowing dam.

## Files

- `TB-EX-09 Dam drowning - facilitator answer.tripod.json`: the full tree, causation paths and 26 SMART actions. Opens in the Tripod Beta Investigator.
- `TB-EX-09 Dam drowning - facilitator answer (report).html`: the full report, printable.
- The learner case is built into the app and is also in the USB kit `Examples` folder.

Keep the facilitator files out of the learner kit.
