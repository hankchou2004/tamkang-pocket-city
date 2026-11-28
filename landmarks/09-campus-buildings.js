/* ====================== District 9: the other named campus buildings ======================
   Appearance after photos in 淡江大學校園素材庫 (photo.tku.edu.tw, © 淡江大學, used only as a reference for drawing) and
   Wikimedia Commons (阿道, 2025-08-04, CC BY-SA 4.0). Outlines and storeys from OpenStreetMap.
   騮先紀念科學館 (w235418066, 4 levels): white, a taller central block over the entrance with two stacked balconies with
     white balustrades, a dark painted bracket frieze under deep flat eaves, a grey stone base. Which face carries the
     entrance is not certain from the photos: the central block is drawn across the whole depth (illustrative).
   商管大樓 (w292253711 11 levels, w461340669 7 levels): a white slab with regular windows, a rounded stair tower of dark
     glass at one end, a plant room on the roof.
   傳播館 (w964231580 5 levels, w235418089 4 levels): white frame and pilasters, tan granite-textured panels between,
     a deep white eave with a row of bracket teeth.
   學生活動中心 (w235418142, 2 levels): white, large white breeze-block lattice panels between the windows, a dark bracket
     frieze under the eave, a colonnade along one long side (the post office).
   視聽教育館 (w235418115, 2 levels): white walls behind verandas on red columns, red railings upstairs, deep white eaves.
   瀛苑 (w294124677): a two-storey white villa, brown tiled roof edge, a rounded balcony with a white balustrade.
   實棟學人宿舍 (w235418160, w295944880, w295944881): two-storey white houses, a balcony with a balustrade along one
     side, low grey hipped roofs.
   Not drawn by hand (no photo found): 第一、第二風洞實驗館, 黑天鵝展示廳, 五虎崗機車停車場. */
const LIUHSIEN = 'w235418066', BIZ_TALL = 'w292253711', BIZ_LOW = 'w461340669', COMM_A = 'w964231580', COMM_B = 'w235418089',
      SAC = 'w235418142', AV = 'w235418115', YING = 'w294124677', FACULTY = ['w235418160', 'w295944880', 'w295944881'];
const CB_WHITE = '#efeee8', CB_TOP = '#d9d7d0', BRACKET = '#4d4a45', DARKGLASS = ['#56626a', '#5e6a72'];

// a deep flat eave over a block: a white slab sticking out all round, with a frieze band under it
function eave(c, ring, h, frieze = BRACKET, out = 1.06) {
  return solid(toward(c, ring, out), h - .55, h, frieze, frieze) + solid(toward(c, ring, out + .02), h, h + .5, CB_WHITE, CB_TOP);
}
// points along the long sides of a building's frame: s from -L/2..L/2, t = ±W/2
const sideAt = (b, s, t) => { const { c, ax } = b.obb, nx = [-ax[1], ax[0]]; return [c[0] + ax[0] * s + nx[0] * t, c[1] + ax[1] * s + nx[1] * t]; };

function liuHsien() {
  const b = findBuilding(LIUHSIEN); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, F = 3.6, h = 4 * F, hc = 5 * F;
  const mid = ccw(frame(c, ax, Math.min(16, L * .28), W + 1.2).ring);
  return obj(ring, hc + 1, () => {
    let s = solid(toward(c, ring, 1.01), 0, 1.2, '#a9a6a0', '#b8b5ae');                       // grey stone base
    s += block(ring, 1.2, h, { facade: 'office', wall: CB_WHITE, top: CB_TOP, shop: 'none', floor: F, bay: 2.4, glass: DARKGLASS, frame: '#e7e6e1' }).draw();
    s += eave(c, ring, h);
    s += block(mid, 1.2, hc, { facade: 'civic', wall: '#f4f3ee', top: CB_TOP, shop: 'none', floor: F, bay: 3, glass: DARKGLASS, frame: '#f6f5f2' }).draw();
    s += eave(c, mid, hc, BRACKET, 1.07);
    for (const sg of [-1, 1]) for (const z of [2 * F, 3 * F]) {                                // two stacked balconies, both faces
      const a = sideAt(b, -6, sg * (W / 2 + 1.3)), q = sideAt(b, 6, sg * (W / 2 + 1.3)), a0 = sideAt(b, -6, sg * (W / 2 + .4)), q0 = sideAt(b, 6, sg * (W / 2 + .4));
      s += solid(ccw([a0, q0, q, a]), z - .25, z, '#f6f5f1', '#eceae4') + rail(a, q, z, z + 1.05);
    }
    return s;
  });
}

