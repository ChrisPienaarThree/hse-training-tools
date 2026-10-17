#!/usr/bin/env python3
"""Build the RCA Fault Tree (offline single file).

  python3 build.py

Checks syntax and the worked example (no consistency errors), then writes `RCA Fault Tree.html`.
"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'
KIT = ROOT.parent / '_kit_shared' / 'kit.js'
PARTS = [('KIT', KIT), ('LIBRARY', SRC / 'library.js'), ('ENGINE', SRC / 'engine.js'), ('EXAMPLE', SRC / 'example.js'),
         ('EXPORT', SRC / 'export.js'), ('GUIDE', SRC / 'guide.js'), ('APP', SRC / 'app.js')]
CHECK = r"""
const d = process.argv[1]; const E = require(d + '/engine.js'), X = require(d + '/example.js'), R = require(d + '/export.js');
const c = JSON.parse(JSON.stringify(X)); const errs = E.check(c).filter(i => i.sev === 'error');
R.docx(c, null); R.reportHTML(c, E.treeSVG(c)); R.csv(c);
console.log(JSON.stringify({ errs: errs.map(e => e.code + ' ' + e.msg), nodes: Object.keys(c.nodes).length, top: E.fmt(E.evaluate(c, 'prior').top.v, 'f') }));
"""

def main():
    for key, f in PARTS:
        r = subprocess.run(['node', '--check', str(f)], capture_output=True, text=True)
        if r.returncode:
            sys.exit(f'syntax error in {f.name}:\n{r.stderr}')
    res = subprocess.run(['node', '-e', CHECK, str(SRC)], capture_output=True, text=True)
    if res.returncode:
        sys.exit(res.stderr)
    info = json.loads(res.stdout)
    if info['errs']:
        sys.exit('worked example has consistency errors:\n  ' + '\n  '.join(info['errs']))
    print('worked example ok:', info['nodes'], 'nodes, top before evidence', info['top'])
    html = (SRC / 'template.html').read_text()
    for key, f in PARTS:
        marker = '/*' + key + '*/'
        if marker not in html:
            sys.exit('template is missing ' + marker)
        html = html.replace(marker, f.read_text().replace('</script', '<\\/script'))
    out = ROOT / 'RCA Fault Tree.html'
    out.write_text(html)
    print('wrote', out, f'({len(html) / 1e3:.0f} KB)')

if __name__ == '__main__':
    main()
