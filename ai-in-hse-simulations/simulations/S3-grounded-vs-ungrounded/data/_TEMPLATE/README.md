# Adding a scenario to S3

Each scenario is one folder under `data/`. Copy `_TEMPLATE/` and fill in `dataset.js`.

## Steps

1. **Copy the folder**
   ```
   cp -R data/_TEMPLATE data/my-scenario-id
   ```
   Short kebab-case id (`loto-group-isolation`, `scaffold-handover`, `dse-break-rule`…).

2. **Edit `data/my-scenario-id/dataset.js`**
   - Change the registration key and `id` from `"TEMPLATE-ID"` to `"my-scenario-id"` (must match the folder).
   - Write a **fictional** standard/procedure extract as `source.paragraphs` (paragraph number = index + 1).
   - Author three `ungrounded.variants` (common → niche) and the two `grounded` answers (`full`, `snippet`).
   - Every claim is `{ text, cite, verdict, note }`. Verdicts and colours:

     | verdict | meaning | colour |
     |---|---|---|
     | `supported` | backed by the cited paragraph | green |
     | `partly` | half right, half invented | amber |
     | `unsupported` | invented detail, no basis | red |
     | `contradicts` | the source says otherwise | red |
     | `fabricated` | invented citation / clause / standard | red |
     | `hedge` | (grounded) "the source doesn't cover this" | blue |
     | `gap` | (grounded) "outside the supplied snippet" | blue |
     | `inference` | (grounded) reasoned beyond the text, flagged for a human | purple |

3. **Register it** — `index.html` gets a `<script src>` line (after `manifest.js`, before `app.js`);
   `data/manifest.js` gets a `{ id, label }` row.

4. **Test** — open `index.html`, pick the scenario, and check:
   - the familiarity slider swaps the ungrounded answer and the base-rate caption;
   - the source toggle swaps grounded `full` ↔ `snippet` and greys withheld paragraphs;
   - citation chips highlight the right paragraph;
   - the review gate on the ungrounded pane stays locked until every red/amber claim is marked verified;
   - the summary scoreboard adds up.

## Authoring guidance

- **Common variant:** mostly correct, 1–2 planted errors. The point is *you can't tell which lines are wrong*.
- **Niche variant:** confidently, badly wrong — wrong numbers, reversed orders, invented annexes.
- **Grounded `full`:** almost all `supported`, plus exactly one `inference` and one or two `hedge`.
- **Grounded `snippet`:** answers only from `paragraphs[0 .. snippetParas-1]`; everything else is a `gap`.
- Keep each claim list to ~5–8 items so the panes stay readable on a projector.
