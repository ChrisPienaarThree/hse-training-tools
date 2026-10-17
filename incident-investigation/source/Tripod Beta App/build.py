#!/usr/bin/env python3
"""Build the Tripod Beta Investigator.

  python3 build.py

Checks the worked example against the tree rules (via node), then writes:
  Tripod Beta Investigator.html   offline single file (USB / LMS / email)
  dist/artifact.html              page body for the claude.ai artifact
"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'

CHECK = r"""
const C = require(process.argv[1] + '/content.js'), R = require(process.argv[1] + '/rules.js');
R.setNames(t => C.TYPES[t].name);
const X = require(process.argv[1] + '/export.js');
const ex = JSON.parse(JSON.stringify(C.EXAMPLE));
const iss = R.check(ex).filter(i => i.sev !== 'tip');
X.tidy(ex); X.treeSVG(ex); X.docx(ex, []); X.casebookPackage(ex); X.drawioXML(ex);
console.log(JSON.stringify({ issues: iss.map(i => i.code + ' ' + i.msg), trios: R.trios(ex).length, nodes: ex.nodes.length }));
"""

def main():
    for f in ['content.js', 'rules.js', 'export.js', 'app.js']:
        r = subprocess.run(['node', '--check', str(SRC / f)], capture_output=True, text=True)
        if r.returncode:
            sys.exit(f'syntax error in {f}:\n{r.stderr}')
    res = subprocess.run(['node', '-e', CHECK, str(SRC)], capture_output=True, text=True)
    if res.returncode:
        sys.exit(res.stderr)
    info = json.loads(res.stdout)
    if info['issues']:
        sys.exit('worked example breaks the rules:\n  ' + '\n  '.join(info['issues']))
    print('worked example ok:', info['trios'], 'trios,', info['nodes'], 'nodes')
    tpl = (SRC / 'template.html').read_text()
    body = tpl
    for key, f in [('CONTENT', 'content.js'), ('RULES', 'rules.js'), ('EXPORT', 'export.js'), ('APP', 'app.js')]:
        body = body.replace('/*' + key + '*/', (SRC / f).read_text().replace('</script', '<\\/script'))
    kit = (ROOT.parent / '_kit_shared' / 'kit.js').read_text().replace('</script', '<\\/script')
    (ROOT / 'dist').mkdir(exist_ok=True)
    (ROOT / 'dist' / 'artifact.html').write_text(body.replace('<script>/*KIT*/</script>\n', ''))
    body = body.replace('/*KIT*/', kit)
    head = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>')
    (ROOT / 'Tripod Beta Investigator.html').write_text(head + body + '</body></html>')
    print('wrote', ROOT / 'Tripod Beta Investigator.html', f'({len(body) / 1e3:.0f} KB)')

if __name__ == '__main__':
    main()
