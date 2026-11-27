/* ====================== District 8: 驚聲銅像廣場 ======================
   OSM: the plaza outline w235418102 (a circle about 35 m across) and the statue node 4502075222 (驚聲銅像).
   A photo the user supplied: a round plaza of grey cobbles laid in concentric rings, a ring of white pebbles at its
   edge, low stepped stone seating on one side, the dark statue on a dark pedestal at the end of the steps, and tall
   palms behind. Which side the steps take and how many rows there are are read by eye from the photo (illustrative). */
const JS_PLAZA = { c: [-178.1, 174.5], r: 17.2, statue: [-168.4, 166.3] };
function chingShengPlaza() {
  const { c, r, statue } = JS_PLAZA, [x, y] = c;
  const toStatue = Math.atan2(statue[1] - y, statue[0] - x), mid = toStatue + 1.15, span = 1.25;   // the steps' arc
  const arc = (r0, r1, a0, a1, n = 18) => { const p = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([x + Math.cos(a) * r1, y + Math.sin(a) * r1]); }
    for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; p.push([x + Math.cos(a) * r0, y + Math.sin(a) * r0]); }
    return ccw(p); };
  return obj(polygon(x, y, r + 6, 24), 9, () => {
    let s = shape(atZ(polygon(x, y, r + .6, 48), .2), '#e9e6df', .3);                         // white pebble edge
    s += shape(atZ(polygon(x, y, r, 48), .23), '#a9a298', .4);                                 // cobbles
    for (const k of [.82, .62, .42, .22]) s += shape(atZ(polygon(x, y, r * k, 40), .24), k === .62 || k === .22 ? '#bbb4a9' : '#a59e93', .25);
    for (let k = 0; k < 5; k++) s += solid(arc(r + 1 + k * 1.1, r + 2.1 + k * 1.1, mid - span, mid + span), 0, .45 * (k + 1), '#c9c5bd', '#d6d2ca');   // stepped seats
    s += solid(ccw(rect(statue[0], statue[1], 1.4, 1.4)), 0, 1.6, '#3f3b38', '#4a4643');          // pedestal
    s += stick([statue[0], statue[1], 1.6], [statue[0], statue[1], 3.4], .32, '#3a3633') + ball([statue[0], statue[1], 3.65], .26, soft('#3a3633'), .3);
    for (let k = 0; k < 5; k++) {                                                              // palms behind the steps
      const a = mid - span + .2 + k * (2 * span - .4) / 4, px = x + Math.cos(a) * (r + 9), py = y + Math.sin(a) * (r + 9), h = 10 + (k % 2) * 2;
      s += stick([px, py, 0], [px, py, h], .18, '#8d7a62');
      for (let f = 0; f < 8; f++) { const fa = f / 8 * Math.PI * 2, ex = px + Math.cos(fa) * 2.6, ey = py + Math.sin(fa) * 2.6;
        s += stick([px, py, h], [ex, ey, h - 1.1], .16, '#5f8a4c'); }
    }
    return s;
  });
}
LANDMARKS.push({ name: '驚聲銅像廣場', ids: [], build: chingShengPlaza });
