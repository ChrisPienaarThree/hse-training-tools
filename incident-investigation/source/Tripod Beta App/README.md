# Tripod Beta Investigator (Istec Training)

A standalone application for documenting an incident with the **Tripod Beta** method, built from the material in `../Context` (Tripod Beta User Guide 02a, WISER introduction, Shell methodology notes). It uses the current User Guide terminology only: Agent of Change, Object, Event; Immediate Cause → Precondition → Underlying Cause; Basic Risk Factors.

## Files

| File | Use |
|---|---|
| `Tripod Beta Investigator.html` | The offline app. One file, no internet needed (fonts fall back to system fonts). Copy it to a USB stick, LMS or email. Cases are kept in the browser; use **Save as file** to back up or share. |
| `dist/artifact.html` | Page body published as the claude.ai artifact (shared team database). |
| `src/content.js` | Method content: element types, BRFs, error types (Annex 3), quality tips (Annex 2), glossary, and the Annex 8 worked example. |
| `src/rules.js` | Tree rules engine (Annex 5 and 6, Annex 2 quality tips, the action requirement). Pure functions. |
| `src/export.js` | Tree drawing, tidy layout, SVG / draw.io / Word (.docx) / HTML report / Storyline Casebook package. |
| `src/app.js`, `src/template.html` | The app and its page shell and styles. |
| `build.py` | Checks syntax, checks the worked example passes every rule, then writes the two HTML outputs. |
| `tests/` | `rules.spec.js` (rules, docx, Casebook format) and `e2e/` (Playwright: building a tree by hand, rules, persistence, exports, import, mocked shared-database session). |

Edit files in `src/`, never the built HTML. Then:

```
python3 build.py
npx playwright test        # 20 tests; uses installed Google Chrome
```

## What it does

1. **Cases**: list, new, duplicate, delete (with confirmation), open or save a case file (`.tripod.json`). The Annex 8 vehicle roll-over case is built in as a read-only reference, with **Make a practice copy**.
2. **Incident**: details, severity, team, practitioner, summary, lessons learned, review/sign-off, client logo, activity log.
3. **Tripod tree**: free drag-and-drop canvas with the Annex 5 symbols. Drag elements from the palette; drag the round handle on a node onto another to link them (the direction is worked out automatically, and links the rules forbid are refused with the reason). Click a line to insert a barrier on it. Inspector: type, description, error type (Annex 3), BRF, precondition scope, notes, evidence, confirmed/assumed, quick-add buttons (Agent, Object, barrier, prior trio, Immediate Cause → Precondition → Underlying Cause), links, actions. Undo/redo, zoom, fit, grid, **Tidy layout**, keyboard nudge/delete. The coach panel (on/off) shows the guide definition and tips for the selected element.
4. **Rules check**: live errors, warnings and tips, each with a **Show on tree** button. See the rule list below.
5. **Actions**: SMART action register linked to Failed/Missing/Inadequate Barriers and Underlying Causes: owner, due date, priority, status, agreed by owner, close-out note, and a list of what still needs an action.
6. **BRF profile**: Underlying Causes by the 11 BRFs, Immediate Causes by error type, barrier counts.
7. **Report**: on-screen preview; Word (.docx, with the tree on a landscape page), web page (.html), print/PDF (offline version only); tree as SVG, PNG and draw.io; case file; Storyline Casebook package.
8. **Method guide**: stages, symbols, tree rules, Annex 2 tips, Annex 3 table, BRF definitions, glossary.

### Rules checked

Errors: Event without exactly one Agent and one Object input · trajectory not starting at an Agent/Object · barrier not on exactly one trajectory · Failed Barrier with no Immediate Cause, or more than one · Missing/Inadequate Barrier with no Underlying Cause · invalid link types (e.g. Immediate Cause on a Missing Barrier, causes on an Effective Barrier, anything into an Agent, Object or Underlying Cause) · Immediate Cause not on a Failed Barrier · Precondition not on an Immediate Cause · organisational Precondition without an Underlying Cause · Underlying Cause not linked · loops.
Warnings: trio with no barrier (merge it) · Immediate Cause with no Precondition and no justification · Underlying Cause without BRF · Failed/Missing Barrier or Underlying Cause without an action · unlabelled or unlinked elements · Event-Agent/Event-Object that leads nowhere.
Tips: 2–5 trios · generic barrier wording · unclassified error type · actions not yet SMART or missing owner/due date.
Derived: an Effective Barrier on a trajectory turns that Event into a Potential Event.

## Shared (artifact) version

- Each investigation is one document in the artifact's `cases` collection (256 KB limit; the client logo is resized to fit).
- Saves are automatic (about one second after a change). Last save wins. If someone else saves while you have unsaved changes, a banner offers **Load their version** or **Keep mine and overwrite**. Without unsaved changes, their version loads automatically.
- Viewers without edit access see cases read-only.
- No print button in the artifact (the viewer frame blocks printing): download the Word or web-page report and print or PDF from there. draw.io export is `.drawio.svg` in the artifact (`.drawio` offline); draw.io desktop opens both as editable diagrams.

## Notes on the worked example

The tree follows the final figure in Annex 8. Where the figure's BRF codes were not legible (UC1 Communication, UC2 Procedures, UC3 Organisation, UC4 Incompatible Goals, UC5 Training), they were assigned to match the guide's text. The 17 example actions were written for training. They are not in the guide.
