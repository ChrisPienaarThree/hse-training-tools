# HSE Training Tools

Offline, browser-based simulations, games, quizzes and working tools for HSE, incident-investigation and
process-safety training. No installation, no server, no internet connection needed: open the HTML
file in Chrome, Edge, Safari or Firefox.

**Start with [`index.html`](index.html)**, the landing page that links to every collection.
If GitHub Pages is switched on for this repository, the same page is the site's home page.

| Folder | What's in it | Open |
|---|---|---|
| `ai-in-hse-simulations/` | 23 simulations for the "Integrating AI in Workplace Safety Practices" course | `index.html` |
| `incident-investigation/falling-billet-game/` | The Falling Billet investigation game and facilitator guide | `The Falling Billet.html` |
| `incident-investigation/lead-investigator-quiz/` | Live quiz for the 21-module Lead Incident Investigator course | the `.html` file |
| `incident-investigation/source/` | Build sources and tests for the game and the quiz | see each `README` |
| `pha-hazop-quiz/` | Live quiz on the PHA / HAZOP learner manuals | the `.html` file |
| `hazard-register/` | Hazard Register | `Hazard Register.html` |

### Moved to their own repositories

| Collection | Site | Repository |
|---|---|---|
| Mechanical Engineering Simulators | https://chrispienaarthree.github.io/mech-engineering-simulators/ | [mech-engineering-simulators](https://github.com/ChrisPienaarThree/mech-engineering-simulators) |
| Incident Investigation Toolkit | https://chrispienaarthree.github.io/investigation-toolkit/ | [investigation-toolkit](https://github.com/ChrisPienaarThree/investigation-toolkit) |
| Process Safety Analysis Toolkit | https://chrispienaarthree.github.io/process-safety-toolkit/ | [process-safety-toolkit](https://github.com/ChrisPienaarThree/process-safety-toolkit) |
| Rotating Equipment Quality Planner | https://chrispienaarthree.github.io/rotating-equipment-quality-planner/ | [rotating-equipment-quality-planner](https://github.com/ChrisPienaarThree/rotating-equipment-quality-planner) |

## Using the tools offline

1. Download the repository (**Code → Download ZIP**) and unzip it.
2. Open `index.html`, or the tool's HTML file.

Saved work (cases, studies, registers) is stored in the browser or exported as files you choose;
nothing is sent anywhere.

## Rebuilding from source

- `incident-investigation/source/Billet Investigation Game/`: `python3 build.py`; tests with `npx playwright test` (needs Node.js and Playwright)
- `incident-investigation/source/Lead Investigator Quiz/`: `python3 build_quiz.py`

The simulations and the other tools are single-file or plain HTML/CSS/JS and need no build step.

## Licence

- **Software** (the HTML, CSS and JavaScript of the apps): MIT licence, see [`LICENSE`](LICENSE).
- **Documents and content** (guides, instructions, worked examples, workbooks, scenario data): Creative Commons Attribution 4.0 (CC BY 4.0), see [`LICENSE-DOCS.md`](LICENSE-DOCS.md). Credit: *"Based on material by Chris Pienaar, licensed under CC BY 4.0."*
- **Third-party components** keep their own licences: see [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md) where present.

Copyright (c) 2026 Chris Pienaar. The models and data are illustrative training material, not design tools, and are provided without warranty.

**Excluded:** client material (`hazard-register/`) is **not licensed**: all rights remain with their owners. See [`LICENSE-DOCS.md`](LICENSE-DOCS.md) for the full list.
