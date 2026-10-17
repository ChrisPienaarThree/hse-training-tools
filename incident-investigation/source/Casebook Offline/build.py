#!/usr/bin/env python3
"""Build the offline Storyline Casebook for the Incident Investigation Toolkit.

  python3 build.py

Reads the master artifact page (Storyline Casebook/storyline-casebook.html in a parent folder, never modified),
inlines pako, injects the shared kit helpers + a local runtime shim (file-backed db, downloads,
permissions) and the workspace file bar, rewords text that describes the claude.ai shared store,
and writes  Storyline Casebook.html  (complete offline document).
Every replacement must match exactly once, otherwise the build stops.
"""
import pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent
MASTER = next((d / 'Storyline Casebook' / 'storyline-casebook.html' for d in ROOT.parents if (d / 'Storyline Casebook' / 'storyline-casebook.html').exists()), None)
if MASTER is None:
    raise SystemExit('cannot find Storyline Casebook/storyline-casebook.html in any parent folder')
KIT = ROOT.parent / '_kit_shared' / 'kit.js'
OUT = ROOT / 'Storyline Casebook.html'

PAKO_TAG = '<script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js"></script>'

# (old, new) — wording for an offline, single-computer workspace
TEXT = [
    ("'Shared case store connected'", "'Cases are kept in this browser and, once saved, in the workspace file on your USB stick'"),
    ("'● Connected — shared with your team'", "'● Offline workspace'"),
    ('Every case here is a live, shared record — your whole investigation team sees updates as they happen.',
     'Every case here is kept in this offline workspace. Use Save to file (bottom right) to keep it on your USB stick and take it to another computer.'),
    ("actions — from the shared database. You'll get", "actions — from this workspace. You'll get"),
    ("' in the shared casebook'", "' in this workspace'"),
    ("in the shared record, then apply.", "in this case record, then apply."),
    ("No data connection — open the Casebook from its claude.ai link to import a case.", "The workspace is not ready yet — reload the page and try again."),
]
TEXT_ALL = [
    ('A live analytical rollup across every investigation in the shared casebook', 'A live analytical rollup across every investigation in this workspace', 3),
]

def js(p):
    s = p.read_text()
    r = subprocess.run(['node', '--check', str(p)], capture_output=True, text=True)
    if r.returncode:
        sys.exit(f'syntax error in {p.name}:\n{r.stderr}')
    return s.replace('</script', '<\\/script')

def main():
    src = MASTER.read_text()
    for old, new in TEXT:
        n = src.count(old)
        if n != 1:
            sys.exit(f'replacement target found {n} times (expected 1): {old[:70]}')
        src = src.replace(old, new)
    for old, new, want in TEXT_ALL:
        n = src.count(old)
        if n != want:
            sys.exit(f'replacement target found {n} times (expected {want}): {old[:70]}')
        src = src.replace(old, new)
    if src.count(PAKO_TAG) != 1:
        sys.exit('pako <script src> tag not found exactly once')
    if src.count('const HAS_CLAUDE_RUNTIME') != 1:
        sys.exit('HAS_CLAUDE_RUNTIME marker not found')
    pako = (ROOT / 'vendor' / 'pako.min.js').read_text().replace('</script', '<\\/script')
    inject = (f'<script>{pako}</script>\n'
              f'<script>{js(KIT)}</script>\n'
              f'<script>{js(ROOT / "src" / "offline_shim.js")}</script>')
    src = src.replace(PAKO_TAG, inject)
    if 'cdnjs.cloudflare.com' in src:
        sys.exit('a CDN script reference is left in the page')
    body = src.rstrip() + f'\n<script>{js(ROOT / "src" / "filebar.js")}</script>\n'
    head = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>')
    OUT.write_text(head + body + '</body></html>')
    print('wrote', OUT, f'({OUT.stat().st_size / 1e3:.0f} KB)')

if __name__ == '__main__':
    main()
