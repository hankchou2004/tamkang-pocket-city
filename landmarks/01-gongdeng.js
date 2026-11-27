/* Tamkang University, Tamsui campus: 宮燈教室 and 宮燈大道.
   宮燈教室 (built 1954, the first campus buildings): single-storey halls with red walls and green-grey tiled 歇山 roofs
   (a gable set on a hipped skirt), vermilion columns along both long sides, painted beams, stone plinth.
   Read from Wikimedia Commons photos by 阿道, Aug 2025 (CC BY-SA 4.0): "Tamkang University Chinese Palace-style
   Classrooms 01-04", "Tamkang University Administration Building 01-02", "Chinese Pavilion and classroom ...",
   "淡江大學宮燈教室柏樹", "Chueh-hsuan Chinese Garden 01-09". 淡江時報 528期: 宮殿紅牆綠瓦, 覺軒 仿上海豫園.
   Footprints from OpenStreetMap; heights, column spacing and lantern positions are read by eye (illustrative). */

/* One palace-style hall: plinth, red body set back behind a colonnade on both long sides, 歇山 roof.
   Returns a part {fp, z1, svg} built at draw time. */
function palaceHall(c, ax, L, W, o = {}) {
  const base = o.base ?? .55, wallTop = base + (o.wall ?? 3.9), p = o.pitch ?? 30, ver = o.veranda ?? 1.8;
  const tp = Math.tan(p * Math.PI / 180), outer = frame(c, ax, L, W);
  const Wg = W * .5, Lg = L - (W - Wg), zg = wallTop + (W - Wg) / 2 * tp, ridgeZ = wallTop + W / 2 * tp;
  const svg = () => {
    let s = block(frame(c, ax, L + .9, W + .9).ring, 0, base, { facade: 'plain', wall: PLINTH, top: PLINTH_TOP, shop: 'none' }).draw();
    const body = block(frame(c, ax, L - .3, W - 2 * ver).ring, base, wallTop,
      { facade: o.facade || 'temple', wall: RED_WALL, top: RED_WALL, shop: 'none', bay: 3.2, floor: wallTop - base, frame: '#5a3a2e', trim: BEAM });
    // colonnades: the side facing the reader goes after the body
    const sides = [-1, 1].map(sg => {
      const t = sg * (W / 2 - .35), n = [outer.nx[0] * sg, outer.nx[1] * sg, 0];
      let cols = '';
      const nCol = Math.max(2, Math.round((L - .8) / 3.3));
      for (let k = 0; k <= nCol; k++) { const sx = -L / 2 + .4 + (L - .8) * k / nCol, q = outer.P(sx, t); cols += stick([q[0], q[1], base], [q[0], q[1], wallTop], .19, COLUMN); }
      const a = outer.P(-L / 2 + .2, t), b = outer.P(L / 2 - .2, t);
      cols += edge([a[0], a[1], wallTop - .25], [b[0], b[1], wallTop - .25], BEAM, .45) + edge([a[0], a[1], wallTop - .02], [b[0], b[1], wallTop - .02], COLUMN, .2);
      return { near: vis(n), cols };
    });
    s += sides.filter(x => !x.near).map(x => x.cols).join('') + body.draw() + sides.filter(x => x.near).map(x => x.cols).join('');
    const roofC = { roofColour: ROOF, roofTex: 'kawara', ridgeCap: .3 };
    s += roofOver({ c, ax, L, W }, wallTop, { ...roofC, roof: 'hipped', pitch: p, eaves: 1.05 })();
    s += roofOver({ c, ax, L: Lg, W: Wg }, zg, { ...roofC, roof: 'gabled', pitch: p, eaves: .25, wall: GABLE })();
    return s;
  };
  return { fp: frame(c, ax, L + 2, W + 2).ring, z1: ridgeZ, svg };
}

// a 宮燈教室 wing straight from its OSM outline (rectangular): long axis along the outline's obb
function wing(id) {
  const b = findBuilding(id); if (!b) return null;
  const { c, ax, L, W } = b.obb, part = palaceHall(c, ax, L, W);
  return obj(ccw(b.ring), part.z1, () => part.svg());
}

/* 行政大樓 (OSM w235418117): two palace halls, north and south, joined by a short covered link, all in the same
   red-wall, green-tile style (Commons photos). OSM tags 3 levels; the photographed front is single-storey and is
   drawn that way. Sub-volumes are read off the OSM outline. */
