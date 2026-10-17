/* ============================================================================
   S7 — scenario manifest
   Ordered list for the scenario picker. Add one: copy data/_TEMPLATE to
   data/<id>, fill it in, add a <script src> line in index.html, add a row here.
   ============================================================================ */
window.HSE_S7 = window.HSE_S7 || { scenarios: {} };
window.HSE_S7.manifest = [
  { id: "distribution-centre",  label: "Distribution centre — predicted 30-day recordable risk" },
  { id: "construction-project", label: "Construction project — predicted 30-day recordable risk" }
];
