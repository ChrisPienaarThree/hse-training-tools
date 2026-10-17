/* ============================================================================
   S2 dataset TEMPLATE  —  copy this folder to data/<your-scenario-id>/

   The idea: the model is asked for ONE specific fact that appears in a
   reference block. With the reference inside the context window and a low
   temperature, decoding copies the correct value. Push the
   reference out of the window (shrink the context slider) OR raise the
   temperature, and the model emits a plausible WRONG value with the same
   confidence. That contrast is the whole lesson (Day 1, Topic 2a).

   RULES
   - Everything is PRE-AUTHORED. No model runs. app.js does real softmax /
     temperature / sampling maths on the `logit` values you write here.
   - `steps[i].grounded` = candidate next tokens when the reference is fully in
     the context window. `steps[i].ungrounded` = candidates when it has been
     evicted. Only the fact-bearing step really needs `ungrounded`; other steps
     fall back to `grounded`.
   - Author `grounded` so the highest logit at each step spells a correct,
     fluent sentence that ends with the key fact.
   - Author the fact step's `ungrounded` so the key token is present but NOT
     dominant — the point is "the right answer is still in there, just not
     favoured any more".
   - Token strings usually start with a leading space (" word"); punctuation
     tokens do not (".", ","). app.js shows a leading space as a small dot.

   AFTER FILLING IN
   1. add  <script src="data/<your-id>/dataset.js"></script>  to index.html
   2. add  { id: "<your-id>", label: "..." }  to data/manifest.js
   ============================================================================ */
window.HSE_S2 = window.HSE_S2 || { scenarios: {} };
window.HSE_S2.scenarios["TEMPLATE-ID"] = {

  id: "TEMPLATE-ID",
  label: "TODO — short label for the scenario picker",

  system: "TODO — a one-line instruction: answer only from the reference; say you don't know otherwise.",

  reference: {
    title: "TODO — source name + [FICTIONAL, for demonstration only]",
    lines: [
      "TODO — a few lines of reference text.",
      "TODO — one line MUST contain the fact, e.g. '... maximum of 12 hours ...'.",
      "TODO — include a near-miss distractor value if natural (a STEL next to a TWA, etc.)."
    ],
    keyFact: "TODO e.g. 12 hours",      // shown in the verdict
    keyToken: "TODO e.g. 12"            // the exact token (without leading space) the fact step should emit
  },

  question: "TODO — the question, phrased to point at the reference.",

  factStep: 0,   // index into steps[] of the fact-bearing token (0-based)

  steps: [
    /* ordinary step: only `grounded` needed */
    { grounded: [
        { t: " The", logit: 8.0 }, { t: " According", logit: 6.5 }, { t: " Based", logit: 6.0 },
        { t: " Per", logit: 5.0 }, { t: " It", logit: 3.5 } ] },

    /* ...more ordinary steps building the sentence... */

    /* FACT-BEARING step: both arrays, key token dominant only when grounded */
    { grounded: [
        { t: " 12", logit: 9.2 }, { t: " one", logit: 4.6 }, { t: " 8", logit: 2.6 },
        { t: " 24", logit: 2.1 } ],
      ungrounded: [
        { t: " 24", logit: 5.2 }, { t: " 48", logit: 4.8 }, { t: " 12", logit: 4.4 },
        { t: " 72", logit: 4.1 }, { t: " 8", logit: 3.7 } ] },

    /* trailing steps: units, full stop, etc. */
    { grounded: [ { t: " hours", logit: 9.0 }, { t: " hour", logit: 3.0 } ] },
    { grounded: [ { t: ".", logit: 8.8 }, { t: ",", logit: 3.0 } ] }
  ],

  grounding: "TODO — one line: how the correct answer is actually assured (retrieval, low temperature, require a citation, human check).",

  notes: {
    autoregressive: "TODO — one token at a time, fed back in; no plan, no fact store.",
    embeddings: "TODO — tokens become vectors; related meanings placed near each other in training.",
    temperature: "TODO — divides logits before softmax; low = sharp/faithful, high = flat/inventive.",
    contextWindow: "TODO — evict the reference and the fact is simply unavailable; the model guesses.",
    hallucination: "Independent testing: ~3–5% of factual claims confidently wrong for mainstream content, up to ~27% for niche topics; no signal which."
  }
};
