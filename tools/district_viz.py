"""Draw one district of the campus scene (plot metres) with building ids, names, levels, lawns, paths and trees.
Usage: python tools/district_viz.py cx cy half out.svg"""
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
cx, cy, half, out = float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
s = json.load(open('work/scene.json', encoding='utf-8'))
W = 900; S = W / (2 * half)
P = lambda p: f'{(p[0]-cx+half)*S:.1f},{(cy+half-p[1])*S:.1f}'
def rings(g):
    out = []
    def walk(x):
        if x and isinstance(x[0], list) and x[0] and isinstance(x[0][0], (int, float)): out.append(x); return
        for y in x: walk(y)
    walk(g); return out
el = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {W}" font-family="sans-serif"><rect width="{W}" height="{W}" fill="#f6f2e8"/>']
for lw in s['lawns']:
    for r in rings(lw['r']): el.append(f'<polygon points="{" ".join(P(p) for p in r)}" fill="#cfe0b0"/>')
for k, c in (('roads', '#b8aeb2'), ('paths', '#e0d2b8'), ('water', '#9cc3c4')):
    for r in rings(s[k]): el.append(f'<polygon points="{" ".join(P(p) for p in r)}" fill="{c}" fill-rule="evenodd" stroke="#998" stroke-width=".3"/>')
for t in s['trees']: el.append(f'<circle cx="{(t[0]-cx+half)*S:.1f}" cy="{(cy+half-t[1])*S:.1f}" r="2" fill="#5a8a50"/>')
for b in s['buildings']:
    c = b['obb']['c']
    if abs(c[0] - cx) > half * 1.3 or abs(c[1] - cy) > half * 1.3: continue
    for r in rings(b.get('ring', [])): el.append(f'<polygon points="{" ".join(P(p) for p in r)}" fill="{"#e3b04b" if b.get("famous") else "#d8d0c4"}" stroke="#333" stroke-width=".6"/>')
    el.append(f'<text x="{(c[0]-cx+half)*S:.0f}" y="{(cy+half-c[1])*S:.0f}" font-size="10" text-anchor="middle">{b["id"]} {b.get("n","")} {b.get("lv","")}</text>')
for p in s.get('pois', []):
    if abs(p['x'] - cx) < half and abs(p['y'] - cy) < half:
        el.append(f'<circle cx="{(p["x"]-cx+half)*S:.1f}" cy="{(cy+half-p["y"])*S:.1f}" r="3" fill="#c0392b"/><text x="{(p["x"]-cx+half)*S+4:.0f}" y="{(cy+half-p["y"])*S:.0f}" font-size="9" fill="#c0392b">{p["name"]}</text>')
for v in range(int(cx - half) // 20 * 20, int(cx + half) + 1, 20): el.append(f'<text x="{(v-cx+half)*S:.0f}" y="{W-3}" font-size="9">{v}</text>')
for v in range(int(cy - half) // 20 * 20, int(cy + half) + 1, 20): el.append(f'<text x="2" y="{(cy+half-v)*S:.0f}" font-size="9">{v}</text>')
el.append('</svg>')
open(out, 'w', encoding='utf-8').write('\n'.join(el))
