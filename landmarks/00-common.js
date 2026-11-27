/* Tamkang University, Tamsui campus: shared palette, transforms and parts used by every district.
   Files in landmarks/ are joined in name order by tools/build.py, so this file comes first and each district file
   can use what an earlier file defines. Each district adds its buildings with LANDMARKS.push(...).
   Before writing a new part, look here: reuse keeps the look consistent (see CONTRIBUTING.md). */

const LANDMARKS = [];

/* ---------- palette ---------- */
// 宮燈 palace style: tiled roof, red walls, vermilion columns, stone plinth, painted beams, lanterns
const ROOF = '#6d7870', RED_WALL = '#94433a', COLUMN = '#c44a35', GABLE = '#efe5d1', PLINTH = '#c9c1b1',
      PLINTH_TOP = '#ddd5c4', BEAM = '#4d7d77', LANTERN = '#f6efdc', LIT_LANTERN = '#fff3c4', POST = '#efede6';
// light modern buildings: white walls, granite, the common green-grey glass
const WHITE = '#f1efe8', WHITE_TOP = '#dcd9d0', GRANITE = '#cdb3a2', GRANITE_DK = '#b89c8b', GLASS = ['#8ea6ad', '#9db3b8'];

/* ---------- transforms ---------- */
/* District 宮燈教室 was first built on its own 200 m plot (turned 23°). Hand-placed points from that plot are carried
   into this campus plot by a rotation and shift fitted on 19 shared OSM buildings (max error 1 cm). */
const GD = { th: -37.500484231323476 * Math.PI / 180, tx: -90.81720371019892, ty: 59.3363176734548 };
const gdAx = ([x, y]) => [Math.cos(GD.th) * x - Math.sin(GD.th) * y, Math.sin(GD.th) * x + Math.cos(GD.th) * y];
const gd = p => { const r = gdAx(p); return [r[0] + GD.tx, r[1] + GD.ty]; };
const gdBack = ([x, y]) => { const dx = x - GD.tx, dy = y - GD.ty, c = Math.cos(GD.th), s = Math.sin(GD.th); return [c * dx + s * dy, -s * dx + c * dy]; };

/* ---------- plan helpers ---------- */
// a rectangle in plan, centre c, long axis ax (unit), length L along it, width W across
function frame(c, ax, L, W) {
  const nx = [-ax[1], ax[0]], P = (s, t) => [c[0] + ax[0] * s + nx[0] * t, c[1] + ax[1] * s + nx[1] * t];
  return { P, nx, ring: ccw([P(-L / 2, -W / 2), P(L / 2, -W / 2), P(L / 2, W / 2), P(-L / 2, W / 2)]) };
}
const toward = (c, p, k) => p.map(q => [c[0] + (q[0] - c[0]) * k, c[1] + (q[1] - c[1]) * k]);
// a plain solid with no windows (stone piers, fascia, steps): toned sides and a top
const solid = (fp, z0, z1, col, topCol) => loft(atZ(fp, z0), atZ(fp, z1), n => tone(n, soft(col))) + shape(atZ(fp, z1), topCol || col, .5);

/* ---------- parts ---------- */
// a plain hall from its OSM outline: `levels` storeys of `floor` metres in one block style (for buildings with
// no photo, or a simple facade); returns a LANDMARKS build function
const plainHall = (id, levels, floor, st) => () => {
  const b = findBuilding(id); if (!b) return null;
  const ring = ccw(b.ring), h = levels * floor;
  return obj(ring, h + 1, () => block(ring, 0, h, { shop: 'none', floor, ...st }).draw());
};

// a white balustrade along p→q: slim posts every ~1.4 m and a top rail, drawn as lines (never a filled sheet)
function rail(p, q, z0, z1, col = '#f7f6f2') {
  const len = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.round(len / 1.4));
  let s = '';
  for (let k = 0; k <= n; k++) { const x = p[0] + (q[0] - p[0]) * k / n, y = p[1] + (q[1] - p[1]) * k / n; s += stick([x, y, z0], [x, y, z1], .06, col); }
  return s + edge([p[0], p[1], z1], [q[0], q[1], z1], col, .7);
}

// rows of tilted solar panels on light frames over a flat roof: rectangle centre c, axis ax, L × W, roof height z
const SOLAR = '#43536b';
function solarArray(c, ax, L, W, z) {
  const f = frame(c, ax, L, W); let s = '';
  for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const q = f.P(u * L / 2 * .9, v * W / 2 * .9); s += stick([q[0], q[1], z], [q[0], q[1], z + 1.6], .1, '#d8d6cf'); }
  for (let k = 0, n = Math.max(1, Math.floor(W / 2.4)); k < n; k++) {
    const t0 = -W / 2 + k * W / n, t1 = t0 + W / n * .8, a = f.P(-L / 2, t0), b = f.P(L / 2, t0), c2 = f.P(L / 2, t1), d = f.P(-L / 2, t1);
    s += shape([[a[0], a[1], z + 1.5], [b[0], b[1], z + 1.5], [c2[0], c2[1], z + 2.2], [d[0], d[1], z + 2.2]], SOLAR, .35);
  }
  return s;
}

// a point on a bent building's spine: the mean of ring vertices lying near station s along its axis
function spine(b, s, half = 6) {
  const { c, ax } = b.obb, pts = ccw(b.ring).filter(p => Math.abs((p[0] - c[0]) * ax[0] + (p[1] - c[1]) * ax[1] - s) < half);
  return pts.length ? avg(pts) : [c[0] + ax[0] * s, c[1] + ax[1] * s];
}
