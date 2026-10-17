// Generates example files and guide PDFs for the kit. Usage: node make_assets.js <kitDir> <rcaSrc> <tripodSrc> <buildDir> <version>
const fs = require('fs'), path = require('path');
const [kit, rcaSrc, triSrc, here, version] = process.argv.slice(2);
// Tripod Annex 8 example as a case file
const C = require(path.join(triSrc, 'content.js')), R = require(path.join(triSrc, 'rules.js')); R.setNames(t => C.TYPES[t].name);
const X = require(path.join(triSrc, 'export.js'));
const ex = JSON.parse(JSON.stringify(C.EXAMPLE)); X.tidy(ex);
ex.actions.forEach(a => { if (/^\+\d+$/.test(a.due)) { const d = new Date(ex.meta.date + 'T12:00:00'); d.setDate(d.getDate() + +a.due.slice(1)); a.due = d.toISOString().slice(0, 10); } });
ex.updatedAt = new Date().toISOString();
fs.writeFileSync(path.join(kit, 'Examples', 'Example - Vehicle roll-over (Tripod Annex 8).tripod.json'), JSON.stringify({ format: 'tripod-beta-case', version: 1, exportedAt: ex.updatedAt, app: 'Istec Training Tripod Beta Investigator', case: ex }, null, 1));
// RCA example
const RX = require(path.join(rcaSrc, 'example.js'));
const rc = JSON.parse(JSON.stringify(RX)); rc.updatedAt = new Date().toISOString();
fs.writeFileSync(path.join(kit, 'Examples', 'Example - Tank T-101 overfill.rcaft.json'), JSON.stringify(Object.assign(rc, { savedAt: rc.updatedAt, app: 'Istec Training RCA Fault Tree' }), null, 1));
// PDFs
(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage();
  const qg = fs.readFileSync(path.join(here, 'quick_guide.html'), 'utf8').replace('__VERSION__', version);
  await p.setContent(qg, { waitUntil: 'load' });
  await p.pdf({ path: path.join(kit, 'Guides', 'Incident Investigation Toolkit - Quick guide.pdf'), format: 'A4', printBackground: true });
  const G = require(path.join(rcaSrc, 'guide.js'));
  const css = '@page{size:A4;margin:16mm 15mm}body{font:10.5pt/1.55 Arial,Helvetica,sans-serif;color:#141c26}.eyebrow{border-top:8px solid #0f2a4d;padding-top:12px;display:block;font-weight:700;letter-spacing:.16em;text-transform:uppercase;font-size:9pt;color:#1d4ea3}h1{font-size:22pt;color:#0f2a4d;margin:6px 0}h2{font-size:13.5pt;color:#0f2a4d;border-bottom:1.5px solid #0f2a4d;padding-bottom:3px;margin:18px 0 8px;break-after:avoid}ul{padding-left:20px}li{margin:3px 0}code{font-family:Menlo,Consolas,monospace;font-size:9pt;background:#f1f3f6;padding:0 3px}';
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${G}<p style="color:#5b6573;font-size:9pt;margin-top:20px">Istec Training · Incident Investigation Toolkit ${version}</p></body></html>`, { waitUntil: 'load' });
  await p.pdf({ path: path.join(kit, 'Guides', 'RCA Fault Tree - User guide.pdf'), format: 'A4', printBackground: true });
  await b.close();
  console.log('assets ok');
})();
