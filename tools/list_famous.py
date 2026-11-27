import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
s = json.load(open('work/scene.json', encoding='utf-8')); ids = {b['id']: b for b in s['buildings']}
import glob
lm = ''.join(open(p, encoding='utf-8').read() for p in sorted(glob.glob('landmarks/*.js')))
for i in sorted(set(re.findall(r"'(w\d+)'", lm))): print(i, 'OK' if i in ids else 'MISSING', ids.get(i, {}).get('n', ''))
print('--- famous')
for b in s['buildings']:
    if b.get('famous'):
        print(b['id'], b.get('n'), [round(v) for v in b['obb']['c']], 'L%.0f W%.0f' % (b['obb']['L'], b['obb']['W']), b.get('lv', ''), 'CUT' if b.get('cut') else '')
