/* ============================================================================
   S5 — scenario manifest
   Ordered list for the scenario picker. Add one: copy data/_TEMPLATE to
   data/<id>, fill it in, add a <script src> line in index.html, add a row here.
   ============================================================================ */
window.HSE_S5 = window.HSE_S5 || { scenarios: {} };
window.HSE_S5.manifest = [
  { id: "warehouse-aisle",  label: "Warehouse aisle — PPE, forklift proximity, dock-edge zone" },
  { id: "steel-erection",   label: "Steel erection — harness at height, edge-gap zone" }
];