function adminBuilding() {
  const b = findBuilding('w235418117'); if (!b) return null;
  const AX = gdAx([1, 0]), AY = gdAx([0, 1]);
  const north = palaceHall(gd([56.25, 74.25]), AX, 40.1, 15.4, { veranda: 2.0 });
  const south = palaceHall(gd([55.85, 55.8]), AX, 32.7, 14.4, { veranda: 2.0 });
  const linkC = gd([55.9, 64.9]), link = frame(linkC, AY, 4.2, 11.6);
  const linkPart = { fp: link.ring, z1: 6.5, svg: () =>
    block(link.ring, 0, .55, { facade: 'plain', wall: PLINTH, top: PLINTH_TOP, shop: 'none' }).draw() +
    block(frame(linkC, AY, 4.2, 8.6).ring, .55, 4.2, { facade: 'temple', wall: RED_WALL, top: RED_WALL, shop: 'none', bay: 3 }).draw() +
    roofOver({ c: linkC, ax: AY, L: 4.2, W: 11.6 }, 4.2, { roof: 'gabled', pitch: 28, roofColour: ROOF, roofTex: 'kawara', eaves: .4, wall: GABLE })() };
  return obj(ccw(b.ring), north.z1, () => planOrder([south, linkPart, north].map(p => ({ fp: p.fp, z1: p.z1, svg: p.svg() }))));
}

/* 覺軒 (OSM w294124216): the hall of the Chinese garden, rebuilt from former 宮燈教室 rooms with tall glazed doors;
   淡江時報 528期 calls it 仿上海豫園. Walls follow the OSM outline; one 歇山 roof over its oriented box. */
function chuehHsuan() {
  const b = findBuilding('w294124216'); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, tp = Math.tan(30 * Math.PI / 180), wallTop = 4.4;
  const Wg = W * .45, Lg = L - (W - Wg), zg = wallTop + (W - Wg) / 2 * tp;
  return obj(ring, wallTop + W / 2 * tp, () =>
    block(ring, 0, .45, { facade: 'plain', wall: PLINTH, top: PLINTH_TOP, shop: 'none' }).draw() +
    block(ring, .45, wallTop, { facade: 'temple', wall: RED_WALL, top: RED_WALL, shop: 'none', bay: 2.6, floor: 3.9 }).draw() +
    roofOver({ c, ax, L: L - 1, W: W - 1 }, wallTop, { roof: 'hipped', pitch: 30, roofColour: ROOF, roofTex: 'kawara', eaves: 1.0, ridgeCap: .3 })() +
    roofOver({ c, ax, L: Lg - 1, W: Wg }, zg - .3, { roof: 'gabled', pitch: 30, roofColour: ROOF, roofTex: 'kawara', eaves: .2, wall: GABLE, ridgeCap: .3 })());
}

/* 白樓 (OSM w294123966): a white residence block on the slope below the classrooms; three storeys and balconies are
   read from the Commons "Faculty Residences of Tamkang University" photos (illustrative). */
function whiteHall() {
  const b = findBuilding('w294123966'); if (!b) return null;
  const ring = ccw(b.ring);
  return obj(ring, 9.8, () => block(ring, 0, 9.6, { facade: 'apartment', wall: '#f3f1ea', top: '#d9d6cd', balcony: 'some', floor: 3.2, shop: 'none', frame: '#8c8a84' }).draw());
}

/* hexagonal pavilions (亭): red columns, a stone floor and a tiled pyramid roof with a finial
   ("Chinese Pavilion and classroom in Tamkang University Tamsui Campus", Commons). */
function pavilion(id) {
  const b = findBuilding(id); if (!b) return null;
  const ring = ccw(b.ring), c = avg(ring.map(p => [p[0], p[1], 0])), cx = c[0], cy = c[1];
  const scale = (r, k) => r.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]);
  return obj(ring, 6, () => {
    let s = block(scale(ring, .95), 0, .4, { facade: 'plain', wall: PLINTH, top: PLINTH_TOP, shop: 'none' }).draw();
    for (const q of scale(ring, .8)) s += stick([q[0], q[1], .4], [q[0], q[1], 3.0], .15, COLUMN);
    const eave = atZ(scale(ring, 1.22), 2.85);
    s += shape(eave, mix(ROOF, '#2f3530', .3), .5) + peak(scale(ring, 1.22), 2.85, [cx, cy, 5.3], ROOF);
    s += stick([cx, cy, 5.2], [cx, cy, 5.75], .09, '#5a5f58') + ball([cx, cy, 5.8], .14, soft('#5a5f58'), .3);
    return s;
  });
}

/* 宮燈大道 (OSM way named 宮燈大道 runs along y ≈ 36): planted beds on both sides of the central walk, edged with
   azalea hedges (淡江時報 528期: 宮燈道旁 杜鵑正熾, 杜鵑夾道的宮燈道), and white lamp posts each carrying two palace
   lanterns (Commons photos). The beds are the holes OSM leaves in the paved area; their stone kerbs and the number
   and spacing of lanterns are illustrative. */
