/* ====================== District 6: 松濤 halls and 教育館 ======================
   松濤館 (the women's halls): 淡江時報 1050期 — opened 8 November 民國52年 (1963), one of the oldest buildings on campus;
   941期 — renovated in 2014. 文錙藝術中心: 441期 — on the ground floor of 松濤館, two storeys, about 180 坪, made from the old
   badminton hall; 445期 — enlarged toward the halls, opened 7 November (the 50th anniversary). Commons "Sung-tao Hall
   20250804" (Wikidata: 2nd Sung-tao Hall): white walls with deep horizontal window slots, solar panels on the roof, and a
   two-storey glass box with blue, red and yellow-green panels at its foot (the art centre's front, Commons
   "淡江大學文錙藝術中心", 2026). "Third Sung-tao Hall 20250804": a white frame with tan panels round each window, dark
   grey bands at the floor lines, a glazed ground floor, solar canopies on the roof. "Fourth Sung-tao Hall 20250804":
   light blue walls with white vertical fins. Photos the user supplied (松濤四五館): 4館 and 5館 are both four storeys,
   bright turquoise with white window surrounds and white fins, and the 文錙 glass front is dark green-grey glass hung
   with posters. 松濤1館: no photo from the ground; an aerial photo (萌芽悠遊網, 2021-04-22, viewed only, not stored) shows it as
   the westernmost of the group, in front of 外國語文大樓: beige walls with a grid of deep balcony recesses, six storeys like
   3館 beside it (which looked the same in 2021, before the work seen in its 2025 photo), and water tanks and plant on the
   flat roof rather than solar canopies. Drawn like 3館; the walls follow 3館's present look (whether 1館 was redone too is
   推定), the tanks and plant boxes are placed by eye.
   教育館 (OSM 教育大樓, ref ED): 848期 — the old 自強館 women's hall rebuilt for the College of Education by alumnus
   林洲民, keeping its boxy form; a translucent glass louvre skin over the walls and a green roof garden with a timber deck
   on the sixth floor; 854期 — opened with a ceremony. Photos in 淡江大學校園素材庫 (教育館): the skin is vertical glass
   fins in many greens and yellow-greens over the upper floors, a white band at the foot with large EDUCATION letters
   (not drawn); the fin spacing and the roof garden layout are illustrative. */
const ST1 = 'w235418156', ST2 = 'w454159667', ST3 = 'w454159657', ST4 = 'w235418161', ST5 = 'w235418162', EDU = 'w235418109';
const ST_WHITE = '#f0eee8', ST_TAN = '#d6c29c';

// 3館 (and 1館, drawn alike): glazed white ground floor, tan-panelled floors with dark bands, solar canopies along the spine
// (roof 'tanks': water tanks and plant boxes at those stations instead, as on 1館 in the 2021 aerial photo)
function sawtoothHall(id, levels, solar, roof = 'solar') {
  return () => {
    const b = findBuilding(id); if (!b) return null;
    const ring = ccw(b.ring), F = 3.2, h = levels * F;
    return obj(ring, h + 2.5, () => {
      let s = block(ring, 0, F, { facade: 'glass', wall: ST_WHITE, top: ST_WHITE, shop: 'none', floor: F, glass: ['#8fa3a8', '#9cb0b4'], frame: '#f4f3ef' }).draw();
      s += block(ring, F, h, { facade: 'office', wall: ST_TAN, top: '#d7d4cc', shop: 'none', floor: F, bay: 2.6, glass: ['#6c7a80', '#76858a'], frame: '#f4f2ec', trim: '#6f6e69' }).draw();
      for (const st of solar) {
        const p = spine(b, st), q = spine(b, st + 4), d = [q[0] - p[0], q[1] - p[1]], n = Math.hypot(d[0], d[1]) || 1, u = [d[0] / n, d[1] / n];
        if (roof === 'tanks') { const v = [-u[1], u[0]]; s += roofTanks([p[0] + v[0] * 1.6, p[1] + v[1] * 1.6], u, 3, h) + roofBox([p[0] - v[0] * 2.2, p[1] - v[1] * 2.2], u, 5, 2.4, h); }
        else s += solarArray(p, u, 8, 5, h);
      }
      return s;
    });
  };
}

