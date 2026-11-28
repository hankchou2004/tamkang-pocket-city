/* ====================== District 2: 覺生紀念圖書館 and 牧羊草坪 ======================
   淡江時報 340期: a white building, 9 storeys; 659期: the new main library opened in 民國85年 (1996);
   865期: the building beside 牧羊草坪; 618期: 外語大樓 lies between the library and 文錙藝術中心;
   689期: the 李雙澤 memorial stone on 牧羊草坪 (1 Oct, 30th anniversary), inscribed 唱自己的歌，在這裡發聲; photos the
   user supplied show its rocks, steel guitar and bamboo screen (see memorialStone).
   Massing read from Wikimedia Commons photos: "Tamkang University Library.jpg" (stepped white mass, a row of
   tower blocks on top, a slim dark-glazed tower beside it), "Tamkang University Chueh-sheng Memorial Library
   2019-01-23.jpg" (two-storey pink-beige granite portico with four round columns, wide granite steps with a white
   balustrade, ribbon windows above), "淡江大學外國語文大樓 01/02 20250804.jpg" (seven-storey grid facade, green-grey
   glass, stone ground floor). Footprints from OpenStreetMap; setbacks, the number and size of the roof blocks, and
   which side the portico faces (the projecting bay toward the plaza and the 閱讀的少女 statue) are read by eye. */
const LIB = 'w235418149', LIB_TOWER = 'w235418151', FLB = 'w235418154', GATEHOUSE = 'w294125483';

function library() {
  const b = findBuilding(LIB); if (!b) return null;
  const ring = ccw(b.ring), { c, ax } = b.obb, F = 3.8, top = 9 * F;
  const lf = frame(c, ax, 1, 1);   // local axes: s along ax (toward the SW), t across
  const P = (s, t) => lf.P(s, t);
  const st = { facade: 'office', wall: WHITE, top: WHITE_TOP, shop: 'none', floor: F, bay: 3.4, glass: GLASS, frame: '#7d8486', trim: '#ffffff' };
  // the portico stands in front of the projecting bay that faces the plaza (OSM edge 98.0,-50.6 -> 113.1,-62.5)
  const A = [98.0, -50.6], B = [113.1, -62.5], u = [(B[0] - A[0]) / 19.2, (B[1] - A[1]) / 19.2], n = [-u[1], u[0]];
  const out = (p, d) => [p[0] + n[0] * d, p[1] + n[1] * d], along = (k) => [A[0] + u[0] * k, A[1] + u[1] * k];
  const sgn = (n[0] * ((A[0] + B[0]) / 2 - c[0]) + n[1] * ((A[1] + B[1]) / 2 - c[1])) > 0 ? 1 : -1;   // n away from the building
  const o = (p, d) => out(p, d * sgn);
  const portFP = ccw([o(along(1.5), 0), o(along(17.7), 0), o(along(17.7), 5.5), o(along(1.5), 5.5)]);
  const stepFP = ccw([o(along(.5), 5.5), o(along(18.7), 5.5), o(along(18.7), 10.5), o(along(.5), 10.5)]);
  const draw = () => {
    let body = block(ring, 0, 3 * F, st).draw();
    body += block(toward(c, ring, .86), 3 * F, 6 * F, st).draw();
    const towers = [[-15, -13], [-15, 13], [15, -13], [15, 13]].map(([s, t]) => {
      const fp = ccw(frame(P(s, t), ax, 14, 13).ring);
      return { fp, z1: top + .8, svg: block(fp, 6 * F, top, { ...st, bay: 3 }).draw() + shape(atZ(toward(avg(fp.map(q => [...q, 0])), fp, 1.04), top + .02), '#e6e3da', .5) };
    });
    body += planSort(towers);
    // portico: granite piers and fascia, four round columns, glazed entrance set back
    const port = () => {
      let s = solid(ccw([o(along(1.5), 0), o(along(17.7), 0), o(along(17.7), 1.2), o(along(1.5), 1.2)]), 0, 9.2, '#55646b', GRANITE);   // glazed entrance, set back
      for (const k of [1.5, 17.7]) { const a = o(along(k), 1.2); s += edge([a[0], a[1], 0], [a[0], a[1], 7.4], '#3b4448', .12); }
      const piers = [[1.5, 2.8], [16.4, 17.7]].map(([k0, k1]) => ccw([o(along(k0), 1.2), o(along(k1), 1.2), o(along(k1), 5.5), o(along(k0), 5.5)]));
      const cols = [3.6, 7.6, 11.6, 15.6].map(k => { const q = o(along(k), 4.4); return stick([q[0], q[1], 0], [q[0], q[1], 7.4], .5, '#e2d4c7'); }).join('');
      s += piers.map(fp => solid(fp, 0, 7.4, GRANITE)).join('') + cols;
      s += solid(ccw([o(along(1.5), 1.2), o(along(17.7), 1.2), o(along(17.7), 5.5), o(along(1.5), 5.5)]), 7.4, 9.4, GRANITE, GRANITE_DK);
      return s;
    };
    const steps = () => {
      let s = '';
      for (let k = 0; k < 4; k++) s += solid(ccw([o(along(.5), 5.5), o(along(18.7), 5.5), o(along(18.7), 10.5 - k * 1.25), o(along(.5), 10.5 - k * 1.25)]), k * .3, (k + 1) * .3, GRANITE_DK, '#c9ae9d');
      for (const k of [.5, 18.7]) { const a = o(along(k), 10.5), q = o(along(k), 5.5); s += stick([a[0], a[1], .6], [q[0], q[1], 1.9], .08, '#f4f2ec'); }
      return s;
    };
    return planOrder([{ fp: ring, z1: top, svg: body }, { fp: portFP, z1: 9.4, svg: port() }, { fp: stepFP, z1: 1.2, svg: steps() }]);
  };
  return obj(ring, top + 1, draw);
}

