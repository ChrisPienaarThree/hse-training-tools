/* ============================================================================
   S2 dataset — "exposure-limit"
   The model is asked for an 8-hour TWA exposure limit that appears in a
   reference SDS extract. With the reference in context and a low temperature
   it copies the correct value. Evict the reference (shrink the context
   window) or raise the temperature and it invents a plausible wrong number.

   EVERYTHING here is PRE-AUTHORED. No model runs. The softmax / temperature /
   sampling maths in app.js is real; the logits below are authored so the demo
   teaches the mechanism. Shape is documented in ../_TEMPLATE/dataset.js.
   ============================================================================ */
window.HSE_S2 = window.HSE_S2 || { scenarios: {} };
window.HSE_S2.scenarios["exposure-limit"] = {

  id: "exposure-limit",
  label: "Exposure limit from an SDS extract",

  system: "You are an occupational-hygiene assistant. Answer the question using ONLY the reference text. If the reference does not contain the answer, say you do not know.",

  reference: {
    title: "Safety Data Sheet (extract) — Solvent B-12   [FICTIONAL substance, for demonstration only]",
    lines: [
      "Product: Solvent B-12 (fictional demonstration substance — not a real chemical).",
      "Section 8 — Exposure controls / personal protection.",
      "Occupational exposure limit, 8-hour TWA: 25 ppm.",
      "Short-term exposure limit, 15 minutes: 40 ppm.",
      "Engineering controls: local exhaust ventilation required when handling open quantities."
    ],
    keyFact: "25 ppm",
    keyToken: "25"
  },

  question: "According to the SDS, what is the 8-hour TWA exposure limit for Solvent B-12?",

  /* One entry per generated position. `grounded` = candidates when the
     reference is fully inside the context window; `ungrounded` = candidates
     when it has been evicted. Non-fact steps use `grounded` in both cases. */
  factStep: 5,
  steps: [
    { grounded: [
        { t: " The", logit: 8.0 }, { t: " According", logit: 6.9 }, { t: " Based", logit: 6.4 },
        { t: " Per", logit: 5.1 }, { t: " 25", logit: 3.8 }, { t: " It", logit: 3.5 },
        { t: " SDS", logit: 2.6 }, { t: " I", logit: 2.0 } ] },
    { grounded: [
        { t: " 8-hour", logit: 7.6 }, { t: " exposure", logit: 7.0 }, { t: " TWA", logit: 6.1 },
        { t: " limit", logit: 5.4 }, { t: " occupational", logit: 4.7 }, { t: " short", logit: 3.1 },
        { t: " reference", logit: 2.5 }, { t: " answer", logit: 1.9 } ] },
    { grounded: [
        { t: " TWA", logit: 7.9 }, { t: " limit", logit: 6.8 }, { t: " exposure", logit: 6.3 },
        { t: " time", logit: 4.4 }, { t: " average", logit: 3.7 }, { t: " period", logit: 2.9 } ] },
    { grounded: [
        { t: " limit", logit: 8.2 }, { t: " exposure", logit: 5.3 }, { t: " value", logit: 4.6 },
        { t: " for", logit: 3.9 }, { t: " is", logit: 3.4 } ] },
    { grounded: [
        { t: " is", logit: 8.6 }, { t: " for", logit: 5.9 }, { t: " equals", logit: 4.3 },
        { t: " =", logit: 3.6 }, { t: " stands", logit: 2.4 } ] },

    /* FACT-BEARING STEP */
    { grounded: [
        { t: " 25", logit: 9.4 }, { t: " 40", logit: 3.6 }, { t: " 20", logit: 2.9 },
        { t: " 50", logit: 2.3 }, { t: " 10", logit: 1.9 }, { t: " several", logit: 1.3 } ],
      ungrounded: [
        { t: " 50", logit: 5.1 }, { t: " 100", logit: 4.8 }, { t: " 25", logit: 4.5 },
        { t: " 20", logit: 4.2 }, { t: " 200", logit: 3.8 }, { t: " 10", logit: 3.5 } ] },

    { grounded: [
        { t: " ppm", logit: 9.0 }, { t: " parts", logit: 3.0 }, { t: " mg", logit: 2.5 },
        { t: " milligrams", logit: 1.6 } ] },
    { grounded: [
        { t: ".", logit: 8.8 }, { t: " (", logit: 3.0 }, { t: " as", logit: 2.3 },
        { t: " according", logit: 1.9 } ] }
  ],

  /* how the correct answer would actually be assured in practice */
  grounding: "Keep the source text in the prompt (retrieval-augmented), keep temperature low for factual work, and require the answer to quote or cite the reference so a human can check it.",

  notes: {
    autoregressive: "The model has no plan and no memory of intent. It predicts one token, appends it to its own input, and predicts again. Every word you see was chosen as 'the most likely next piece of text', not retrieved from a fact store.",
    embeddings: "Before any prediction, each token becomes a vector. Training pulled related meanings close together, so 'limit', 'threshold' and 'TWA' sit near each other. The model does arithmetic on these vectors — it is not looking anything up.",
    temperature: "Temperature divides the logits before the softmax. Low temperature sharpens the distribution (the top token dominates — safe, repetitive, copies context). High temperature flattens it (unlikely tokens become viable — fluent, 'creative', and free to invent).",
    contextWindow: "The model can only attend to tokens inside its context window. Push the reference out of the window and the value '25 ppm' is simply not available — so the model falls back to whatever number is most plausible-sounding. That is the mechanical origin of a confident wrong answer.",
    hallucination: "Independent testing puts confidently-wrong statements at roughly 3–5% of factual claims for mainstream content, and up to ~27% for niche or sparsely-documented topics. Nothing in the output marks which ones."
  }
};
