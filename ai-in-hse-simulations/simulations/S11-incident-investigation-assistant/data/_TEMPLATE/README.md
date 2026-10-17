# Adding a scenario to S11

Each scenario is one folder under `data/`. Copy `_TEMPLATE/` and fill in `dataset.js`.

## Steps

1. **Copy the folder**
   ```
   cp -R data/_TEMPLATE data/my-scenario-id
   ```

2. **Edit `data/my-scenario-id/dataset.js`**
   - Change the registration key and `id` from `"TEMPLATE-ID"` to `"my-scenario-id"` (must match the folder).
   - Write a realistic `narrative` (150-250 words is plenty) that contains enough detail to support
     the drafted sections below, including at least one pre-existing equipment/procedural issue.
   - Build the `timeline` from what the narrative actually says, plus 1-2 `inferred: true` entries
     for plausible gaps (response times are a good choice) — each with a `note` on what to confirm.
   - Write 3-5 `immediateCauses`, 3 `rootCauses` (each in a distinct category — design/layout,
     training, procedures, maintenance, communication/reporting culture are good ones to draw from),
     a 4-5 step `fiveWhys` chain, 2-3 `contributingFactors`, and 2-3 `correctiveActions` each linked
     to a root-cause category.
   - Build exactly 4 `similarIncidents`. **Three must have a matching entry in `repository`**
     (same `ref`); **one must not** — that is the fabricated citation. Make its description and
     similarity note just as plausible as the real three.
   - Add 1-2 extra `repository` entries that are real but NOT surfaced by the AI (for realism — a
     real repository has more in it than any one search returns).

3. **Register it** — a `<script src>` line in `index.html` (after `manifest.js`, before `app.js`)
   and a `{ id, label }` row in `data/manifest.js`.

4. **Test** — open `index.html`, pick the scenario, and check:
   - each section renders with its DRAFT framing and review checkbox;
   - "Check repository" on each similar incident gives the right verdict (3 verified, 1 not found);
   - the fabricated one can be excluded via its "Include in report" toggle;
   - "Finalize investigation report" stays disabled until every section is reviewed AND the
     fabricated incident is excluded (or explicitly still-included, which should keep it blocked).

## Authoring guidance

- Keep the fabricated `similarIncidents` entry indistinguishable in *format* from the real ones —
  same style of reference number, same one-line phrasing. The lesson is that it does not announce
  itself.
- Root-cause `category` values are free text but should come from a recognisable taxonomy
  (Design/Layout, Training/Competence, Procedures, Maintenance/Asset Integrity, Communication/
  Reporting Culture, Supervision) so `correctiveActions[].rootCauseLink` reads as a real mapping.
- The `execSummaryDraft` should read like something a busy manager might skim and forget is a
  draft — fluent and plausible is the point.
