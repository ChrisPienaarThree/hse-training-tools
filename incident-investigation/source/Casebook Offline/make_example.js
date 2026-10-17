// Builds examples/Example - Vehicle roll-over (Tripod Annex 8).casebook-ws.json
//   node make_example.js        (run python3 build.py first)
// 1. the Tripod Beta app turns its Annex 8 worked example into a Storyline Casebook case package
// 2. the package is imported through the offline Casebook's own "Import Case Package" button (real Chrome)
// 3. the resulting workspace is written out in the workspace file format
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const TB = path.resolve(__dirname, '../Tripod Beta App/src');
const C = require(TB + '/content.js'), R = require(TB + '/rules.js'); R.setNames(t => C.TYPES[t].name);
const X = require(TB + '/export.js');
const ex = JSON.parse(JSON.stringify(C.EXAMPLE)); X.tidy(ex);
ex.actions.forEach(a => { if (/^\+\d+$/.test(a.due)) { const d = new Date(ex.meta.date + 'T12:00:00'); d.setDate(d.getDate() + +a.due.slice(1)); a.due = d.toISOString().slice(0, 10); } });
const pkg = X.casebookPackage(ex);
fs.mkdirSync(path.join(__dirname, 'examples'), { recursive: true });
const pkgFile = path.join(__dirname, 'examples', 'Example - Vehicle roll-over (Tripod Annex 8).casebook-case.json');
fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 1));
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'Storyline Casebook.html'));
  await p.waitForFunction(() => window.CBO_WORKSPACE && document.getElementById('cbo-bar'));
  await p.click('[data-nav-home=caselist]');
  await p.setInputFiles('#import-case-input', pkgFile);
  await p.waitForFunction(() => window.CBO_WORKSPACE.cases().length === 1 && window.CBO_WORKSPACE.sub(window.CBO_WORKSPACE.cases()[0].id, 'correctiveActions').length > 0, null, { timeout: 20000 });
  await p.waitForTimeout(1500);
  const ws = await p.evaluate(() => window.CBO_WORKSPACE.toJSON());
  const out = path.join(__dirname, 'examples', 'Example - Vehicle roll-over (Tripod Annex 8).casebook-ws.json');
  fs.writeFileSync(out, JSON.stringify(ws));
  const counts = {}; Object.keys(ws.docs).forEach(k => { const s = k.split('/'); const key = s.length === 2 ? 'case' : s[2]; counts[key] = (counts[key] || 0) + 1; });
  console.log('wrote', out, counts, errs.length ? errs : 'no page errors');
  await b.close();
})();
