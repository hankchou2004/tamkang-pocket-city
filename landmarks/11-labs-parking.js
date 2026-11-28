/* ====================== District 11: wind tunnels, 黑天鵝展示廳, 五虎崗機車停車場 ======================
   Photos the user supplied (Google Maps contributors and Street View, 2017-2026; used only as a reference for drawing).
   第二風洞實驗館 (w295947233): a long shed of silver corrugated metal; one end is a white frame with the 風工程研究中心
     sign round a huge square intake, a thick blue surround and a dark wire grille. Which end carries the intake is read
     from the photos (the end facing the campus road, illustrative).
   第一風洞實驗館 (w294126412): a tall cream corrugated-metal hall with small windows, a lower cream annex under a
     lean-to roof, a door canopy, steel stairs up the side.
   黑天鵝展示廳 (w964236999): a white single-storey hall, round porthole windows, a glazed entrance under a deep white
     fascia with the black swan sign, a grey stone pier beside it.
   五虎崗機車停車場 (w964241624, OSM parking=multi-storey): a low white concrete deck, the lower level entered through a
     dark opening; on the deck rows of scooters behind a white stone balustrade, lamp posts and a small shed. */
const WT1 = 'w294126412', WT2 = 'w295947233', SWAN = 'w964236999', MOTO = 'w964241624';
const corrugate = (p, q, z0, z1, col, step = .45) => {   // vertical ribs on a metal wall
  const L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.round(L / step)); let s = '';
  for (let k = 1; k < n; k++) { const t = k / n, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t; s += edge([x, y, z0], [x, y, z1], col, .04); }
  return s;
};

function windTunnel2() {
  const b = findBuilding(WT2); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, f = frame(c, ax, L, W), h = 8;
  return obj(ring, h + 1, () => {
    let s = block(ring, 0, h, { facade: 'plain', wall: '#c9cdcf', top: '#b9bdbf', shop: 'none', floor: h }).draw();
    for (let i = 0; i < ring.length; i++) s += corrugate(ring[i], ring[(i + 1) % ring.length], .3, h - .2, '#a9aeb1');
    // the intake end (-s): a white frame, a blue surround and a dark grille
    const e = -L / 2 - .05, P = (u, z) => { const q = f.P(e, u); return [q[0], q[1], z]; };
    s += shape([P(-W / 2, 0), P(W / 2, 0), P(W / 2, h + .6), P(-W / 2, h + .6)], '#eeeeea', .5);
    s += shape([P(-W / 2 + .9, .6), P(W / 2 - .9, .6), P(W / 2 - .9, h - 1.4), P(-W / 2 + .9, h - 1.4)], '#3c78b8', .4);
    const g0 = -W / 2 + 1.6, g1 = W / 2 - 1.6, gz0 = 1.2, gz1 = h - 2.1, Q = (u, z) => { const q = f.P(e - .02, u); return [q[0], q[1], z]; };
    s += shape([Q(g0, gz0), Q(g1, gz0), Q(g1, gz1), Q(g0, gz1)], '#3a3633', .3);
    for (let u = g0 + .6; u < g1; u += .6) s += edge(Q(u, gz0), Q(u, gz1), '#7a6a5a', .04);
    for (let z = gz0 + .6; z < gz1; z += .6) s += edge(Q(g0, z), Q(g1, z), '#7a6a5a', .04);
    return s;
  });
}

function windTunnel1() {
  const b = findBuilding(WT1); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, h = 9.5, CREAM = '#e3dcb8';
  const main = ccw(frame([c[0] - ax[0] * L * .12, c[1] - ax[1] * L * .12], ax, L * .76, W).ring);
  const annex = ccw(frame([c[0] + ax[0] * L * .38, c[1] + ax[1] * L * .38], ax, L * .24, W * .7).ring);
  return obj(ring, h + 1, () => {
    let s = block(main, 0, h, { facade: 'apartment', wall: CREAM, top: '#cfc9a8', shop: 'none', floor: 4.6, bay: 6, glass: ['#5b666b'], frame: '#bfb898' }).draw();
    for (let i = 0; i < main.length; i++) s += corrugate(main[i], main[(i + 1) % main.length], .3, h - .2, '#c9c19c');
    s += block(annex, 0, 4.6, { facade: 'plain', wall: '#e8dfae', top: '#d6ceA0', shop: 'none', floor: 4.6 }).draw();
    s += solid(toward(avg(annex), annex, 1.15), 4.6, 4.85, '#b9bcbc', '#c9cccc');                          // lean-to roof
    return s;
  });
}