function bizTall() {
  const b = findBuilding(BIZ_TALL); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L } = b.obb, F = 3.4, h = 11 * F;
  const end = [c[0] + ax[0] * (L / 2 - 2.5), c[1] + ax[1] * (L / 2 - 2.5)];
  return obj(ring, h + 4, () => {
    let s = block(ring, 0, h, { facade: 'office', wall: '#eceae4', top: CB_TOP, shop: 'none', floor: F, bay: 2.2, glass: DARKGLASS, frame: '#e2e0da' }).draw();
    s += solid(polygon(end[0], end[1], 3.2, 20), 0, h + 1.5, '#4f5a60', '#d9d7d0');                  // rounded stair tower, dark glass
    s += solid(toward(c, ring, .35), h, h + 3, '#e6e4de', '#d3d1ca');                                 // plant room
    return s;
  });
}
const bizLow = plainHall(BIZ_LOW, 7, 3.4, { facade: 'office', wall: '#eceae4', top: CB_TOP, bay: 2.2, glass: DARKGLASS, frame: '#e2e0da' });

function commHall(id, levels) {
  return () => {
    const b = findBuilding(id); if (!b) return null;
    const ring = ccw(b.ring), c = b.obb.c, F = 3.5, h = levels * F;
    return obj(ring, h + 1, () => block(ring, 0, h, { facade: 'office', wall: '#cdbb98', top: CB_TOP, shop: 'none', floor: F, bay: 3, glass: ['#77898e', '#82939a'], frame: '#f4f3ef', trim: '#f4f3ef' }).draw() +
      eave(c, ring, h + .1, '#e2dfd8', 1.07));
  };
}

function studentCentre() {
  const b = findBuilding(SAC); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, F = 4.2, h = 2 * F;
  return obj(ring, h + 1, () => {
    let s = block(ring, 0, h, { facade: 'civic', wall: CB_WHITE, top: CB_TOP, shop: 'none', floor: F, bay: 4, glass: ['#a85d55', '#b46a60'], frame: '#f4f3ef' }).draw();
    // white breeze-block lattice panels between the windows on both long faces
    for (const sg of [-1, 1]) for (let s0 = -L / 2 + 2; s0 < L / 2 - 4; s0 += 8) {
      const a = sideAt(b, s0, sg * (W / 2 + .12)), q = sideAt(b, s0 + 3.2, sg * (W / 2 + .12)), a2 = sideAt(b, s0, sg * (W / 2 + .3)), q2 = sideAt(b, s0 + 3.2, sg * (W / 2 + .3));
      s += solid(ccw([a, q, q2, a2]), F * .25, h - .4, '#f3f2ed', '#e9e7e1');
      for (let z = F * .25 + .6; z < h - .5; z += .6) s += edge([a2[0], a2[1], z], [q2[0], q2[1], z], '#c3c0b8', .05);
      for (let k = 1; k < 5; k++) { const t = k / 5, x = a2[0] + (q2[0] - a2[0]) * t, y = a2[1] + (q2[1] - a2[1]) * t; s += edge([x, y, F * .25], [x, y, h - .4], '#c3c0b8', .05); }
    }
    s += eave(c, ring, h, '#5a6660');
    // colonnade along one long side
    const sg = 1, o0 = sideAt(b, -L / 2 + 1, sg * (W / 2 + 3)), o1 = sideAt(b, L / 2 - 1, sg * (W / 2 + 3)), i0 = sideAt(b, -L / 2 + 1, sg * W / 2), i1 = sideAt(b, L / 2 - 1, sg * W / 2);
    for (let k = 0; k <= 10; k++) { const t = k / 10, x = o0[0] + (o1[0] - o0[0]) * t, y = o0[1] + (o1[1] - o0[1]) * t; s += stick([x, y, 0], [x, y, F - .3], .2, '#f4f3ef'); }
    s += solid(ccw([i0, i1, o1, o0]), F - .3, F, '#f4f3ef', '#e6e4de');
    return s;
  });
}

