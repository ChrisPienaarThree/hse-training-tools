/* ============================================================================
   S6 — scenario manifest
   Ordered list for the scenario picker. Add one: copy data/_TEMPLATE to
   data/<id>, fill it in, add a <script src> line in index.html, add a row here.
   ============================================================================ */
window.HSE_S6 = window.HSE_S6 || { scenarios: {} };
window.HSE_S6.manifest = [
  { id: "warehouse-carton-lift", label: "Warehouse — lifting a carton from a pallet" },
  { id: "patient-reposition",    label: "Healthcare — repositioning a patient up the bed" }
];
