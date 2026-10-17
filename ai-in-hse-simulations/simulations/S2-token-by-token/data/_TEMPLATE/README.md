# Adding a scenario to S2

Each scenario is one folder under `data/`. Copy `_TEMPLATE/` and fill in `dataset.js`.

## Steps

1. **Copy the folder**
   ```
   cp -R data/_TEMPLATE data/my-scenario-id
   ```
   Short kebab-case id (`ppe-cut-level`, `isolation-points`, `noise-action-level`…).

2. **Edit `data/my-scenario-id/dataset.js`**
   - Change the registration key and `id` from `"TEMPLATE-ID"` to `"my-scenario-id"` (must match the folder).
   - Pick a fact that is a short, quotable value (a number + unit, a level, a code).
   - Put that value in one `reference.lines` entry; set `reference.keyFact` and `reference.keyToken`.
   - Write `steps[]` so the top logit at each position spells a correct fluent sentence ending in the fact.
   - On the fact step (`factStep`), author `ungrounded[]` so the key token is present but mid-pack —
     a few plausible wrong values outrank it.
   - Keep the whole generation to ~8–16 steps.

3. **Register it** — two one-line edits:
   - `index.html`: add `<script src="data/my-scenario-id/dataset.js"></script>` (after `manifest.js`, before `app.js`).
   - `data/manifest.js`: add `{ id: "my-scenario-id", label: "Short label" }`.

4. **Test** — open `index.html`, pick the scenario, and check:
   - low temperature + reference in context → correct sentence, verdict green;
   - shrink the context window until the reference badge reads EVICTED → run again → wrong value, verdict red;
   - raise temperature with the reference in context → the fact step's bar chart flattens and the pick can slip.

## The dataset contract

| key | type | notes |
|---|---|---|
| `id`, `label` | string | `id` matches folder + registration key |
| `system` | string | "answer only from the reference" instruction |
| `reference.title` | string | mark it `[FICTIONAL, for demonstration only]` unless it is genuinely public domain |
| `reference.lines[]` | string[] | 3–6 lines; one contains the fact |
| `reference.keyFact` | string | e.g. `"25 ppm"` — shown in the verdict |
| `reference.keyToken` | string | the exact fact token, no leading space, e.g. `"25"` |
| `question` | string | phrased to point at the reference |
| `factStep` | number | 0-based index into `steps[]` of the fact token |
| `steps[]` | array | each: `grounded[]` (required) and optional `ungrounded[]`, each an array of `{ t: " token", logit: number }` |
| `grounding` | string | one line: how the correct answer is actually assured in practice |
| `notes` | object | `autoregressive`, `embeddings`, `temperature`, `contextWindow`, `hallucination` — short paragraphs shown in the "How this works" drawer |

## Notes on the maths (so your logits behave)

`app.js` computes `p_i = softmax(logit_i / T)` over the top-`k` logits, then either takes the argmax
(*greedy*) or samples with a seeded RNG (*sample*). Rules of thumb for authoring:

- A **~5-logit gap** between first and second ⇒ the top token wins for any temperature ≤ ~1.5 under greedy.
- A **~1–2-logit gap** ⇒ temperature and sampling can flip it — use this on steps you want to feel "alive".
- On the fact step's `ungrounded` set, keep the spread of the top 4–5 within ~1.5 logits so the wrong
  values genuinely compete and re-rolling the seed changes the answer.
