/* ============================================================================
   S2 dataset — "permit-validity"
   The model is asked for the maximum validity of a hot-work permit, a value
   stated in a reference procedure extract. Reference in context + low
   temperature -> it copies "12 hours". Evict the reference or raise the
   temperature -> it invents "24 hours" / "72 hours" and states it confidently.

   Pre-authored. No model runs. Shape: ../_TEMPLATE/dataset.js.
   ============================================================================ */
window.HSE_S2 = window.HSE_S2 || { scenarios: {} };
window.HSE_S2.scenarios["permit-validity"] = {

  id: "permit-validity",
  label: "Hot-work permit validity from a procedure",

  system: "You are a permit-to-work assistant. Answer the question using ONLY the reference text. If the reference does not contain the answer, say you do not know.",

  reference: {
    title: "Permit-to-Work Procedure PTW-03 (extract)   [FICTIONAL procedure, for demonstration only]",
    lines: [
      "4.2  Hot Work Permits.",
      "A hot work permit is valid for a maximum of one work shift and in no case longer than 12 hours.",
      "On expiry the permit must be closed and a new permit raised and re-authorised by the Area Authority.",
      "4.3  Confined Space Entry Permits — see separate section (not reproduced here)."
    ],
    keyFact: "12 hours",
    keyToken: "12"
  },

  question: "Per procedure PTW-03, what is the maximum validity period of a hot work permit?",

  factStep: 10,
  steps: [
    { grounded: [
        { t: " A", logit: 8.0 }, { t: " According", logit: 6.4 }, { t: " Per", logit: 6.0 },
        { t: " Hot", logit: 5.5 }, { t: " The", logit: 5.2 }, { t: " 12", logit: 3.0 } ] },
    { grounded: [
        { t: " hot", logit: 8.3 }, { t: " permit", logit: 5.0 }, { t: " work", logit: 4.0 },
        { t: " Hot", logit: 3.3 } ] },
    { grounded: [
        { t: " work", logit: 8.6 }, { t: " permit", logit: 4.2 }, { t: " -", logit: 2.5 } ] },
    { grounded: [
        { t: " permit", logit: 8.8 }, { t: " permits", logit: 3.6 }, { t: " is", logit: 3.0 } ] },
    { grounded: [
        { t: " is", logit: 8.4 }, { t: " may", logit: 5.0 }, { t: " remains", logit: 4.6 },
        { t: " shall", logit: 4.1 } ] },
    { grounded: [
        { t: " valid", logit: 8.7 }, { t: " authorised", logit: 4.1 }, { t: " issued", logit: 3.8 },
        { t: " in", logit: 3.0 } ] },
    { grounded: [
        { t: " for", logit: 8.9 }, { t: " until", logit: 4.6 }, { t: " only", logit: 3.4 } ] },
    { grounded: [
        { t: " a", logit: 7.8 }, { t: " up", logit: 6.9 }, { t: " one", logit: 6.0 },
        { t: " the", logit: 4.9 }, { t: " no", logit: 3.6 } ] },
    { grounded: [
        { t: " maximum", logit: 8.0 }, { t: " period", logit: 4.4 }, { t: " total", logit: 3.5 } ] },
    { grounded: [
        { t: " of", logit: 9.0 }, { t: " duration", logit: 3.0 } ] },

    /* FACT-BEARING STEP */
    { grounded: [
        { t: " 12", logit: 9.1 }, { t: " one", logit: 5.0 }, { t: " 8", logit: 2.6 },
        { t: " 24", logit: 2.2 }, { t: " 48", logit: 1.8 } ],
      ungrounded: [
        { t: " 24", logit: 5.2 }, { t: " 48", logit: 4.9 }, { t: " 72", logit: 4.6 },
        { t: " 12", logit: 4.4 }, { t: " 8", logit: 4.0 }, { t: " seven", logit: 3.5 } ] },

    { grounded: [
        { t: " hours", logit: 9.0 }, { t: " hour", logit: 3.2 }, { t: " h", logit: 2.3 } ] },
    { grounded: [
        { t: ".", logit: 8.8 }, { t: ",", logit: 3.4 }, { t: " and", logit: 2.9 },
        { t: " per", logit: 2.4 } ] }
  ],

  grounding: "Keep the procedure text in the prompt, keep temperature low, and require the model to quote the clause it is relying on so the answer can be verified against the controlled document.",

  notes: {
    autoregressive: "One token at a time, each appended to the model's own input before the next is predicted. There is no lookup step and no fact database — only next-token prediction.",
    embeddings: "Every token becomes a vector first. Related ideas — 'valid', 'expiry', 'duration' — were placed near each other during training. The model computes over these vectors.",
    temperature: "Temperature divides the logits before the softmax: low = sharp (top token wins, copies the source), high = flat (rare tokens become viable, the model improvises).",
    contextWindow: "Evict the procedure extract from the context window and '12 hours' is no longer visible. The model then emits whatever permit duration is most typical in its training — often '24 hours' — with exactly the same confidence.",
    hallucination: "Confidently-wrong output runs ~3–5% for mainstream content and up to ~27% for niche topics in independent testing. The text gives no signal about which claims are the wrong ones."
  }
};
