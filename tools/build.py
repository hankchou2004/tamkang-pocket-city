"""Build the page, and optionally render check images.

  python tools/build.py                       # build pocket-city-tamkang-campus.html
  python tools/build.py --check 168,-62       # also render six yaws, a top view and night around plot point x,y
  python tools/build.py --views avenue,library --seasons summer,lanterns60   # render named views from city.json

Landmark files in landmarks/ are joined in name order (00-common.js first) into build/landmarks.js.
The Pocket City skill's scripts are found at $POCKET_CITY_SKILL, else ~/.claude/skills/pocket-city.
Chrome for rendering: set $CHROME if it is not found on its own."""
import argparse, glob, json, os, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILL = os.environ.get('POCKET_CITY_SKILL') or os.path.join(os.path.expanduser('~'), '.claude', 'skills', 'pocket-city')
SCRIPTS = os.path.join(SKILL, 'scripts')
OUT = 'pocket-city-tamkang-campus.html'

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

def build(city, out):
    lm, n = join_landmarks()
    run([sys.executable, os.path.join(SCRIPTS, 'build.py'), '--scene', 'work/scene.json', '--city', city, '--landmarks', lm, '--out', out])
    print(f'joined {n} landmark files')

def render(page, views, seasons, out='shots', size='900x600'):
    run(['node', os.path.join(SCRIPTS, 'render.mjs'), page, '--out', out, '--view', views, '--season', seasons, '--size', size])

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--check', help='x,y in plot metres: render six yaws, a top view and night around this point')
    ap.add_argument('--zoom', type=float, default=2.4, help='zoom for --check (1 ≈ 186 m across)')
    ap.add_argument('--views', help='comma list of view ids from work/city.json to render')
    ap.add_argument('--seasons', default='summer')
    a = ap.parse_args()
    build('work/city.json', OUT)
    if a.views: render(OUT, a.views, a.seasons)
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
        render(page, ','.join(ids + ['checktop']), 'summer', out='shots/check')
        render(page, 'check60', 'lanterns60', out='shots/check')
        print('check images in shots/check/')

if __name__ == '__main__':
    main()