function blackSwan() {
  const b = findBuilding(SWAN); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, f = frame(c, ax, L, W), h = 5.2;
  return obj(ring, h + 1, () => {
    let s = solid(ring, 0, h, '#f1f0eb', '#dddbd4');   // plain white walls, no windows but the entrance and the portholes
    // the glazed entrance on the long side away from the museum, under a deep white fascia with the black swan sign
    const t = -(W / 2 + .05), a = f.P(-L * .2, t), q = f.P(L * .3, t);   // the side away from the museum
    s += shape([[a[0], a[1], .3], [q[0], q[1], .3], [q[0], q[1], 3.3], [a[0], a[1], 3.3]], 'rgba(150,175,180,.6)', 0);
    for (let k = 0; k <= 4; k++) { const x = a[0] + (q[0] - a[0]) * k / 4, y = a[1] + (q[1] - a[1]) * k / 4; s += edge([x, y, .3], [x, y, 3.3], '#2d2d2f', .07); }
    const a2 = f.P(-L * .22, t - 1), q2 = f.P(L * .32, t - 1);
    s += solid(ccw([a, q, q2, a2]), 3.3, 4.1, '#f6f5f1', '#ebe9e3');
    const m = f.P(L * .05, t - 1.02); s += ball([m[0], m[1], 3.7], .28, soft('#1f1f22'), .2);                // the swan sign
    s += solid(ccw(frame(f.P(L * .38, t - .4), ax, 1.4, 1.4).ring), 0, h + .2, '#8e9193', '#9da0a2');        // grey stone pier
    for (const u of [-L * .4, -L * .32]) { const p = f.P(u, t - .02); s += ball([p[0], p[1], 3.9], .45, soft('#3b4246'), .2); }   // portholes
    return s;
  });
}

function motoDeck() {
  const b = findBuilding(MOTO); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, h = 3.2;
  const SCOOT = ['#2e3033', '#c9ccd0', '#b8433a', '#3c6e9a', '#f1f1ee', '#5a5d60'];
  return obj(ring, h + 3, () => {
    let s = block(ring, 0, h, { facade: 'office', wall: '#e6e5df', top: '#9c9a95', shop: 'none', floor: h, bay: 6, glass: ['#3a3633'], frame: '#e6e5df' }).draw();
    for (let i = 0; i < ring.length; i++) s += rail(ring[i], ring[(i + 1) % ring.length], h, h + 1.05, '#ecebe5');   // white stone balustrade
    // rows of scooters on the deck
    const inner = toward(c, ring, .9), nx = [-ax[1], ax[0]];
    for (let r = -W / 2 + 4, row = 0; r < W / 2 - 3; r += 3.2, row++) for (let u = -L / 2 + 3; u < L / 2 - 3; u += .8) {
      const x = c[0] + ax[0] * u + nx[0] * r, y = c[1] + ax[1] * u + nx[1] * r;
      if (!inPolyXY([x, y], inner)) continue;
      const col = SCOOT[(row * 7 + Math.round(u * 3)) % SCOOT.length];
      s += solid(ccw(frame([x, y], nx, 1.8, .55).ring), h + .3, h + 1.1, col, col);
    }
    for (const u of [-L / 3, 0, L / 3]) { const q = [c[0] + ax[0] * u + nx[0] * (W / 2 - 1.5), c[1] + ax[1] * u + nx[1] * (W / 2 - 1.5)]; s += stick([q[0], q[1], h], [q[0], q[1], h + 4.5], .08, '#5f6467') + ball([q[0], q[1], h + 4.7], .25, '#fff3c4'); }
    const sh = [c[0] - ax[0] * L * .3, c[1] - ax[1] * L * .3];
    s += solid(ccw(frame(sh, ax, 6, 3).ring), h, h + 2.6, '#cfc7a2', '#b9bcbc');                       // small shed
    return s;
  });
}
const inPolyXY = (p, r) => { let ins = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], q = r[j]; if ((a[1] > p[1]) !== (q[1] > p[1]) && p[0] < (q[0] - a[0]) * (p[1] - a[1]) / (q[1] - a[1]) + a[0]) ins = !ins; } return ins; };

LANDMARKS.push(
  { name: '第一風洞實驗館', ids: [WT1], build: windTunnel1 },
  { name: '第二風洞實驗館', ids: [WT2], build: windTunnel2 },
  { name: '黑天鵝展示廳', ids: [SWAN], build: blackSwan },
  { name: '五虎崗機車停車場', ids: [MOTO], build: motoDeck },
);
