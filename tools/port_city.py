"""Carry the 宮燈 district city.json into the campus plot: camera points through the fitted transform, titles for the
whole campus. Run once."""
import json, math, sys
sys.stdout.reconfigure(encoding='utf-8')
T = json.load(open('work/transform-gongdeng.json'))
th = math.radians(T['theta_deg']); c, s = math.cos(th), math.sin(th)
gd = lambda x, y: (round(c * x - s * y + T['tx'], 1), round(s * x + c * y + T['ty'], 1))
DYAW = float(sys.argv[1]) if len(sys.argv) > 1 else 0
city = json.load(open('work/city.json', encoding='utf-8'))
city['title'] = 'Tamkang University · 淡水校園'
city['place'] = '淡水校園 · 五虎崗'
def port(cam):
    cam['x'], cam['y'] = gd(cam['x'], cam['y']); cam['yaw'] = round(cam['yaw'] + DYAW, 1)
for v in city['views']: port(v['camera'])
for l in city['legend']:
    if l.get('camera'): port(l['camera'])
city['views'].append({'id': 'yawtest', 'label': 'yawtest', 'camera': {**[v for v in city['views'] if v['id'] == 'avenue'][0]['camera'], 'yaw': round(12 - DYAW, 1)}})
json.dump(city, open('work/city.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print([(v['id'], v['camera']) for v in city['views']])
