"""Fit new = R(theta) * old + t from buildings present in both the old 200 m 宮燈 scene and the new campus scene."""
import json, math, sys
sys.stdout.reconfigure(encoding='utf-8')
old = json.load(open(r'C:\Users\hank\Desktop\pocket-city-tamkang\work\scene.json', encoding='utf-8'))
new = json.load(open('work/scene.json', encoding='utf-8'))
nb = {b['id']: b for b in new['buildings']}
pairs = [(b['obb']['c'], nb[b['id']]['obb']['c'], b.get('n', '')) for b in old['buildings'] if b['id'] in nb and not b.get('cut') and not nb[b['id']].get('cut')]
oc = [sum(p[0][i] for p in pairs) / len(pairs) for i in (0, 1)]; nc = [sum(p[1][i] for p in pairs) / len(pairs) for i in (0, 1)]
sxx = sum((o[0] - oc[0]) * (n[0] - nc[0]) + (o[1] - oc[1]) * (n[1] - nc[1]) for o, n, _ in pairs)
sxy = sum((o[0] - oc[0]) * (n[1] - nc[1]) - (o[1] - oc[1]) * (n[0] - nc[0]) for o, n, _ in pairs)
th = math.atan2(sxy, sxx); c, s = math.cos(th), math.sin(th)
t = [nc[0] - (c * oc[0] - s * oc[1]), nc[1] - (s * oc[0] + c * oc[1])]
err = max(math.hypot(c * o[0] - s * o[1] + t[0] - n[0], s * o[0] + c * o[1] + t[1] - n[1]) for o, n, _ in pairs)
print(json.dumps({'theta_deg': round(math.degrees(th), 4), 'tx': round(t[0], 3), 'ty': round(t[1], 3), 'pairs': len(pairs), 'max_err_m': round(err, 3)}))
json.dump({'theta_deg': math.degrees(th), 'tx': t[0], 'ty': t[1]}, open('work/transform-gongdeng.json', 'w'))
