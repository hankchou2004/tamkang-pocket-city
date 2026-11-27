"""Build the page, and optionally render check images.

  python tools/build.py                       # build pocket-city-tamkang-campus.html (three.js, 3D)
  python tools/build.py --check 168,-62       # also render six yaws, a top view and night around plot point x,y
  python tools/build.py --views avenue,library --at 2026-11-27T18:30 --wx rain   # render named views
  python tools/build.py --classic             # the earlier 2D page (Pocket City engine) as pocket-city-tamkang-campus-2d.html

The 3D page: vendor/three (three.js r159, MIT), web3d/kit3d.js (the drawing kit's vocabulary as 3D geometry, so the
landmark files run unchanged), web3d/main3d.js (scene, toon shading, sun and weather, controls), the engine's page
template for the layout. The 2D page:

States are base-weather-level from work/live.json (bases spring/summer/monsoon, weather clear/drizzle/rain/fog,
level 0 day .. 3 night). The page itself follows the live weather and the time (web/live.js).

Landmark files in landmarks/ are joined in name order (00-common.js first) into build/landmarks.js.
The Pocket City engine is vendored in vendor/pocket-city ($POCKET_CITY_SKILL points elsewhere, e.g. a newer skill).
Chrome for rendering: set $CHROME if it is not found on its own."""
import argparse, glob, json, os, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILL = os.environ.get('POCKET_CITY_SKILL') or os.path.join(ROOT, 'vendor', 'pocket-city')
SCRIPTS = os.path.join(SKILL, 'scripts')
OUT = 'pocket-city-tamkang-campus.html'
OUT_2D = 'pocket-city-tamkang-campus-2d.html'

# Small fixes to the vendored engine, applied to the built page (the licence allows non-commercial changes).
# Each is (why, exact old text, new text); the build stops if the old text is not found exactly once.
PATCHES = [
    ('night colours were cached per colour only, so after dusk the night stayed as light as the first level seen',
     'let o=NIGHTC.get(c);if(o)return o;',
     "const KEY=c+'|'+SEASON.night;let o=NIGHTC.get(KEY);if(o)return o;"),
    ('cache key, second half of the same fix',
     'NIGHTC.set(c,o)',
     'NIGHTC.set(KEY,o)'),
    ('drawing threads paint on the CPU (willReadFrequently): on the GPU the thousands of shapes in the whole-campus view '
     'filled the graphics card, and the screen itself could update only 3-4 times a second (tools/measure.mjs)',
     "frameCanvas.getContext('2d')",
     "frameCanvas.getContext('2d',{willReadFrequently:true})"),
    ('the same for the cached layer surfaces',
     "raster.getContext('2d')",
     "raster.getContext('2d',{willReadFrequently:true})"),
]

def run(cmd):
    env = {**os.environ, 'PYTHONUTF8': '1'}
    r = subprocess.run(cmd, cwd=ROOT, env=env)
    if r.returncode: sys.exit(r.returncode)

def join_landmarks():
    os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True)
    parts = sorted(glob.glob(os.path.join(ROOT, 'landmarks', '*.js')))
    text = '\n'.join(f'/* ===== {os.path.basename(p)} ===== */\n' + open(p, encoding='utf-8').read() for p in parts)
    out = os.path.join(ROOT, 'build', 'landmarks.js')
    open(out, 'w', encoding='utf-8', newline='\n').write(text)
    return out, len(parts)

def live_seasons(city):
    """Every base look x weather x light level from work/live.json becomes one season (id base-weather-level);
    web/live.js picks among them at run time."""
    L = json.load(open(os.path.join(ROOT, 'work', 'live.json'), encoding='utf-8'))
    out = []
    for b, look in L['bases'].items():
        for w, wx in L['weathers'].items():
            for i, lv in enumerate(L['levels']):
                s = {**look, **wx['set'], **lv['set']}
                s['crowd'] = round(look.get('crowd', 1) * wx.get('crowd', 1) * lv.get('crowd', 1), 2)
                s.update(id=f'{b}-{w}-{i}', label=f'{wx["label"]} · {lv["label"]}', note={'text': f'{wx["label"]}，{lv["label"]}。', **L['note']})
                out.append(s)
    city = {**city, 'seasons': out, 'occasions': [], 'months': [f'{b}-{L["fallback"].get(b, "clear")}-0' for b in L['months']]}
    return city, L