function avHall() {
  const b = findBuilding(AV); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, F = 3.8, h = 2 * F, inner = ccw(frame(c, ax, L - 1, W - 4).ring), outer = frame(c, ax, L, W);
  return obj(ring, h + 1.2, () => {
    let s = solid(toward(c, ring, 1.0), 0, .6, '#a9a6a0', '#b8b5ae');
    s += block(inner, .6, h, { facade: 'civic', wall: CB_WHITE, top: CB_TOP, shop: 'none', floor: F, bay: 3, glass: DARKGLASS, frame: '#3f3b38' }).draw();
    s += solid(ccw(outer.ring), F - .2, F + .15, '#f4f3ef', '#ebe9e3');                              // the upper veranda floor
    for (const sg of [-1, 1]) {
      for (let k = 0; k <= 7; k++) { const q = outer.P(-L / 2 + .6 + (L - 1.2) * k / 7, sg * (W / 2 - .4)); s += stick([q[0], q[1], .6], [q[0], q[1], h], .2, '#b8433a'); }
      s += rail(outer.P(-L / 2 + .6, sg * (W / 2 - .4)), outer.P(L / 2 - .6, sg * (W / 2 - .4)), F + .15, F + 1.1, '#b8433a');
    }
    s += eave(c, ring, h, '#f1efea', 1.08);
    return s;
  });
}

function yingYuan() {
  const b = findBuilding(YING); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, F = 3.3, h = 2 * F;
  const bc = sideAt(b, L * .25, W / 2), nx = [-ax[1], ax[0]];
  const arc = []; for (let k = 0; k <= 12; k++) { const a = Math.PI * k / 12, u = Math.cos(a) * 3.2, v = Math.sin(a) * 2.2; arc.push([bc[0] + ax[0] * u + nx[0] * v, bc[1] + ax[1] * u + nx[1] * v]); }
  return obj(ring, h + 1, () => {
    let s = solid(toward(c, ring, 1.12), 0, .25, '#b1553e', '#c06048');                          // brick-red terrace
    s += block(ring, .25, h, { facade: 'stucco', wall: '#f3f2ee', top: '#d9d7d0', shop: 'none', floor: F, bay: 3, glass: ['#8c9aa0'], frame: '#6f5a46' }).draw();
    s += solid(toward(c, ring, 1.05), h - .1, h + .45, '#9a5a3c', '#a86a4a');                      // brown tiled roof edge
    s += solid(ccw(arc), F - .2, F + .1, '#f4f3ef', '#eceae4');
    for (let k = 0; k < arc.length - 1; k++) s += rail(arc[k], arc[k + 1], F + .1, F + 1);
    return s;
  });
}

function facultyHouse(id) {
  return () => {
    const b = findBuilding(id); if (!b) return null;
    const ring = ccw(b.ring), { c, ax, L, W } = b.obb, F = 3.2, h = 2 * F;
    return obj(ring, h + 3, () => {
      let s = block(ring, 0, h, { facade: 'apartment', wall: '#e9e8e3', top: '#cfcdc6', shop: 'none', floor: F, bay: 3.2, glass: ['#4f5a5f'], frame: '#7a7a76' }).draw();
      const a = sideAt(b, -L / 2 + .5, W / 2 + 1.4), q = sideAt(b, L / 2 - .5, W / 2 + 1.4), a0 = sideAt(b, -L / 2 + .5, W / 2), q0 = sideAt(b, L / 2 - .5, W / 2);
      s += solid(ccw([a0, q0, q, a]), F - .2, F + .1, '#ecebe6', '#e2e1dc') + rail(a, q, F + .1, F + 1, '#e3e2dc');
      s += roofOver(b.obb, h, { roof: 'hipped', pitch: 14, eaves: .9, roofColour: '#9fa3a3' })();
      return s;
    });
  };
}

LANDMARKS.push(
  { name: '騮先紀念科學館', ids: [LIUHSIEN], build: liuHsien },
  { name: '商管大樓', ids: [BIZ_TALL], build: bizTall },
  { name: '商管大樓 w461340669', ids: [BIZ_LOW], build: bizLow },
  { name: '傳播館', ids: [COMM_A], build: commHall(COMM_A, 5) },
  { name: '傳播館 w235418089', ids: [COMM_B], build: commHall(COMM_B, 4) },
  { name: '學生活動中心', ids: [SAC], build: studentCentre },
  { name: '視聽教育館', ids: [AV], build: avHall },
  { name: '瀛苑', ids: [YING], build: yingYuan },
  ...FACULTY.map(id => ({ name: '實棟學人宿舍 ' + id, ids: [id], build: facultyHouse(id) })),
);
