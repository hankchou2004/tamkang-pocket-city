"""Draw the OSM campus boundary, buildings (famous in gold), and candidate squares in metres around the campus centre."""
import json, math, sys
sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open('work/osm.json', encoding='utf-8'))
bnd = json.load(open('work/campus-boundary.json'))
C = (25.17506, 121.44988); ky = 111320; kx = ky * math.cos(math.radians(C[0]))
m = lambda la, lo: ((lo - C[1]) * kx, (la - C[0]) * ky)
nodes = {e['id']: (e['lat'], e['lon']) for e in d['elements'] if e['type'] == 'node' and 'lat' in e}
def geom(e):
    if 'geometry' in e: return [m(p['lat'], p['lon']) for p in e['geometry']]
    return [m(*nodes[n]) for n in e.get('nodes', []) if n in nodes]
S, O = 0.75, 450
P = lambda p: f'{O + p[0]*S:.1f},{O - p[1]*S:.1f}'
el = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" font-family="sans-serif"><rect width="900" height="900" fill="#f6f2e8"/>']
for e in d['elements']:
    t = e.get('tags', {})
    if e['type'] == 'way' and t.get('highway'):
        g = geom(e)
        if g: el.append(f'<polyline points="{" ".join(P(p) for p in g)}" fill="none" stroke="#c9bfb0" stroke-width="{2 if t["highway"] in ("primary","secondary","tertiary","residential") else .8}"/>')
el.append(f'<polygon points="{" ".join(P(m(p["lat"], p["lon"])) for p in bnd)}" fill="#dcebc6" fill-opacity=".55" stroke="#4a7a3a" stroke-width="2"/>')
labels = []
for e in d['elements']:
    t = e.get('tags', {})
    if e['type'] == 'way' and 'building' in t:
        g = geom(e)
        if not g: continue
        fam = any(k in t for k in ('wikidata', 'wikipedia', 'heritage', 'historic')) or t.get('tourism') in ('museum', 'attraction')
        el.append(f'<polygon points="{" ".join(P(p) for p in g)}" fill="{"#e0ad3c" if fam else "#c8c0b4"}" stroke="#555" stroke-width=".3"/>')
        if fam and t.get('name'):
            cx = sum(p[0] for p in g) / len(g); cy = sum(p[1] for p in g) / len(g); labels.append((cx, cy, t['name']))
for cx, cy, n in labels: el.append(f'<text x="{O+cx*S:.0f}" y="{O-cy*S:.0f}" font-size="8" text-anchor="middle">{n}</text>')
# candidate squares
def sq(cx, cy, side, ang, col, label):
    a = math.radians(ang); h = side / 2
    pts = [(cx + u*math.cos(a) - v*math.sin(a), cy + u*math.sin(a) + v*math.cos(a)) for u, v in ((-h,-h),(h,-h),(h,h),(-h,h))]
    el.append(f'<polygon points="{" ".join(P(p) for p in pts)}" fill="none" stroke="{col}" stroke-width="2.2" stroke-dasharray="7 4"/>')
    el.append(f'<text x="{O+pts[3][0]*S+4:.0f}" y="{O-pts[3][1]*S+12:.0f}" font-size="12" fill="{col}">{label}</text>')
for a in sys.argv[1:]:
    cx, cy, side, ang, col, lab = a.split(',')
    sq(float(cx), float(cy), float(side), float(ang), col, lab)
for x in range(-500, 501, 100):
    el.append(f'<text x="{O+x*S}" y="895" font-size="9" text-anchor="middle">{x}</text><text x="2" y="{O-x*S+3}" font-size="9">{x}</text>')
el.append('</svg>')
open('work/campus-preview.svg', 'w', encoding='utf-8').write('\n'.join(el))
print(len(labels), 'famous buildings')