def build(city, out):
    lm, n = join_landmarks()
    os.makedirs(os.path.dirname(os.path.join(ROOT, out)) or ROOT, exist_ok=True)
    data = json.load(open(os.path.join(ROOT, city), encoding='utf-8'))
    data, live = live_seasons(data)
    gen = os.path.join('build', 'city-live.json')
    json.dump(data, open(os.path.join(ROOT, gen), 'w', encoding='utf-8'), ensure_ascii=False)
    run([sys.executable, os.path.join(SCRIPTS, 'build.py'), '--scene', 'work/scene.json', '--city', gen, '--landmarks', lm, '--out', out])
    # add the live weather/time-of-day script and the layout/controls script after the engine's page script
    page = os.path.join(ROOT, out); html = open(page, encoding='utf-8').read()
    cfg = {k: live[k] for k in ('place', 'months', 'weathers', 'levels', 'wmo', 'fallback', 'note')}
    js = 'const LIVE_CFG = ' + json.dumps(cfg, ensure_ascii=False) + ';' + chr(10) + open(os.path.join(ROOT, 'web', 'live.js'), encoding='utf-8').read() + chr(10) + open(os.path.join(ROOT, 'web', 'ui.js'), encoding='utf-8').read() + chr(10) + open(os.path.join(ROOT, 'web', 'smooth.js'), encoding='utf-8').read()
    js = js.replace('</script', '<' + chr(92) + '/script')
    # engine patches, applied to the built page so vendor/ stays unchanged (see PATCHES)
    for why, old, new in PATCHES:
        if html.count(old) != 1: sys.exit(f'engine patch no longer applies ({why}): update PATCHES in tools/build.py')
        html = html.replace(old, new)
    i = html.rindex('</body>')
    open(page, 'w', encoding='utf-8').write(html[:i] + '<script>' + chr(10) + js + chr(10) + '</script>' + chr(10) + html[i:])
    print(f'joined {n} landmark files, {len(data["seasons"])} weather and light states')

def build3d(out, city='work/city.json'):
    """The three.js page: the engine's template (layout and styles), three.js, the data, kit3d, the landmarks, main3d."""
    lm, n = join_landmarks()
    read = lambda *p: open(os.path.join(ROOT, *p), encoding='utf-8').read()
    scene = json.load(open(os.path.join(ROOT, 'work', 'scene.json'), encoding='utf-8'))
    data = json.load(open(os.path.join(ROOT, city), encoding='utf-8'))
    live = json.load(open(os.path.join(ROOT, 'work', 'live.json'), encoding='utf-8'))
    cfg = {k: live[k] for k in ('place', 'bases', 'months', 'weathers', 'levels', 'wmo', 'fallback', 'note')}
    plot = json.load(open(os.path.join(ROOT, 'work', 'plot.json'), encoding='utf-8'))
    import math
    kx, ky = 111320 * math.cos(math.radians(plot['lat'])), 110574
    cr, sr = math.cos(math.radians(-plot['rotation'])), math.sin(math.radians(-plot['rotation']))
    def P(lat, lon):
        x, y = (lon - plot['lon']) * kx, (lat - plot['lat']) * ky
        return [round(x * cr - y * sr, 2), round(x * sr + y * cr, 2)]
    campus = [P(p['lat'], p['lon']) for p in json.load(open(os.path.join(ROOT, 'work', 'campus-boundary.json'), encoding='utf-8'))]
    three = read('vendor', 'three', 'three.min.js')
    three = '0,' + three[three.index('/**'):] if three.startswith('console.warn') else three   # drop the r150+ deprecation notice (the build is one expression)
    js = lambda s: '<script>' + chr(10) + s.replace('</script', '<' + chr(92) + '/script') + chr(10) + '</script>' + chr(10)
    blocks = (js(three) +
              js('const SCENE=' + json.dumps(scene, ensure_ascii=False, separators=(',', ':')) + ';' + chr(10) +
                 'const CITY=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';' + chr(10) +
                 'const LIVE_CFG=' + json.dumps(cfg, ensure_ascii=False) + ';' + chr(10) +
                 'const CAMPUS=' + json.dumps(campus) + ';') +
              js(read('web3d', 'kit3d.js')) + js(open(lm, encoding='utf-8').read()) + js(read('web3d', 'main3d.js')))
    tpl = read('vendor', 'pocket-city', 'assets', 'template.html')
    html = tpl.replace('<!--POCKET-CITY-BLOCKS-->', blocks + '</body></html>' + chr(10))
    path = os.path.join(ROOT, out); os.makedirs(os.path.dirname(path) or ROOT, exist_ok=True)
    open(path, 'w', encoding='utf-8').write(html)
    print(f'Built {out} (three.js, {len(html) // 1024} KB), {n} landmark files')

