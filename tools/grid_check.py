"""Split the 800 m plot into an n x n grid (same turn) and list famous buildings that a grid line would cut,
plus how many buildings fall in each tile. Usage: python work/grid_check.py 4"""
import json, math, sys
sys.stdout.reconfigure(encoding='utf-8')
n = int(sys.argv[1]) if len(sys.argv) > 1 else 4
d = json.load(open('work/osm.json', encoding='utf-8')); p = json.load(open('work/plot.json', encoding='utf-8'))
C = (p['lat'], p['lon']); ky = 111320; kx = ky * math.cos(math.radians(C[0])); a = math.radians(p['rotation']); H = p['size'] / 2
def uv(la, lo):
    x, y = (lo - C[1]) * kx, (la - C[0]) * ky
    return x * math.cos(a) + y * math.sin(a), -x * math.sin(a) + y * math.cos(a)
nodes = {e['id']: (e['lat'], e['lon']) for e in d['elements'] if e['type'] == 'node' and 'lat' in e}
step = 2 * H / n; lines = [-H + step * k for k in range(1, n)]
tile = lambda u, v: (min(n - 1, max(0, int((u + H) // step))), min(n - 1, max(0, int((v + H) // step))))
counts = {}; cut = []
for e in d['elements']:
    t = e.get('tags', {})
    if e['type'] != 'way' or 'building' not in t: continue
    g = [uv(*nodes[k]) for k in e.get('nodes', []) if k in nodes] or [uv(q['lat'], q['lon']) for q in e.get('geometry', [])]
    if not g: continue
    us = [q[0] for q in g]; vs = [q[1] for q in g]
    if max(us) < -H or min(us) > H or max(vs) < -H or min(vs) > H: continue
    cu, cv = sum(us) / len(us), sum(vs) / len(vs); k = tile(cu, cv); counts[k] = counts.get(k, 0) + 1
    fam = any(x in t for x in ('wikidata', 'wikipedia', 'heritage', 'historic')) or t.get('amenity') == 'place_of_worship' or t.get('tourism') in ('museum', 'attraction')
    hit = [f'u={L:.0f}' for L in lines if min(us) < L < max(us)] + [f'v={L:.0f}' for L in lines if min(vs) < L < max(vs)]
    if fam and hit: cut.append((t.get('name', e['id']), hit))
print(f'{n}x{n} tiles of {step:.0f} m')
for vy in range(n - 1, -1, -1): print('  '.join(f'{counts.get((ux, vy), 0):4d}' for ux in range(n)))
print('famous buildings on a grid line:', len(cut))
for nm, h in cut: print('  ', nm, h)
