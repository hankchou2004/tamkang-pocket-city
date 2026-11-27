"""Build the pages, and optionally render check images.

  python tools/build.py                       # the 3D page, tamkang-campus.html (three.js)
  python tools/build.py --check 168,-62       # also render six yaws, a top view and night around plot point x,y
  python tools/build.py --views avenue,library --at 2026-11-27T18:30 --wx rain   # render named views
  python tools/build.py --app                 # the phone app (_site/app/, a PWA), the development page (_site/dev/), the MapLibre page
  python tools/build.py --site-pages          # what GitHub Pages publishes: the MapLibre page as the home page, the 3D page at 3d.html

The pages: vendor/three (three.js r159, MIT), web3d/kit3d.js (the drawing parts as 3D geometry), the landmark files,
web3d/main3d.js (3D page and phone app) or proto/maplibre.js (MapLibre page), web3d/template.html (3D page layout).
Landmark files in landmarks/ are joined in name order (00-common.js first) into build/landmarks.js.
Chrome for rendering: set $CHROME if it is not found on its own."""
import argparse, glob, json, os, shutil, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = 'tamkang-campus.html'

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

def campus_zones():
    """The campus outline and the area tints (work/campus-boundary.json, work/zones.json) in plot metres."""
    plot = json.load(open(os.path.join(ROOT, 'work', 'plot.json'), encoding='utf-8'))
    import math
    kx, ky = 111320 * math.cos(math.radians(plot['lat'])), 110574
    cr, sr = math.cos(math.radians(-plot['rotation'])), math.sin(math.radians(-plot['rotation']))
    def P(lat, lon):
        x, y = (lon - plot['lon']) * kx, (lat - plot['lat']) * ky
        return [round(x * cr - y * sr, 2), round(x * sr + y * cr, 2)]
    campus = [P(p['lat'], p['lon']) for p in json.load(open(os.path.join(ROOT, 'work', 'campus-boundary.json'), encoding='utf-8'))]
    zones = []
    for z in json.load(open(os.path.join(ROOT, 'work', 'zones.json'), encoding='utf-8'))['zones']:
        pts = json.load(open(os.path.join(ROOT, 'work', z['file']), encoding='utf-8')) if z.get('file') else [{'lat': a, 'lon': b} for a, b in z['ring']]
        zones.append({k: z[k] for k in ('id', 'name', 'colour', 'edge')} | {'ring': [P(p['lat'], p['lon']) for p in pts]})
    return campus, zones

def build3d(out, city='work/city.json', app=False):
    """The three.js page: web3d/template.html (layout and styles), three.js, the data, kit3d, the landmarks, main3d.
    app=True: the phone app (APP_MODE in main3d.js), with the PWA links from app/head.html."""
    lm, n = join_landmarks()
    read = lambda *p: open(os.path.join(ROOT, *p), encoding='utf-8').read()
    scene = json.load(open(os.path.join(ROOT, 'work', 'scene.json'), encoding='utf-8'))
    data = json.load(open(os.path.join(ROOT, city), encoding='utf-8'))
    live = json.load(open(os.path.join(ROOT, 'work', 'live.json'), encoding='utf-8'))
    cfg = {k: live[k] for k in ('place', 'bases', 'months', 'weathers', 'levels', 'wmo', 'fallback', 'note')}
    campus, zones = campus_zones()
    three = read('vendor', 'three', 'three.min.js')
    three = '0,' + three[three.index('/**'):] if three.startswith('console.warn') else three   # drop the r150+ deprecation notice (the build is one expression)
    js = lambda s: '<script>' + chr(10) + s.replace('</script', '<' + chr(92) + '/script') + chr(10) + '</script>' + chr(10)
    blocks = (js(three) +
              js(('const APP_MODE=true;' + chr(10) if app else '') + 'const SCENE=' + json.dumps(scene, ensure_ascii=False, separators=(',', ':')) + ';' + chr(10) +
                 'const CITY=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';' + chr(10) +
                 'const LIVE_CFG=' + json.dumps(cfg, ensure_ascii=False) + ';' + chr(10) +
                 'const CAMPUS=' + json.dumps(campus) + ';' + chr(10) +
                 'const ZONES=' + json.dumps(zones, ensure_ascii=False) + ';') +
              js(read('web3d', 'kit3d.js')) + js(open(lm, encoding='utf-8').read()) + js(read('web3d', 'main3d.js')))
    html = read('web3d', 'template.html').replace('<!--BLOCKS-->', blocks)
    if app and os.path.isfile(os.path.join(ROOT, 'app', 'head.html')):   # the PWA links (app/ is local only)
        i = html.index('</head>'); html = html[:i] + read('app', 'head.html') + html[i:]
    path = os.path.join(ROOT, out); os.makedirs(os.path.dirname(path) or ROOT, exist_ok=True)
    open(path, 'w', encoding='utf-8').write(html)
    print(f'Built {out} (three.js, {len(html) // 1024} KB), {n} landmark files')