def shots3d(page, views, at=None, wx=None, out='shots/3d', size='1200x800'):
    cmd = ['node', os.path.join(ROOT, 'tools', 'shot3d.mjs'), page, '--out', out, '--view', views, '--size', size]
    if at: cmd += ['--at', at]
    if wx: cmd += ['--wx', wx]
    run(cmd)

def render(page, views, seasons, out='shots', size='900x600'):
    run(['node', os.path.join(SCRIPTS, 'render.mjs'), page, '--out', out, '--view', views, '--season', seasons, '--size', size])

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--check', help='x,y in plot metres: render six yaws, a top view and night around this point')
    ap.add_argument('--zoom', type=float, default=2.4, help='zoom for --check (1 ≈ 186 m across)')
    ap.add_argument('--views', help='comma list of view ids from work/city.json to render')
    ap.add_argument('--seasons', default='summer-clear-0', help='states base-weather-level, e.g. summer-rain-3')
    ap.add_argument('--out', default=None, help='page to write')
    ap.add_argument('--classic', action='store_true', help='build the 2D page (Pocket City engine) instead')
    ap.add_argument('--at', help='3D renders: the moment, e.g. 2026-11-27T18:30 (Taiwan time)')
    ap.add_argument('--wx', help='3D renders: the weather, clear / drizzle / rain / fog')
    a = ap.parse_args()
    if not a.classic:
        out = a.out or OUT
        build3d(out)
        if a.views: shots3d(out, a.views, a.at or '2026-11-27T12:00', a.wx or 'clear')
        if a.check:
            shots3d(out, 'check:' + a.check + ':' + str(a.zoom), a.at or '2026-11-27T12:00', a.wx or 'clear', out='shots/check3d')
            shots3d(out, 'check:' + a.check + ':' + str(a.zoom), '2026-11-27T19:30', 'clear', out='shots/check3d-night')
        return
    a.out = a.out or OUT_2D
    build('work/city.json', a.out)
    if a.views: render(a.out, a.views, a.seasons)
    if a.check:
        x, y = (float(v) for v in a.check.split(','))
        city = json.load(open(os.path.join(ROOT, 'work', 'city.json'), encoding='utf-8'))
        cam = lambda yaw, pitch: {'yaw': yaw, 'pitch': pitch, 'zoom': a.zoom, 'x': x, 'y': y, 'z': 8}
        ids = [f'check{y_}' for y_ in (0, 60, 120, 180, 240, 300)]
        city['views'] += [{'id': i, 'label': i, 'camera': cam(int(i[5:]), 30)} for i in ids]
        city['views'].append({'id': 'checktop', 'label': 'checktop', 'camera': cam(0, 85)})
        tmp = os.path.join(ROOT, 'build', 'city-check.json')
        json.dump(city, open(tmp, 'w', encoding='utf-8'), ensure_ascii=False)
        page = os.path.join('build', 'check.html')
        build(tmp, page)
        render(page, ','.join(ids + ['checktop']), 'summer-clear-0', out='shots/check')
        render(page, 'check60', 'summer-clear-3', out='shots/check')
        print('check images in shots/check/')

if __name__ == '__main__':
    main()