// 覺生綜合大樓: the slim ten-storey tower beside the library, white frame with tall dark glass (Commons photo)
function libraryTower() {
  const b = findBuilding(LIB_TOWER); if (!b) return null;
  const ring = ccw(b.ring), h = 11 * 3.6;   // 淡江時報 1070期: the rear block is 11 storeys (OSM tags 10)
  return obj(ring, h + 1.5, () =>
    block(ring, 0, h, { facade: 'glass', wall: '#5d6b73', top: WHITE_TOP, shop: 'none', floor: 3.8, glass: ['#55656e', '#62737b'], frame: '#e8e6df' }).draw() +
    block(toward(b.obb.c, ring, .7), h, h + 1.4, { facade: 'plain', wall: WHITE, top: WHITE_TOP, shop: 'none' }).draw());
}

// 外國語文大樓 (opened per 淡江時報 618期): seven storeys, stone-clad ground floor, light grid above with green-grey glass
function languagesBuilding() {
  const b = findBuilding(FLB); if (!b) return null;
  const ring = ccw(b.ring), F = 3.6;
  return obj(ring, 7 * F + .8, () =>
    block(ring, 0, F, { facade: 'office', wall: '#d2c3b2', top: '#d2c3b2', shop: 'none', floor: F, bay: 3.2, glass: ['#8fb0ad'], frame: '#6f6a64' }).draw() +
    block(ring, F, 7 * F, { facade: 'office', wall: '#e4e2dc', top: '#d4d1c8', shop: 'none', floor: F, bay: 2.4, glass: ['#93b9b4', '#a3c3be', '#c7b9c0'], frame: '#bdbab3', trim: '#f2f0ea' }).draw());
}

