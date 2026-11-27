/* ====================== District 2: 覺生紀念圖書館 and 牧羊草坪 ======================
   淡江時報 340期: a white building, 9 storeys; 659期: the new main library opened in 民國85年 (1996);
   865期: the building beside 牧羊草坪; 618期: 外語大樓 lies between the library and 文錙藝術中心;
   689期: the 李雙澤 memorial stone on 牧羊草坪 (1 Oct, 30th anniversary), inscribed 唱自己的歌，在這裡發聲.
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

// 勤務監控管制站: a one-storey guard post on the road below the library (no photo found: plain and illustrative)
function gatehouse() {
  const b = findBuilding(GATEHOUSE); if (!b) return null;
  const ring = ccw(b.ring);
  return obj(ring, 3.6, () => block(ring, 0, 3.2, { facade: 'office', wall: '#efede6', top: '#cfccc3', shop: 'none', floor: 3.2, bay: 2.2, glass: GLASS }).draw() +
    shape(atZ(toward(b.obb.c, ring, 1.18), 3.3), '#9aa3a5', .5));
}

// the 李雙澤 memorial stone on 牧羊草坪 (OSM node 4502075212); its shape is not described in the source: a plain stele
function memorialStone() {
  const x = -13, y = -86, d = gdAx([1, 0]);
  return obj(rect(x, y, 2.4, 2.4), 2, () => {
    const base = frame([x, y], d, 2.2, 1.2).ring, slab = frame([x, y], d, 1.5, .35).ring;
    return solid(ccw(base), 0, .3, '#a39b8e', '#b9b2a5') + solid(ccw(slab), .3, 1.75, '#6f6c66', '#7d7a73');
  });
}

LANDMARKS.push(
  { name: '覺生紀念圖書館', ids: [LIB], build: library },
  { name: '覺生綜合大樓', ids: [LIB_TOWER], build: libraryTower },
  { name: '外國語文大樓', ids: [FLB], build: languagesBuilding },
  { name: '勤務監控管制站', ids: [GATEHOUSE], build: gatehouse },
  { name: '李雙澤紀念碑', ids: [], build: memorialStone },
);
