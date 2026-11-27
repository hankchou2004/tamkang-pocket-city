"""Thin the illustrative trees prep.py scattered over the campus lawns: keep them off paths, off the 宮燈大道 band,
clear of building walls (roofs overhang), and at about half the density elsewhere. Mapped trees: none here."""
import json, math, random
s = json.load(open('work/scene.json', encoding='utf-8'))
random.seed(7)

def inside(p, r):
    x, y = p; c = False
    for i in range(len(r)):
        a, b = r[i], r[i - 1]
        if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]: c = not c
    return c

def polys(g):
    out = []
    def walk(x):
        if x and isinstance(x[0], list) and x[0] and isinstance(x[0][0], list) and x[0][0] and isinstance(x[0][0][0], (int, float)):
            out.append(x); return
        for y in x: walk(y)
    walk(g); return out

def seg_d(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]; l = dx * dx + dy * dy or 1
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l))
    return math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t)

paths = [pl for k in ('paths', 'roads') for g in s[k] for pl in polys(g)]
rings = [b['ring'] for b in s['buildings']]
def on_path(p): return any(inside(p, pl[0]) and not any(inside(p, h) for h in pl[1:]) for pl in paths)
def near_bldg(p, d):
    return any(inside(p, r) or min(seg_d(p, r[i - 1], r[i]) for i in range(len(r))) < d for r in rings)

T = json.load(open('work/transform-gongdeng.json')); _c, _s = math.cos(math.radians(T['theta_deg'])), math.sin(math.radians(T['theta_deg']))
def to_old(p):
    x, y = p[0] - T['tx'], p[1] - T['ty']; return (_c * x + _s * y, -_s * x + _c * y)
kept = []
for t in s['trees']:
    p = (t[0], t[1])
    o = to_old(p)
    if 22 < o[1] < 50 and -100 < o[0] < 100: continue   # the 宮燈大道 and its beds (old plot frame)
    if on_path(p) or near_bldg(p, 3.2): continue
    if random.random() > 0.55: continue
    kept.append(t)
print('trees', len(s['trees']), '->', len(kept))
s['trees'] = kept
json.dump(s, open('work/scene.json', 'w', encoding='utf-8'), ensure_ascii=False)

