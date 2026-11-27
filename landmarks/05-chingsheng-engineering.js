/* ====================== District 5: 工學 and 驚聲 ======================
   驚聲紀念大樓: 淡江時報 865期 — in use from October 民國71年; a round front part of four storeys and a rectangular rear part
   of twelve; the rectangle stands for science, the circle for art. 1070期 — finished 1982, one basement and twelve storeys,
   then the tallest university building in Taiwan (OSM tags the tower 10 levels; the source's 12 is drawn). Commons
   "Ching-sheng Memorial Hall 01/02 20250804" and "... 2026-08-03", and a photo the user supplied: a pale grey-white
   concrete tower; solid end blocks with small punched windows, a lower middle bar of deep window bands with planted
   balconies, at the outer end a tall solid pier and a dark glazed slot; in front, a tan block and a drum with a cornice
   and two bands of white lattice; a white balustrade round a low podium and a balustraded canopy over the entrance. OSM parts: tower w235418157, round part w295324709, terrace w461340670.
   工學大樓: 1070期 — the new 工學大樓 opened in 1993 (OSM: eight levels). 工學館 (OSM: five levels) and 建築館: no photo
   or description found; drawn plainly (illustrative). */
const JS_TOWER = 'w235418157', JS_ROUND = 'w295324709', JS_TERRACE = 'w461340670', ENG = 'w235418104', ENG_MAIN = 'w235418107', ARCH = 'w294126064';

// the tower split along its axis (from the OSM outline, clipped in its own frame): the end block beside the drum, the
// middle bar of window bands, and the far end block
const JS_END_R = [[188.21, -64.52], [190.19, -72.25], [187.68, -75.85], [189.99, -77.48], [190.2, -79.07], [175.07, -98.65], [172.68, -99.08], [166.09, -94.5], [164.93, -94.23], [162.68, -92.7], [172.08, -80.51], [172.78, -81.02], [185.45, -65.2]];
const JS_MID = [[163.76, -90.94], [142.19, -75.04], [150.2, -64.68], [172.08, -80.51], [162.74, -92.6]];
const JS_END_L = [[141.89, -74.52], [142.3, -73.58], [140.92, -72.65], [140.22, -71.39], [140.49, -70.17], [141.43, -69.44], [142.58, -69.42], [143.7, -70.07], [145.19, -68.06], [146.63, -69.11], [147.27, -68.2], [144.07, -65.67], [146.59, -62.07], [150.2, -64.68], [142.19, -75.04]];
const JS_WHITE = '#ecebe6', JS_TOP = '#d9d7d0';

