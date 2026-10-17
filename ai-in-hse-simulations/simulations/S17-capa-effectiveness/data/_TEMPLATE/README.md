# Adding a scenario to S17

Copy `_TEMPLATE/` to `data/<your-id>/`, edit `dataset.js` (match the registration key/`id` to the
folder), register with a `<script src>` in `index.html` and a row in `data/manifest.js`.

- Pick a fixed `referenceDate` — the "today" every date-arithmetic rule is computed against. It
  does not need to match the real current date; it's an illustrative snapshot.
- List 10-12 `capas`, each with `raisedDate`/`dueDate` and either `status: "open"` (`closedDate:
  null`) or `status: "closed"` (`closedDate` set). `recurrences` is a list of ISO dates when a
  similar problem recurred — empty for effective actions.
- Include a spread: a couple of clearly-overdue open items, one open item not yet due, several
  closed-and-effective items, one closed-ineffective item well inside any reasonable window, and
  **one deliberately window-sensitive item** (recurrence 75-89 days after closure) whose flagged
  status flips as the recurrence-window slider crosses 60-90 days — hand-check that flip before
  shipping.
- Test: compute days-open-past-due and days-to-recurrence by hand for 2-3 CAPAs and confirm the
  app's flags match at the default slider positions and after moving them.