def build_app(site='_site'):
    """The phone app (site/app/: the map page in APP_MODE, manifest, service worker, icons) and the development page
    (site/dev/: the app in a phone frame, panels on both sides)."""
    # app/ and dev/ are kept out of the repository: without them, build the app page alone and skip the rest
    has_shell = os.path.isfile(os.path.join(ROOT, 'app', 'head.html'))
    build3d(os.path.join(site, 'app', 'index.html'), app=True)
    if has_shell:
        for f in ('manifest.webmanifest', 'sw.js', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'):
            shutil.copyfile(os.path.join(ROOT, 'app', f), os.path.join(ROOT, site, 'app', f))
    if os.path.isfile(os.path.join(ROOT, 'dev', 'index.html')):
        os.makedirs(os.path.join(ROOT, site, 'dev'), exist_ok=True)
        shutil.copyfile(os.path.join(ROOT, 'dev', 'index.html'), os.path.join(ROOT, site, 'dev', 'index.html'))
        print(f'App in {site}/app/, development page in {site}/dev/ (serve with: python -m http.server 8000 -d {site})')
    else:
        print(f'No dev/ folder: built {site}/app/ only (serve with: python -m http.server 8000 -d {site}, open /app/)')

def build_proto(site='_site'):
    """Prototype: the campus on a MapLibre map (proto/maplibre.html, proto/maplibre.js). The base map is OpenFreeMap's
    vector tiles; the hand-built landmarks are drawn by three.js in a MapLibre custom layer. Writes site/proto/maplibre.html."""
    lm, n = join_landmarks()
    read = lambda *p: open(os.path.join(ROOT, *p), encoding='utf-8').read()
    three = read('vendor', 'three', 'three.min.js')
    three = '0,' + three[three.index('/**'):] if three.startswith('console.warn') else three
    js = lambda s: '<script>' + chr(10) + s.replace('</script', '<' + chr(92) + '/script') + chr(10) + '</script>' + chr(10)
    scene = json.load(open(os.path.join(ROOT, 'work', 'scene.json'), encoding='utf-8'))
    city = json.load(open(os.path.join(ROOT, 'work', 'city.json'), encoding='utf-8'))
    campus, zones = campus_zones()
    live = json.load(open(os.path.join(ROOT, 'work', 'live.json'), encoding='utf-8'))
    cfg = {k: live[k] for k in ('place', 'bases', 'months', 'weathers', 'levels', 'wmo', 'fallback', 'note')}
    blocks = (js(three) + js('const SCENE=' + json.dumps(scene, ensure_ascii=False, separators=(',', ':')) + ';' + chr(10) +
                             'const CITY=' + json.dumps(city, ensure_ascii=False, separators=(',', ':')) + ';' + chr(10) +
                             'const CAMPUS=' + json.dumps(campus) + ';' + chr(10) +
                             'const ZONES=' + json.dumps(zones, ensure_ascii=False) + ';' + chr(10) +
                             'const LIVE_CFG=' + json.dumps(cfg, ensure_ascii=False) + ';') +
              js(read('web3d', 'kit3d.js')) + js(open(lm, encoding='utf-8').read()) + js(read('proto', 'maplibre.js')))
    html = read('proto', 'maplibre.html').replace('<!--BLOCKS-->', blocks)
    out = os.path.join(ROOT, site, 'proto', 'maplibre.html'); os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(html)
    print(f'Built {site}/proto/maplibre.html ({len(html) // 1024} KB), {n} landmark files')

def shots3d(page, views, at=None, wx=None, out='shots/3d', size='1200x800'):
    cmd = ['node', os.path.join(ROOT, 'tools', 'shot3d.mjs'), page, '--out', out, '--view', views, '--size', size]
    if at: cmd += ['--at', at]
    if wx: cmd += ['--wx', wx]
    run(cmd)

def site_pages(site='_site'):
    """GitHub Pages: the MapLibre page as the home page (also kept at proto/maplibre.html for old links), the 3D page at 3d.html."""
    build_proto(site)
    shutil.copyfile(os.path.join(ROOT, site, 'proto', 'maplibre.html'), os.path.join(ROOT, site, 'index.html'))
    build3d(os.path.join(site, '3d.html'))
    print(f'Pages site in {site}/: index.html (MapLibre), 3d.html, proto/maplibre.html')

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--check', help='x,y in plot metres: render six yaws, a top view and night around this point')
    ap.add_argument('--zoom', type=float, default=2.4, help='zoom for --check (1 ≈ 186 m across)')
    ap.add_argument('--views', help='comma list of view ids from work/city.json to render')
    ap.add_argument('--out', default=None, help='page to write')
    ap.add_argument('--app', action='store_true', help='build the phone app, the development page and the MapLibre page into --site')
    ap.add_argument('--proto', action='store_true', help='build only the MapLibre page into --site')
    ap.add_argument('--site-pages', action='store_true', help='build what GitHub Pages publishes into --site')
    ap.add_argument('--site', default='_site', help='output folder for --app / --proto / --site-pages (default _site)')
    ap.add_argument('--at', help='renders: the moment, e.g. 2026-11-27T18:30 (Taiwan time)')
    ap.add_argument('--wx', help='renders: the weather, clear / drizzle / rain / fog')
    a = ap.parse_args()
    if a.app:
        build_app(a.site); build_proto(a.site); return
    if a.proto:
        build_proto(a.site); return
    if a.site_pages:
        site_pages(a.site); return
    out = a.out or OUT
    build3d(out)
    if a.views: shots3d(out, a.views, a.at or '2026-11-27T12:00', a.wx or 'clear')
    if a.check:
        shots3d(out, 'check:' + a.check + ':' + str(a.zoom), a.at or '2026-11-27T12:00', a.wx or 'clear', out='shots/check3d')
        shots3d(out, 'check:' + a.check + ':' + str(a.zoom), '2026-11-27T19:30', 'clear', out='shots/check3d-night')

if __name__ == '__main__':
    main()
