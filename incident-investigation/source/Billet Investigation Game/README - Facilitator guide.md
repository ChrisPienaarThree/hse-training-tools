# The Falling Billet: facilitator guide

An ICAM investigation game built on the 2008 falling-billet case (anonymised as Steel Inc.).

## Files
- `The Falling Billet.html`: offline single file (USB, LMS, email). Progress saves in the browser.
- Online version (live class sessions): https://claude.ai/artifact/PLBtsXkVJmfu1Vau3h56ju. It is private until you share it from the page's Share menu. Teams need **Contributor** (can interact) access to report progress to your board.
- `src/content.js`: all case content (facts, interviews, documents, actions, answer keys). Edit it, then run `python3 build.py`.
- `photos/`: the 14 scene and reconstruction photos used. The four casualty photos are left out on purpose.

## Facilitator code
**ICAM** (Facilitator button, top right). It unlocks answer keys, unlocks all stages, adds time, reveals all facts for demonstrations, and runs class sessions online.

## Running a class (online)
1. Open the Facilitator panel and choose **Start class session**. Give teams the code (for example B4821).
2. Teams choose **Join a class session** on the start screen.
3. Release stages and investigation days as the class moves on. Send injects ("Day 2: a new Metro delivery arrives").
4. The team board shows each team's stage, hours used, key facts found and score.

Offline, run the same flow from the front of the room and use the answer keys in the debriefs.

## Stages and the teaching point in each
| Stage | What learners do | Key teaching point |
|---|---|---|
| 1 Call-out | Choose immediate instructions | Secure and preserve; don't blame early. Choices change which evidence survives |
| 2 Team & severity | Pick the team; rate actual 4 / potential 5 | Independence; potential severity sets the level |
| 3 Data plan | PEEPO plan with ★ priorities | Perishable evidence first; unplanned work costs extra time |
| 4 Investigate | 20 h over 3 days: interviews, site, documents, 5-Why | Open vs leading or blaming questions; spot the post-dated WI 044 and HIRA and the 3 t licence on an 8 t machine |
| 5 Storyline | Sort cards into events and conditions; order; attach | ECFA+ structure; presumptive vs proven |
| 6 ICAM | Code each fact DF / IT / WF-HF / OF | Coding against the 2008 analysis |
| 7 Root cause | Pick root causes; choose actions | System fixes over blame; hierarchy of controls |
| 8 Debrief | Scores, missed facts, model answer, export | Export to the Storyline Casebook (**Import Case Package** on its case list) |

## Resetting a stage
Every stage from Call-out to Root cause has a **↺ Reset this stage** link under its title once some work has been done. It clears only that stage's answers. Because later work is built on earlier choices, it also clears the stages that depend on it, and the confirm box names them first:
- Call-out or Data plan → also clears Investigate, Storyline and ICAM (the call-out decides what evidence survives; the plan sets the time cost of each action)
- Investigate → also clears Storyline and ICAM (they use the facts found)
- Storyline → also clears ICAM (only the facts the storyline keeps get coded)
- Team & severity, ICAM and Root cause reset on their own.

Learners then work forward again from the reset stage. **Restart from scratch** on the briefing page (or **Play again** on the debrief) still clears everything.

## In-game guide
The **Guide** button (top right, and three buttons on the briefing screen) opens:
- **Overview**: the case, the learning outcomes, how long it takes, and the ways to play.
- **How to play**: the basics, each stage with time and tips, interviewing, time, documents and scoring weights.
- **Facilitator guide**: preparation, facilitator mode, running a class session and a one-day timetable. The debrief questions only appear in facilitator mode, so learners can't see them.

## Suggested timetable (one day, about 4–6 h)
| Stage | Time |
|---|---|
| Call-out | 10–15 min |
| Team & severity | 10–15 min |
| Data plan | 15–20 min |
| Investigate | 60–120 min |
| Storyline | 30–45 min |
| ICAM analysis | 30–45 min |
| Root cause & actions | 20–30 min |
| Debrief | 20–30 min |
| Plenary between stages | 5–10 min each |

## Debrief questions
| Stage | Ask the class |
|---|---|
| Call-out | What is the first priority? What is perishable here? What message does an early suspension send? |
| Team & severity | Why not include the operator or the supervisor on duty? Why does potential severity, not actual, set the investigation level? |
| Data plan | Which items did teams star, and why? What would you collect in the first hour on a real site? |
| Investigate | Compare question types across teams. Who spotted the dates on WI 044 and the HIRA, and the licence class against the machine rating? What did each team run out of time for? |
| Storyline | Where do teams disagree on event versus condition? Which facts are presumptive, and what would prove them? |
| ICAM analysis | Which facts were coded as individual actions when they are really conditions or organisational factors? |
| Root cause & actions | Would each action have prevented this event? Where does it sit on the hierarchy of controls? |
| Debrief | What would you do differently on your next investigation? |