const findBeds = () => {
  const out = [];
  for (const g of SCENE.paths || []) for (const poly of (Array.isArray(g[0][0][0]) ? g : [g])) for (const r of poly.slice(1)) {
    const o = r.map(gdBack), xs = o.map(p => p[0]), ys = o.map(p => p[1]);   // tested in the old 宮燈 plot frame
    if (Math.min(...ys) > 23 && Math.max(...ys) < 50 && Math.min(...xs) > -100 && Math.max(...xs) < 100 && Math.max(...xs) - Math.min(...xs) > 12) out.push(r);
  }
  return out;
};
const AZALEA = ['#dca0b0', '#d28d9f', '#e5b6c1', '#c97d92'];
function shrink(r, d) {
  const c = avg(r.map(p => [p[0], p[1], 0]));
  return r.map(p => { const dx = c[0] - p[0], dy = c[1] - p[1], l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * d * 1.41, p[1] + dy / l * d * 1.41]; });
}
function bed(r, i) {
  const ring = ccw(r);
  return obj(ring, 1.2, () => {
    const blooming = SEASON.id === 'spring', hedge = blooming ? AZALEA[i % AZALEA.length] : (SEASON.id === 'monsoon' ? '#6b8c5c' : '#739a5e');
    let s = block(ring, 0, .4, { facade: 'plain', wall: '#a39b8e', top: '#b9b2a5', shop: 'none' }).draw();
    s += block(shrink(ring, .15), .4, 1.05, { facade: 'plain', wall: hedge, top: hedge, shop: 'none', bars: false }).draw();
    s += shape(atZ(shrink(ring, 1.0), 1.06), SEASON.id === 'monsoon' ? '#9fbf84' : '#a9cd88', .4);
    return s;
  });
}
const LANTERN_X = [-61, -50, -39, -28, -18, -8, 2, 13, 24, 34, 44, 55, 66, 77];
const LANTERN_AT = () => LANTERN_X.map(x => gd([x, 36.3]));
function palaceLantern([x, y]) {
  const d = gdAx([1, 0]);   // the crossbar runs along the avenue
  return obj(frame([x, y], d, 1.6, .6).ring, 3.9, () => {
    const lit = !!SEASON.night, glow = lit ? LIT_LANTERN : LANTERN;
    let s = lit ? lightPool(x, y, 3.2, '#ffe7a8', .45) : '';
    s += stick([x, y, 0], [x, y, .25], .2, '#b9b3a6') + stick([x, y, .25], [x, y, 3.75], .09, POST);
    s += stick([x - d[0] * .65, y - d[1] * .65, 3.55], [x + d[0] * .65, y + d[1] * .65, 3.55], .05, POST) + ball([x, y, 3.82], .1, soft(POST), .3);
    for (const k of [-.55, .55]) {
      const cx = x + d[0] * k, cy = y + d[1] * k, top = 3.45, h = .55;
      s += edge([cx, cy, 3.55], [cx, cy, top], '#3c3a36', .05);
      s += loft(atZ(polygon(cx, cy, .17, 6), top - h), atZ(polygon(cx, cy, .2, 6), top - h * .5), n => lit ? glow : tone(n, soft(glow)));
      s += loft(atZ(polygon(cx, cy, .2, 6), top - h * .5), atZ(polygon(cx, cy, .15, 6), top), n => lit ? glow : tone(n, soft(glow)));
      s += shape(atZ(polygon(cx, cy, .17, 6), top + .01), '#3c3a36', .3);
      s += stick([cx, cy, top - h - .02], [cx, cy, top - h - .22], .03, '#b8483b');   // tassel
    }
    return s;
  });
}

LANDMARKS.push(
  ...['w235418120', 'w235418122', 'w235418126', 'w235418131', 'w964275336', 'w964276465'].map(id => ({ name: '宮燈教室 ' + id, ids: [id], build: () => wing(id) })),
  { name: '行政大樓', ids: ['w235418117'], build: adminBuilding },
  { name: '覺軒', ids: ['w294124216'], build: chuehHsuan },
  { name: '白樓', ids: ['w294123966'], build: whiteHall },
  ...['w294617132', 'w295320454', 'w295320455'].map(id => ({ name: '亭 ' + id, ids: [id], build: () => pavilion(id) })),
  { name: '宮燈大道 beds', ids: [], build: () => findBeds().map((r, i) => bed(r, i)) },
  { name: '宮燈大道 lanterns', ids: [], build: () => LANTERN_AT().map(palaceLantern) },
);
