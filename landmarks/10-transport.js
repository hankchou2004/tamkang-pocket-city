/* ====================== District 10: 淡江大學站（紅28）and 淡江大學站 on 大忠街（紅27、756） ======================
   OSM w294617265: amenity=bus_station, "紅28公車站(淡江大學站)", a 34 × 7 m strip beside the 宮燈教室 garden.
   A street-level photo the user supplied (Google Street View, 2012-11): blue-and-white 指南客運 buses parked nose-in at an
   angle against a low stone retaining wall, the garden's flowers above it; no roof over the bays. The map draws the
   station as a building: here it is the bays, the wall and the buses as in the photo. */
const BUS_STOP = 'w294617265';
function busBus(x, y, dir) {   // one bus, 10.5 × 2.5 m, pointing along dir
  const f = frame([x, y], dir, 10.5, 2.5), r = ccw(f.ring), g = ccw(frame([x, y], dir, 10.3, 2.52).ring);
  return solid(r, .35, 1.3, '#f1f1ee', '#f1f1ee') + solid(g, 1.3, 1.75, '#2f5d9e', '#2f5d9e') + solid(r, 1.75, 2.6, '#5d6a72', '#5d6a72') +
    solid(ccw(frame([x, y], dir, 10.4, 2.45).ring), 2.6, 3.0, '#f4f4f1', '#e6e6e2') +
    [-3.5, 3.5].map(s => { const q = f.P(s, 0); return solid(ccw(frame(q, dir, .9, 2.56).ring), 0, .7, '#2d2d2f', '#2d2d2f'); }).join('');
}
function busStation() {
  const b = findBuilding(BUS_STOP); if (!b) return null;
  const { c, ax, L, W } = b.obb, f = frame(c, ax, L, W), back = 1;   // +t: the garden side (the retaining wall)
  return obj(ccw(f.ring), 3.2, () => {
    let s = solid(ccw([f.P(-L / 2, W / 2 - .6), f.P(L / 2, W / 2 - .6), f.P(L / 2, W / 2), f.P(-L / 2, W / 2)]), 0, 1.4, '#8f8a82', '#9c978e');   // stone wall
    const a = 40 * Math.PI / 180, dir = [ax[0] * Math.cos(a) + (-ax[1]) * Math.sin(a) * back, ax[1] * Math.cos(a) + ax[0] * Math.sin(a) * back];
    for (let k = 0; k < 5; k++) { const q = f.P(-L / 2 + 5 + k * ((L - 10) / 4), -.6); s += busBus(q[0], q[1], dir); }
    return s;
  });
}

/* 淡江大學站 on 大忠街 (OSM bus-stop nodes near 121, 258; served by 紅27 and 756), after a street photo the user supplied
   (Google Street View, 2024-01; viewed only, not stored): a waiting shelter with a blue fascia, a glass back and a bench,
   on the sidewalk south of 大忠街; beside it a flight of steps with handrails up toward campus and 大忠管制站. The shelter
   follows the street (the OSM car route); its length, and the steps' size and place, are read by eye (推定). */
const DZ_STOP = [120.3, 257.4], DZ_U = [.853, .522];   // along 大忠街; the road lies to the north-west, campus behind
function dazhongStop() {
  HANDMADE_STOPS.push([121.69, 259.0], [118.37, 257.2]);
  const P = frame(DZ_STOP, DZ_U, 1, 1).P, at = (s, t, z) => { const q = P(s, t); return [q[0], q[1], z]; };   // t > 0: toward the road
  const roof = ccw(frame(P(0, 0), DZ_U, 6.4, 2.0).ring);
  return obj(roof, 3, () => {
    let s = solid(roof, 2.6, 2.72, '#e6e9ea', '#eef0f0');
    s += solid(ccw(frame(P(0, 1.0), DZ_U, 6.4, .12).ring), 2.3, 2.75, '#2f5fa6', '#2f5fa6');   // the blue fascia over the kerb side
    for (const [ps, pt] of [[-3, -.85], [3, -.85], [-3, .85], [3, .85]]) s += stick(at(ps, pt, 0), at(ps, pt, 2.6), .05, '#9ea4a7');
    s += shape([at(-3, -.85, .25), at(3, -.85, .25), at(3, -.85, 2.3), at(-3, -.85, 2.3)], 'rgba(176,204,212,0.45)', .4);   // glass back
    s += solid(ccw(frame(P(0, -.5), DZ_U, 4.2, .4).ring), .42, .5, '#9b795d', '#a8866a');   // bench
    for (const ps of [-1.8, 1.8]) s += stick(at(ps, -.5, 0), at(ps, -.5, .42), .04, '#6c716e');
    // steps up toward campus at the shelter's south-west end, with handrails
    for (let k = 0; k < 8; k++) s += solid(ccw([P(-6.4, -.4 - k * .38), P(-4.0, -.4 - k * .38), P(-4.0, -.78 - k * .38), P(-6.4, -.78 - k * .38)]), 0, (k + 1) * .19, '#c9c4b8', '#d6d1c5');
    for (const ps of [-6.3, -4.1]) s += stick(at(ps, -.4, 1.0), at(ps, -3.44, 2.5), .04, '#c4c7c8') + stick(at(ps, -.4, 0), at(ps, -.4, 1.0), .04, '#c4c7c8') + stick(at(ps, -3.44, 1.5), at(ps, -3.44, 2.5), .04, '#c4c7c8');
    return s;
  });
}
LANDMARKS.push({ name: '淡江大學站（紅28）', ids: [BUS_STOP], build: busStation }, { name: '淡江大學站（紅27、756）', ids: [], build: dazhongStop });
