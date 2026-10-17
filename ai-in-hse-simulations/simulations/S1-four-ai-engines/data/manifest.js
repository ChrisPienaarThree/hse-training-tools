/* ============================================================================
   S1 — scenario manifest
   Lists the datasets the demo offers in its scenario picker, in order.
   To add a scenario: copy data/_TEMPLATE to data/<your-id>, fill it in,
   add a <script src> line for it in index.html, and add a row here.
   ============================================================================ */
window.HSE_S1 = window.HSE_S1 || { scenarios: {} };
window.HSE_S1.manifest = [
  { id: "warehouse-fall",      label: "Warehouse — fall from height (near-miss)" },
  { id: "forklift-pedestrian", label: "Yard — forklift / pedestrian near-miss" }
];
