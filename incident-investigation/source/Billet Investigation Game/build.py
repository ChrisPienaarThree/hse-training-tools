#!/usr/bin/env python3
"""Build The Falling Billet game.

  python3 build.py

Validates src/content.js (via node), embeds photos/*.jpg and writes:
  The Falling Billet.html        offline single file (USB / LMS / email)
  dist/artifact.html             page body for the claude.ai artifact
"""
import base64, json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'

CHECK = r"""
const G = require(process.argv[1]);
const errs = [], warn = [];
const F = G.facts, has = id => !!F[id];
const src = {};
const add = (f, s) => { if (!has(f)) errs.push('unknown fact ' + f + ' in ' + s); (src[f] = src[f] || []).push(s); };
for (const w in G.interviews) { if (!G.people[w]) errs.push('no person ' + w); G.interviews[w].qs.forEach((q, i) => (q.facts || []).forEach(f => add(f, 'iv:' + w))); }
for (const d in G.docs) G.docs[d].obs.forEach(o => { if (o.fact) add(o.fact, 'doc:' + d); });
for (const k in G.site) { const s = G.site[k]; [s, s.good, s.poor, s.ok, s.held, s.free, s.early].forEach(o => o && (o.facts || []).forEach(f => add(f, 'site:' + k))); [s, s.good, s.poor, s.ok, s.early].forEach(o => o && (o.photos || []).forEach(p => { if (!G.photos[p]) errs.push('no photo ' + p); })); }
G.actions.forEach(a => { if (a.doc && !G.docs[a.doc]) errs.push('action doc ' + a.doc); if (a.who && !G.interviews[a.who]) errs.push('action who ' + a.who); if (a.kind === 'site' && !G.site[a.id]) errs.push('site ' + a.id); });
G.whys.forEach(w => w.levels.forEach(l => l.opts.forEach(o => (o.needs || []).concat(o.contra || []).forEach(f => { if (!has(f)) errs.push('why fact ' + f); }))));
for (const f in F) { const d = F[f]; if (d.kind === 'condition') (d.attach || []).forEach(a => { if (a !== 'G' && !has(a)) errs.push('attach ' + f + '->' + a); });
  d.icam.forEach(c => { if (c !== 'NONE' && !Object.values(G.icamCodes).some(g => g.codes[c])) errs.push('icam code ' + c + ' on ' + f); });
  if (!src[f]) (d.key ? errs : warn).push('no source for ' + (d.key ? 'KEY ' : '') + f); }
const key = Object.keys(F).filter(f => F[f].key);
console.log(JSON.stringify({ errs, warn, facts: Object.keys(F).length, key: key.length, actions: G.actions.length,
  questions: Object.values(G.interviews).reduce((a, i) => a + i.qs.length, 0), docs: Object.keys(G.docs).length,
  hours: G.actions.reduce((a, x) => a + x.cost, 0) }));
"""

def main():
    res = subprocess.run(['node', '-e', CHECK, str(SRC / 'content.js')], capture_output=True, text=True)
    if res.returncode:
        sys.exit(res.stderr)
    info = json.loads(res.stdout)
    for w in info['warn']:
        print('warning:', w)
    if info['errs']:
        sys.exit('content errors:\n  ' + '\n  '.join(info['errs']))
    print('content ok:', {k: v for k, v in info.items() if k not in ('errs', 'warn')})

    photos = {p.stem: 'data:image/jpeg;base64,' + base64.b64encode(p.read_bytes()).decode()
              for p in sorted((ROOT / 'photos').glob('p*.jpg'))}
    tpl = (SRC / 'template.html').read_text()
    body = (tpl.replace('/*CONTENT*/', (SRC / 'content.js').read_text())
               .replace('/*PHOTOS*/', 'GAME.photoData = ' + json.dumps(photos) + ';')
               .replace('/*APP*/', (SRC / 'app.js').read_text()))
    (ROOT / 'dist').mkdir(exist_ok=True)
    (ROOT / 'dist' / 'artifact.html').write_text(body)
    head = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>')
    (ROOT / 'The Falling Billet.html').write_text(head + body + '</body></html>')
    print('wrote', ROOT / 'The Falling Billet.html', f'({len(body) / 1e6:.2f} MB)')

if __name__ == '__main__':
    main()
