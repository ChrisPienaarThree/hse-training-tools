# Adding a scenario to S9

Each scenario is one folder under `data/`. Copy `_TEMPLATE/` and fill in `dataset.js`.

## Steps

1. **Copy the folder**
   ```
   cp -R data/_TEMPLATE data/my-scenario-id
   ```

2. **Edit `data/my-scenario-id/dataset.js`**
   - Change the registration key and `id` from `"TEMPLATE-ID"` to `"my-scenario-id"` (must match the folder).
   - Describe the `node` and its normal operating condition in `nodeContext`.
   - List 1–2 `screenedOut` guide-word/parameter combinations with a one-line reason — this is what
     makes the "narrow, checkable answer space" argument visible.
   - Write 4–6 `deviations`. For each: 3–5 `aiCauses` (one across the whole scenario should carry
     `reviewFlag: true` — a plausible-sounding cause that doesn't actually fit), 2–3
     `aiConsequences`, 2–3 `aiSafeguards` with a `status`, and `humanAdds` that could only come from
     this specific site (a maintenance-log fact, an audit finding, a near-miss, tribal knowledge).
   - Write the five `callouts` and four `notes`.

3. **Register it** — a `<script src>` line in `index.html` (after `manifest.js`, before `app.js`)
   and a `{ id, label }` row in `data/manifest.js`.

4. **Test** — open `index.html`, pick the scenario, and check:
   - each deviation's causes/consequences/safeguards render with the right status colours;
   - the reviewFlag cause shows its accept/reject control and blocks the sign-off gate until decided;
   - ticking every safeguard (and, once revealed, considering the human additions) enables "Mark reviewed";
   - marking a deviation reviewed adds a row to the running worksheet with the right tallies;
   - typing your own addition and clicking "Add" appends it to "your team's additions".

## Authoring guidance

- **`aiCauses` / `aiConsequences` / `aiSafeguards`** should be things a competent engineer would
  recognise from *any* site running similar equipment — that is what makes them "AI-suggestible".
- **`humanAdds`** must NOT be generic. Test: could this fact appear in a textbook or a generic
  incident database? If yes, it belongs in `aiCauses`, not `humanAdds`.
- **The `reviewFlag` cause** should be a real HAZOP pattern-matching failure mode: correct-sounding,
  wrong deviation (e.g. a relief-valve cause suggested for a "no flow" deviation, or a "more
  pressure" cause suggested under "less pressure"). Only one is needed across the whole scenario.
- Keep safeguard `status` honest: most real sites have at least one `missing` and one
  `present-unverified` per deviation — an all-green safeguard list is not credible and undersells
  the point of the exercise.
