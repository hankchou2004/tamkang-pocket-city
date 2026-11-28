/* ====================== District 10: 淡江大學站（紅28） ======================
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
LANDMARKS.push({ name: '淡江大學站（紅28）', ids: [BUS_STOP], build: busStation });
