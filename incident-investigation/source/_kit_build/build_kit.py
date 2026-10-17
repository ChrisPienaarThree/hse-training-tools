#!/usr/bin/env python3
"""Assemble the Incident Investigation Toolkit for a USB stick.

  python3 Source/_kit_build/build_kit.py     (from 'Incident Investigation tools')

Rebuilds the three tools in Source/, then writes  Incident Investigation Toolkit/  and a zip next to Source/.
Never deletes anything inside  My cases/ .
"""
import os, pathlib, shutil, subprocess, sys, zipfile, datetime

BASE = pathlib.Path(__file__).resolve().parent.parent
HERE = BASE / '_kit_build'
OUT_PARENT = BASE.parent          # Incident Investigation tools/ (BASE = its Source/ folder)
KIT = OUT_PARENT / 'Incident Investigation Toolkit'
VERSION = '1.0 (' + datetime.date.today().isoformat() + ')'
APPS = [
    (BASE / 'Casebook Offline', 'Storyline Casebook.html'),
    (BASE / 'Tripod Beta App', 'Tripod Beta Investigator.html'),
    (BASE / 'RCA Fault Tree App', 'RCA Fault Tree.html'),
]

def run(cmd, cwd, env=None):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, env=env)
    if r.returncode:
        sys.exit(f'failed in {cwd}: {" ".join(cmd)}\n{r.stdout}\n{r.stderr}')
    return r.stdout

def main():
    for d, _ in APPS:
        print(run(['python3', 'build.py'], d).strip().splitlines()[-1])
    for sub in ['Tools', 'Examples', 'Guides', 'My cases']:
        (KIT / sub).mkdir(parents=True, exist_ok=True)
    for sub in ['Tools', 'Examples', 'Guides']:          # regenerated folders (My cases is never touched)
        for f in (KIT / sub).iterdir():
            if f.is_file():
                f.unlink()
    for d, name in APPS:
        shutil.copy2(d / name, KIT / 'Tools' / name)
    kitjs = (BASE / '_kit_shared' / 'kit.js').read_text().replace('</script', '<\\/script')
    dash = (HERE / 'dashboard.html').read_text()
    assert '/*KIT*/' in dash
    (KIT / 'START HERE.html').write_text(dash.replace('/*KIT*/', kitjs))
    ex = BASE / 'Casebook Offline' / 'examples'
    for f in ex.glob('*.casebook-ws.json'):
        shutil.copy2(f, KIT / 'Examples' / f.name)
    env = dict(os.environ, NODE_PATH=str(pathlib.Path.home() / 'node_modules'))
    print(run(['node', str(HERE / 'make_assets.js'), str(KIT), str(BASE / 'RCA Fault Tree App' / 'src'), str(BASE / 'Tripod Beta App' / 'src'), str(HERE), VERSION], BASE, env).strip())
    (KIT / 'My cases' / 'README.txt').write_text('Save your investigation files here (Save to file / Save as in each tool).\n'
        'The START HERE dashboard lists the case files in this folder.\n')
    (KIT / 'READ ME FIRST.txt').write_text((HERE / 'readme.txt').read_text().replace('__VERSION__', VERSION))
    mac = KIT / 'Start Toolkit - Mac.command'
    mac.write_text('#!/bin/bash\n# Opens the Incident Investigation Toolkit in Google Chrome or Microsoft Edge (or the default browser)\n'
        'DIR="$(cd "$(dirname "$0")" && pwd)"\n'
        'if [ -d "/Applications/Google Chrome.app" ]; then open -a "Google Chrome" "$DIR/START HERE.html"\n'
        'elif [ -d "/Applications/Microsoft Edge.app" ]; then open -a "Microsoft Edge" "$DIR/START HERE.html"\n'
        'else open "$DIR/START HERE.html"; fi\n')
    mac.chmod(0o755)
    (KIT / 'Start Toolkit - Windows.cmd').write_bytes(('@echo off\r\nrem Opens the Incident Investigation Toolkit in Microsoft Edge\r\n'
        'start "" msedge "%~dp0START HERE.html" || start "" "%~dp0START HERE.html"\r\n').encode())
    z = OUT_PARENT / 'Incident Investigation Toolkit.zip'
    if z.exists():
        z.unlink()
    n = 0
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(KIT.rglob('*')):
            if p.is_file() and not p.name.startswith('.') and not (p.parent.name == 'My cases' and p.name != 'README.txt'):
                info = zipfile.ZipInfo.from_file(p, p.relative_to(OUT_PARENT))
                if p.suffix == '.command':
                    info.external_attr = (0o100755 << 16)
                zf.writestr(info, p.read_bytes(), zipfile.ZIP_DEFLATED); n += 1
    print(f'kit: {KIT}\nzip: {z} ({z.stat().st_size / 1e6:.1f} MB, {n} files)')

if __name__ == '__main__':
    main()
