# HSE Training Tools

Offline, browser-based simulators and working tools for engineering, incident-investigation and
process-safety training. No installation, no server, no internet connection needed: open the HTML
file in Chrome, Edge, Safari or Firefox.

**Start with [`index.html`](index.html)**, the landing page that links to every collection.
If GitHub Pages is switched on for this repository, the same page is the site's home page.

| Folder | What's in it | Open |
|---|---|---|
| `mechanical-engineering-simulators/` | 27 simulators (pumps, compressors, hydraulics, vibration, bearings, gears, heat exchangers, tanks, cranes…) | `index.html` |
| `ai-in-hse-simulations/` | 23 simulations for the "Integrating AI in Workplace Safety Practices" course | `index.html` |
| `incident-investigation/toolkit/` | Tripod Beta Investigator, RCA Fault Tree, Storyline Casebook, guides and examples | `START HERE.html` |
| `incident-investigation/falling-billet-game/` | The Falling Billet investigation game and facilitator guide | `The Falling Billet.html` |
| `incident-investigation/lead-investigator-quiz/` | Live quiz for the 21-module Lead Incident Investigator course | the `.html` file |
| `incident-investigation/source/` | Build sources and tests for the investigation tools (Python build scripts, Playwright tests) | see each `README` |
| `process-safety-toolkit/` | HAZOP Study Manager, Bow Tie, Event Tree, Fault Tree & PFD calculator, workbooks, guides, PHA/HAZOP quiz | `START HERE.html` |
| `hazard-register/` | Hazard Register | `Hazard Register.html` |
| `rotating-equipment-quality-planner/` | Rotating Equipment Quality Planner with Excel template and user guide | the `.html` file |

## Using the tools offline

1. Download the repository (**Code → Download ZIP**) and unzip it.
2. Open `index.html`, or a toolkit's `START HERE.html`.
3. On Windows you can also use the `Start … .cmd` launchers; on a Mac, the `.command` launchers.

Saved work (cases, studies, registers) is stored in the browser or exported as files you choose;
nothing is sent anywhere.

## Rebuilding from source

The investigation tools are built from `incident-investigation/source/`:

- `Tripod Beta App/`, `RCA Fault Tree App/`, `Casebook Offline/`, `Billet Investigation Game/`: `python3 build.py`
- `_kit_build/build_kit.py` reassembles the toolkit folder
- Tests: `npx playwright test` in each app folder (needs Node.js and Playwright)

The simulators and the other tools are single-file or plain HTML/CSS/JS and need no build step.