// 勤務監控管制站, after a street photo the user supplied (Google Street View, viewed only, not stored): a one-storey booth
// with round ends, white walls of small square tiles, a band of dark tinted windows wrapping round it, a deep white tiled
// fascia, a door at one end. Which long side faces the road, and the door's place, are 推定.
const TILE = '#f1f1ec';
function gatehouse() {
  const b = findBuilding(GATEHOUSE); if (!b) return null;
  const { c, ax, L, W } = b.obb, P = frame(c, ax, 1, 1).P, ring = stadium(c, ax, L, W), fascia = stadium(c, ax, L + .5, W + .5);
  const at = (s, t, z) => { const q = P(s, t); return [q[0], q[1], z]; };
  return obj(ring, 3.6, () => {
    let s = solid(ring, 0, .95, TILE, TILE);
    s += loft(atZ(ring, .95), atZ(ring, 2.45), n => tone(n, soft('#4d6466')));   // the tinted window band
    for (let k = 0; k < ring.length; k += 3) s += stick([ring[k][0], ring[k][1], .95], [ring[k][0], ring[k][1], 2.45], .035, '#8c9395');
    s += solid(fascia, 2.45, 3.35, TILE, '#e2e1db');
    for (const z of [.35, .65, 2.75, 3.05]) inkLoop(atZ(z > 2 ? fascia : ring, z), mix(TILE, '#51465a', .22));   // tile courses
    s += shape([at(-L / 2 + 2.1, W / 2 + .02, 0), at(-L / 2 + 1.2, W / 2 + .02, 0), at(-L / 2 + 1.2, W / 2 + .02, 2.2), at(-L / 2 + 2.1, W / 2 + .02, 2.2)], '#4f6b60', .5);   // side door
    return s;
  });
}

// the 李雙澤 memorial on 牧羊草坪 (OSM node 4502075212), after two photos the user supplied (a close view, and Google Street
// View from the lawn, 2025-02; viewed only, not stored): under a banyan, a big mossy boulder and beside it a smaller stone with
// an inscribed plaque; above them a black steel guitar in outline; behind, a bamboo screen about 3 m high with a wavy top and
// two horizontal bamboo poles. It faces the lawn (east); the sizes are read by eye.
function memorialStone() {
  const x = -13, y = -86, f = [.985, -.171], u = [-f[1], f[0]];   // f: toward the lawn; u: along the screen
  const at = (a, b, z) => [x + u[0] * a + f[0] * b, y + u[1] * a + f[1] * b, z];
  const BAMBOO = '#d6c48f', topZ = t => 2.75 + .3 * Math.sin(Math.PI * 2 * t * 1.25 - .5);   // the wavy top, t 0..1 along the screen
  return obj(rect(x, y, 7, 7), 3.2, () => {
    const N = 20, pts = [at(-3.3, -1.3, 0), at(3.3, -1.3, 0)];
    for (let i = N; i >= 0; i--) pts.push(at(-3.3 + 6.6 * i / N, -1.3, topZ(i / N)));
    let s = shape(pts, BAMBOO, .5);
    for (let k = 1; k < 30; k++) { const t = k / 30; inkLoop([at(-3.3 + 6.6 * t, -1.27, .05), at(-3.3 + 6.6 * t, -1.27, topZ(t) - .05)], mix(BAMBOO, '#51465a', .22), false); }
    for (const z of [1.15, 2.35]) s += stick(at(-3.4, -1.2, z), at(3.4, -1.2, z), .05, '#d8c27a');
    s += boulder(at(-.5, -.1, 0), u, 2.6, 1.4, 1.05, '#8b977c', 3) + boulder(at(1.2, 0, 0), u, 1.2, .9, 1.15, '#b6b9b0', 7);
    s += shape([at(1.0, .47, .45), at(1.4, .47, .45), at(1.4, .47, .95), at(1.0, .47, .95)], '#efede6', .3);   // the plaque
    // the guitar: a figure-eight body, a sound hole and a neck, in black steel
    const ringAt = (cz, r, n = 16) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return at(.45 + Math.cos(a) * r, .05, cz + Math.sin(a) * r); });
    for (const [cz, r] of [[1.45, .32], [1.93, .24], [1.55, .08]]) { const rg = ringAt(cz, r); for (let i = 0; i < rg.length; i++) s += stick(rg[i], rg[(i + 1) % rg.length], .025, '#262626'); }
    s += stick(at(.45, .05, 2.15), at(.45, .05, 2.75), .035, '#262626') + stick(at(.42, .05, 2.75), at(.48, .05, 2.95), .05, '#262626');
    return s;
  });
}

LANDMARKS.push(
  { name: '覺生紀念圖書館', ids: [LIB], build: library },
  { name: '覺生綜合大樓', ids: [LIB_TOWER], build: libraryTower },
  { name: '外國語文大樓', ids: [FLB], build: languagesBuilding },
  { name: '勤務監控管制站', ids: [GATEHOUSE], build: gatehouse },
  { name: '李雙澤紀念碑', ids: [], build: memorialStone },
);