function chingSheng() {
  const t = findBuilding(JS_TOWER), r = findBuilding(JS_ROUND), ter = findBuilding(JS_TERRACE); if (!t) return null;
  const F = 3.4, H = 12 * F, dc = [171.9, -52.6], dr = 10.3, { c, ax } = t.obb, P = (s, u) => [c[0] + ax[0] * s - ax[1] * u, c[1] + ax[1] * s + ax[0] * u];
  const box = (s, u, l, w) => ccw(frame(P(s, u), ax, l, w).ring);
  const endSt = { facade: 'stucco', wall: JS_WHITE, top: JS_TOP, shop: 'none', floor: F, bay: 3.6, frame: '#5d6468', glass: ['#4f5a5f'] };
  const parts = [];

  const add = (fp, z1, mk) => parts.push({ fp, z1, mk });   // mk draws at draw time
  // end block beside the drum: punched windows; at its outer end a tall solid pier and a dark glazed slot
  add(ccw(JS_END_R), H, () => block(ccw(JS_END_R), 0, H, endSt).draw());
  add(box(-19.5, 3.2, 1.4, 26.6), H + 1, () => solid(box(-19.5, 3.2, 1.4, 26.6), 0, H + 1, '#3d4549', '#4a5357'));
  add(box(-21.4, 3.6, 2.4, 25), H + 3, () => solid(box(-21.4, 3.6, 2.4, 25), 0, H + 3, JS_WHITE, JS_TOP));
  // middle bar: deep window bands with planted balconies, one storey lower than the ends
  add(ccw(JS_MID), H - F, () => block(ccw(JS_MID), 0, H - F, { facade: 'office', wall: JS_WHITE, top: JS_TOP, shop: 'none', floor: F, bay: 3, glass: ['#4d585d', '#56626a'], frame: '#c9c8c2', trim: '#8fae78' }).draw() +
    solid(toward(avg(JS_MID), ccw(JS_MID), .55), H - F, H - F + 2.4, JS_WHITE, JS_TOP));
  add(ccw(JS_END_L), H, () => block(ccw(JS_END_L), 0, H, endSt).draw());
  if (r) {
    const rr = ccw(r.ring), circ = (k, z0, z1, col, top) => solid(polygon(dc[0], dc[1], dr + .15 + k, 36), z0, z1, col, top);
    add(rr, 4 * F + 1, () => {
    let s = block(rr, 0, 4 * F, { facade: 'office', wall: '#ccb79d', top: '#c2ad94', shop: 'none', floor: F, bay: 2.6, glass: ['#5d5a55'], frame: '#9b8a76' }).draw();
    s += circ(0, 0, 4 * F, '#f1efe9', '#e4e1d9') + circ(.45, 4 * F, 4 * F + .7, '#f6f5f1', '#e9e7e1');   // drum and its cornice
    // two bands of white lattice (round openings) on the side facing the reader
    if (UPX < .35) for (let k = 0; k < 40; k++) { const a = k / 40 * 2 * Math.PI, n = [Math.cos(a), Math.sin(a), 0]; if (!vis(n)) continue;
      for (const z of [2.4, 3.9, 8.0, 9.6, 11.2]) s += ball([dc[0] + n[0] * (dr + .05), dc[1] + n[1] * (dr + .05), z], .42, soft('#b9b2a6'), .15); }
    return s; });
  }
  if (ter) {   // a low podium round the drum with a white balustrade on its outer edges
    const tr = ccw(ter.ring);
    add(tr, 2, () => {
    let s = solid(tr, 0, .45, '#cbc7be', '#d3cfc6');
    for (let i = 0; i < tr.length; i++) {
      const p = tr[i], q = tr[(i + 1) % tr.length];
      if (Math.hypot(p[0] - dc[0], p[1] - dc[1]) < dr + 1.2 && Math.hypot(q[0] - dc[0], q[1] - dc[1]) < dr + 1.2) continue;
      s += rail(p, q, .45, 1.35);
    }
    return s; });
  }
  // the entrance canopy between the drum and the tower, a white balustrade on top (placed by eye from the photos)
  const can = box(-6.5, -15.5, 7, 6);
  add(can, 5.4, () => {
  let cs = solid(can, 4.0, 4.5, '#f4f3ef', '#e8e7e2');
  for (const [s, u] of [[-9.6, -18.1], [-3.4, -18.1]]) { const q = P(s, u); cs += stick([q[0], q[1], .45], [q[0], q[1], 4.0], .14, '#f4f3ef'); }
  for (let i = 0; i < can.length; i++) cs += rail(can[i], can[(i + 1) % can.length], 4.5, 5.4);
  return cs; });
  return obj(ccw(t.ring), H + 3, () => planOrder(parts.map(q => ({ fp: q.fp, z1: q.z1, svg: q.mk() }))));
}

LANDMARKS.push(
  { name: '驚聲紀念大樓', ids: [JS_TOWER, JS_ROUND, JS_TERRACE], build: chingSheng },
  { name: '工學大樓', ids: [ENG_MAIN], build: plainHall(ENG_MAIN, 8, 3.6, { facade: 'office', wall: '#e3dfd6', top: '#cfcac0', bay: 3, glass: GLASS, frame: '#86847f' }) },
  { name: '工學館', ids: [ENG], build: plainHall(ENG, 5, 3.6, { facade: 'office', wall: '#e6e1d6', top: '#d1ccc2', bay: 3.2, glass: GLASS, frame: '#86847f' }) },
  { name: '建築館', ids: [ARCH], build: plainHall(ARCH, 4, 3.8, { facade: 'office', wall: '#e9e5dc', top: '#d3cfc5', bay: 3.4, glass: GLASS, frame: '#7d7b76' }) },
);