// 松濤2館: white six-storey hall; the 文錙藝術中心 glass box sits in the notch on its NE face (cf. Commons photo)
function songtao2() {
  const b = findBuilding(ST2); if (!b) return null;
  const ring = ccw(b.ring), F = 3.2, h = 6 * F;
  const A = [171.9, -176.0], B = [187.0, -187.7], n = [.613, .79], D = 4;   // notch edge from OSM, box depth (interpreted)
  const hall = { svg: () => block(ring, 0, h, { facade: 'office', wall: ST_WHITE, top: '#dad7cf', shop: 'none', floor: F, bay: 3.2, glass: ['#4f5a5e', '#58646a'], frame: '#d9d6ce', trim: '#f6f5f1' }).draw() +
      solarArray([164, -186], [.613, .79], 12, 9, h) + solarArray([136, -192], [-.7316, -.6817], 12, 7, h) };
  const PANELS = ['#4f615c', '#56685f', '#4a5a57', '#5a6c64', '#4f615c', '#56685f'];   // dark green-grey glass (photos 2022-2026)
  const box = { svg: () => {
    let s = '';
    for (let k = 0; k < PANELS.length; k++) {
      const t0 = k / PANELS.length, t1 = (k + 1) / PANELS.length, P = t => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
      const a = P(t0), c = P(t1), fp = ccw([a, c, [c[0] + n[0] * D, c[1] + n[1] * D], [a[0] + n[0] * D, a[1] + n[1] * D]]);
      s += loft(atZ(fp, 0), atZ(fp, 7.6), nn => tone(nn, soft(PANELS[k])));
    }
    const all = ccw([A, B, [B[0] + n[0] * D, B[1] + n[1] * D], [A[0] + n[0] * D, A[1] + n[1] * D]]);
    s += shape(atZ(all, 7.6), '#cfd2d0', .5);
    return s;
  } };
  return obj(ring, h + 2.5, () => vis([n[0], n[1], 0]) ? hall.svg() + box.svg() : box.svg() + hall.svg());
}

// 松濤4館: light blue walls with white vertical fins on both long faces
function songtao4() {
  const b = findBuilding(ST4); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, F = 3.2, h = 4 * F, f = frame(c, ax, L, W);
  const fins = [];
  for (const side of [-1, 1]) for (let sx = -L / 2 + 1.5; sx <= L / 2 - 1.4; sx += 3) {
    const q = f.P(sx, side * (W / 2 + .35)); fins.push({ side, fp: ccw(frame(q, ax, .3, .7).ring) });
  }
  return obj(ring, h + 1, () => {
    const body = block(ring, 0, h, { facade: 'stucco', wall: '#45b6cb', top: '#d9dcd8', shop: 'none', floor: F, bay: 3, glass: ['#5f7178', '#6a7c82'], frame: '#f4f4f0', trim: '#f4f4f0', shutters: ['#f4f4f0'] }).draw();
    let back = '', front = '';
    for (const fn of fins) { const sv = solid(fn.fp, 0, h + .3, '#f4f3ef', '#ecebe6'); if (vis([f.nx[0] * fn.side, f.nx[1] * fn.side, 0])) front += sv; else back += sv; }
    return back + body + front;
  });
}

// 教育館: five storeys behind a translucent glass louvre skin; a green roof garden with a timber deck on top
function education() {
  const b = findBuilding(EDU); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, W } = b.obb, F = 3.6, h = 5 * F;
  return obj(ring, h + 2, () => {
    let s = block(ring, 0, h, { facade: 'office', wall: '#f1f0ea', top: '#d6d8d2', shop: 'none', floor: F, bay: 2.8, glass: ['#5d6d62', '#677868'], frame: '#e9ebe4' }).draw();
    // the skin: vertical glass fins in several greens from the first floor up (素材庫 photos); the white band at the foot stays bare
    const FINS = ['#7fb24a', '#a6c84f', '#5f9a44', '#c5d86a', '#8fbf5a'];
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i], q = ring[(i + 1) % ring.length], len = Math.hypot(q[0] - p[0], q[1] - p[1]); if (len < 1) continue;
      const u = [(q[0] - p[0]) / len, (q[1] - p[1]) / len], n = [u[1], -u[0]];
      for (let t = .6, k = 0; t < len - .3; t += 1.1, k++) {
        const x = p[0] + u[0] * t + n[0] * .45, y = p[1] + u[1] * t + n[1] * .45, col = FINS[(i * 7 + k * 3) % FINS.length];
        s += solid(ccw(frame([x, y], u, .7, .12).ring), F, h + .4, col, col);
      }
    }
    s += shape(atZ(toward(c, ring, .93), h + .05), '#a8c58c', .4);                                            // roof garden
    s += solid(ccw(frame(c, ax, 16, W * .35).ring), h, h + .25, '#b58a5c', '#c89c6c');                       // timber deck
    for (const k of [-24, -16, 12, 20, 26]) { const q = [c[0] + ax[0] * k, c[1] + ax[1] * k]; s += ball([q[0], q[1], h + .9], 1, soft('#7aa266'), .3); }
    s += loft(atZ(toward(c, ring, .985), h), atZ(toward(c, ring, .985), h + 1.1), () => 'rgba(210,228,226,.4)');   // balustrade
    return s;
  });
}

LANDMARKS.push(
  { name: '松濤1館', ids: [ST1], build: sawtoothHall(ST1, 6, [-12, 6], 'tanks') },
  { name: '松濤2館 · 文錙藝術中心', ids: [ST2], build: songtao2 },
  { name: '松濤3館', ids: [ST3], build: sawtoothHall(ST3, 6, [-24, -9, 7, 21]) },
  { name: '松濤4館', ids: [ST4], build: songtao4 },
  { name: '松濤5館', ids: [ST5], build: plainHall(ST5, 4, 3.2, { facade: 'stucco', wall: '#45b6cb', top: '#d9dcd8', bay: 3, glass: ['#5f7178', '#6a7c82'], frame: '#f4f4f0', trim: '#f4f4f0', shutters: ['#f4f4f0'] }) },
  { name: '教育館', ids: [EDU], build: education },
);
