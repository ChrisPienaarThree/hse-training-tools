# -*- coding: utf-8 -*-
"""Build the Lead Incident Investigator live quiz (single offline HTML).

Content lives in content_a.py … content_f.py (Modules 1–21). quiz_template.html is adapted from the
Hadeed PSM PHA/HAZOP live quiz template. Data is mapped to that template's shape:
vol = course part (1 = Modules 1–12, 2 = Modules 13–21), ch = module number.
Answer options are shuffled with a fixed seed so the keys are spread across A–D.
"""
import json, os, random, sys
from collections import Counter

here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
import content_a, content_b, content_c, content_d, content_e, content_f

MODS = []
for m in (content_a, content_b, content_c, content_d, content_e, content_f):
    MODS += m.MODULES
MODS.sort(key=lambda m: m["mod"])

# ---------------- checks
assert [m["mod"] for m in MODS] == list(range(1, 22)), [m["mod"] for m in MODS]
for m in MODS:
    tag = "Module %d" % m["mod"]
    assert len(m["kc"]) == 7, (tag, len(m["kc"]))
    assert len(m["review"]) == 7, (tag, len(m["review"]))
    assert len(m["takeaways"]) >= 5, tag
    assert m["model"], tag
    ex = m["exercise"]
    assert len(ex["steps"]) >= 5 and ex["deliverable"], tag
    for i, (q, opts, ans, note) in enumerate(m["kc"], 1):
        assert len(opts) == 4 and len(set(opts)) == 4, (tag, i)
        assert 0 <= ans < 4 and note, (tag, i)

# ---------------- map to template shape, spreading answer keys
rng = random.Random(2026)
KEEP_ORDER = {(11, 5), (20, 1)}  # numeric option series stay in ascending order
data, notes, keys = [], {}, Counter()
for m in MODS:
    vol = 1 if m["mod"] <= 12 else 2
    kc = []
    for n, (q, opts, ans, note) in enumerate(m["kc"], 1):
        order = list(range(4))
        if (m["mod"], n) not in KEEP_ORDER: rng.shuffle(order)
        new_opts = [opts[i] for i in order]
        new_ans = order.index(ans)
        keys["ABCD"[new_ans]] += 1
        kc.append({"n": n, "q": q, "opts": new_opts, "ans": new_ans})
        notes["v%dc%dq%d" % (vol, m["mod"], n)] = note
    ex = m["exercise"]
    data.append({
        "vol": vol, "ch": m["mod"], "title": m["title"],
        "exercise": {"intro": ex["intro"], "steps": ex["steps"], "deliverable": ex["deliverable"],
                     "scenarios": [{"title": a, "text": b} for a, b in ex["scenarios"]]},
        "review": m["review"], "kc": kc, "model": m["model"], "takeaways": m["takeaways"],
    })

tpl = open(os.path.join(here, "quiz_template.html"), encoding="utf-8").read()
assert tpl.count("/*DATA*/[]") == 1 and tpl.count("/*NOTES*/{}") == 1
dj = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
nj = json.dumps(notes, ensure_ascii=False).replace("</", "<\\/")
out = tpl.replace("/*DATA*/[]", dj).replace("/*NOTES*/{}", nj)
json.dump(data, open(os.path.join(here, "quiz_data.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

OUT = os.path.join(os.path.dirname(here), "Lead_Incident_Investigator_Live_Quiz.html")
open(OUT, "w", encoding="utf-8").write(out)
print("wrote", OUT, len(out.encode("utf-8")) // 1024, "KB")
print(len(data), "modules;", sum(len(c["kc"]) for c in data), "MCQs;", sum(len(c["review"]) for c in data),
      "review questions;", len(data), "workshop briefs; answer keys", dict(sorted(keys.items())))
