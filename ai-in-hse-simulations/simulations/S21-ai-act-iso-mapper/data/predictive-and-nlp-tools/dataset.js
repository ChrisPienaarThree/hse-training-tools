/* ============================================================================
   S21 dataset — "predictive-and-nlp-tools"
   Same rule engine (Part A) and filterable reference table (Part B) as
   computer-vision-tools, applied to predictive and text-generation tools
   instead. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S21 = window.HSE_S21 || { scenarios: {} };
window.HSE_S21.scenarios["predictive-and-nlp-tools"] = {
  id: "predictive-and-nlp-tools",
  label: "Predictive & NLP tools",
  context: "Three predictive and text-generation safety tools, screened against the same six-question EU AI Act rule set. Toggle the checkboxes yourself, or load a preset to see how a specific tool typically screens.",
  questions: [
    { id: "q1", category: "prohibited", text: "Does the system use subliminal, manipulative or deceptive techniques capable of materially distorting a person's behaviour in a way likely to cause harm?" },
    { id: "q2", category: "prohibited", text: "Does the system perform real-time remote biometric identification of individuals in publicly accessible spaces for law-enforcement-style purposes?" },
    { id: "q3", category: "prohibited", text: "Does the system infer emotions, or categorise/identify individuals from biometric data, in the workplace?" },
    { id: "q4", category: "high-risk", text: "Is the system used to make or materially inform decisions about recruitment, task allocation, performance evaluation, promotion, or termination of individual workers?" },
    { id: "q5", category: "high-risk", text: "Is the system a safety component of a product already regulated under EU product-safety law (e.g. machinery, PPE), requiring third-party conformity assessment?" },
    { id: "q6", category: "limited-risk", text: "Does the system interact directly with people as a conversational agent, or generate/manipulate content that could be mistaken for human-authored, without disclosing that it is AI?" }
  ],
  presets: [
    { id: "predictive-maintenance", label: "Predictive maintenance model", answers: { q1: false, q2: false, q3: false, q4: false, q5: false, q6: false }, note: "Flags equipment for servicing based on failure risk — it doesn't identify, score or make decisions about individual people, and it isn't itself the safety component of a regulated product, just an input to a maintenance schedule." },
    { id: "generative-docs", label: "Generative documentation assistant", answers: { q1: false, q2: false, q3: false, q4: false, q5: false, q6: true }, note: "Drafts toolbox talks and incident summaries in natural language — anyone reading the output should be told it's AI-drafted, which is exactly the transparency trigger, even though the content itself isn't otherwise regulated." },
    { id: "recruitment-screening", label: "Safety-critical role recruitment screening", answers: { q1: false, q2: false, q3: false, q4: true, q5: false, q6: false }, note: "Screens candidate applications for safety-critical roles — recruitment and selection of workers is one of the Act's own explicit Annex III employment examples." }
  ],
  isoMapping: [
    { clause: "4", title45001: "Context of the organization — OH&S-relevant internal/external issues, workers and interested parties", title42001: "Context of the organization — AI-relevant issues, including impacts on individuals and society", integration: "A combined context review can cover OH&S and AI risk factors in one workshop instead of two." },
    { clause: "5", title45001: "Leadership and worker participation in OH&S decisions", title42001: "Leadership, AI policy and defined AI roles/responsibilities", integration: "Worker consultation required by 45001 is a natural forum to also surface concerns about AI tools deployed in their work." },
    { clause: "6.1.2", title45001: "Hazard identification and OH&S risk assessment", title42001: "AI system risk assessment, including risks to health, safety and fundamental rights", integration: "An AI-assisted safety tool's own risk (bias, failure modes, over-reliance) belongs in the same risk register as the hazard it's meant to help control." },
    { clause: "6.1.4", title45001: "(no direct 45001 equivalent)", title42001: "AI system impact assessment", integration: "For any AI tool used in an HSE workflow, the AI impact assessment (42001) and the hazard risk assessment (45001) should reference each other, not be filed separately." },
    { clause: "7.2", title45001: "Worker/personnel competence for OH&S roles", title42001: "Competence for AI governance, oversight and data-related roles", integration: "HSE staff increasingly need enough AI literacy to review AI-assisted outputs — competence matrices should name this explicitly." },
    { clause: "7.3", title45001: "Worker awareness of hazards and their OH&S role", title42001: "Awareness of AI policy and how to raise AI-related concerns", integration: "Toolbox talks are a ready-made channel to also cover what an AI tool does and doesn't do." },
    { clause: "7.4", title45001: "Internal and external OH&S communication", title42001: "Internal and external AI-related communication", integration: "One communication plan can cover both, rather than parallel comms tracks that never reference each other." },
    { clause: "8.1", title45001: "Operational planning and control — hierarchy of controls", title42001: "Operational controls over the AI system life cycle (Annex A controls)", integration: "An AI-assisted control, like an anomaly detector, is a 'control' in the OH&S sense and an 'AI system' in the 42001 sense — it needs both lenses, not one." },
    { clause: "8.2", title45001: "Emergency preparedness and response", title42001: "(covered via Annex A incident-response controls, no direct numbered clause)", integration: "If an AI-assisted tool sits in the emergency response chain, its failure modes belong in the emergency-preparedness plan, not only in AI system documentation." },
    { clause: "9.1", title45001: "Monitoring, measurement, analysis and OH&S performance evaluation", title42001: "Monitoring AI system performance — accuracy, drift, incidents", integration: "AI-system performance monitoring and safety-performance monitoring should share a dashboard when the AI system's job is itself a safety function." },
    { clause: "9.2", title45001: "Internal audit of the OH&S management system", title42001: "Internal audit of the AI management system", integration: "A combined audit programme can audit an AI-assisted safety tool as part of the same audit that covers the OH&S process it supports." },
    { clause: "10.2", title45001: "Incident investigation, nonconformity and corrective action", title42001: "AI system nonconformity and corrective action, e.g. after a false negative", integration: "A missed hazard caused partly by an AI tool's false negative is both an OH&S incident (45001, 10.2) and an AI nonconformity (42001, 10.2) — one investigation, two clause references." }
  ],
  tierInfo: {
    prohibited: { label: "Prohibited", obligations: "This use is banned outright under the EU AI Act. It cannot be placed on the market or put into service in the EU, regardless of technical safeguards.", penalty: "Up to €35,000,000 or 7% of total worldwide annual turnover, whichever is higher." },
    "high-risk": { label: "High-risk", obligations: "Conformity assessment, a risk management system, data governance, technical documentation, human oversight, accuracy/robustness/cybersecurity testing, post-market monitoring, EU database registration, and (for certain deployers) a fundamental rights impact assessment — all before deployment.", penalty: "Up to €15,000,000 or 3% of total worldwide annual turnover, whichever is higher." },
    "limited-risk": { label: "Limited-risk", obligations: "Transparency obligations — disclose to users that they are interacting with an AI system, or that content is AI-generated or manipulated.", penalty: "Up to €7,500,000 or 1% of total worldwide annual turnover, whichever is higher." },
    "minimal-risk": { label: "Minimal-risk", obligations: "No mandatory obligations under the AI Act itself, though voluntary codes of conduct are encouraged. Other laws — GDPR, product safety, employment law — may still apply.", penalty: "No specific EU AI Act penalty exposure." }
  },
  callouts: {
    ruleEngine: "This is six yes/no questions evaluated in a fixed priority order — prohibited beats high-risk beats limited-risk beats minimal-risk, first match wins. There's no ambiguity in the logic itself; the ambiguity, in practice, is honestly answering the questions.",
    surprise: "The generative documentation assistant surprises most people — it isn't high-risk at all, but the transparency trigger still applies. 'Low regulatory tier' does not mean 'no obligations'.",
    notOmniscient: "This screener only knows what you tell it. A real classification depends on exactly how a system is built and deployed, and on legal advice — this tool is a first-pass triage, not a compliance sign-off.",
    stillMisses: "The classification tells you WHICH obligations apply — it does none of the actual work of satisfying them. A tool correctly flagged as high-risk still needs a genuine conformity assessment, not just an accurate label.",
    humanCall: "Someone still has to decide how to answer each question honestly, especially the borderline ones. Calling a recruitment-screening tool 'just filtering CVs for keywords' does not change what decision it's actually informing."
  },
  notes: {
    what: "Part A: a six-question EU AI Act risk screener with three preset predictive/NLP tools. Part B: a filterable ISO 45001 to ISO 42001 clause-mapping reference table.",
    math: "Classification: evaluate checked questions in priority order prohibited > high-risk > limited-risk > minimal-risk; the first category with any checked question wins. Part B filter: a live case-insensitive substring match across clause number and both titles, recomputed on every keystroke.",
    real: "Authored: the six questions and their categories, the three presets' pre-checked answers, the tier obligations/penalty text, and the ISO mapping table content. Live and real: which tier your checked answers classify into, and which mapping rows match your current filter text."
  }
};
