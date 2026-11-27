/* ====================== District 4: 文學館, 海事博物館 and 書卷廣場 ======================
   海事博物館: Wikipedia (zh) 淡江大學海事博物館 — a ship-shaped building, first the 商船學館 given by 張榮發, opened as a
   museum on 6 June 1990, exhibits on three floors. Commons "Tamkang University Maritime Museum 2019-01" and "... Entrance":
   white concrete, a sloping hull wall with portholes, stepped decks, a bridge with a band of windows, a radar mast.
   The OSM outline is a square; the hull, decks and mast are fitted inside it by eye, bow toward the plaza (interpreted).
   書卷廣場 (OSM node 8919049653): 淡江時報 698期 — four asymmetric white bamboo-scroll sheets by alumnus 林貴榮, lawn all round;
   757期 — a white sculpture on the lawn facing the library, after ancient bamboo slips, nicknamed 蛋捲廣場; 1229期 — from
   above it reads as a turning motor, granite round it (2025 landscape renewal); 59698 (林貴榮) — designed in 1986. The
   Commons photo "Tamkang University Campus, New Taipei City 2019-01-23" shows tall white curved sheets on a round base.
   鍾靈化學館: 淡江時報 1070期 — six storeys above ground and one below. 會文館: 825期 — finished November 民國59年 (1970).
   淡江大學校園素材庫 photos: 鍾靈 white concrete with a deep slab edge at every floor; 會文館 white with balconies under a
   low dark hipped roof; 文學館 (OSM: six levels) salmon-tan with white balcony bands.
   藍白小鎮 (Wikidata label "Sidi Bou Said"): a photo the user supplied — a white single-storey café with brown timber
   windows and doors, a timber deck and a timber pergola with a translucent roof; the pergola's side is read by eye. */
const MUSEUM = 'w235418097', LIT_HALL = 'w285904595', CHEM = 'w235418085', HWEIWEN = 'w235418091', SIDI = 'w295946611';

function maritimeMuseum() {
  const b = findBuilding(MUSEUM); if (!b) return null;
  const { c, ax, L, W } = b.obb, f = frame(c, ax, 1, 1), P = (s, t, z) => [...f.P(s, t), z];
  const hullAt = (z, k) => {   // a plan ring of the hull at height z: k widens it toward the deck (the hull flares)
    const hl = L / 2 * (.82 + .18 * k), hw = W / 2 * (.72 + .26 * k), bow = hl + 3.2 * k + 1;
    return atZ(ccw([f.P(-hl, -hw), f.P(hl - 3, -hw), f.P(bow - 3, 0), f.P(hl - 3, hw), f.P(-hl, hw)]), z);
  };
  const W1 = '#f2f0ea', W2 = '#e9e6de';
  return obj(ccw(b.ring), 22, () => {
    const rings = [0, .5, 1].map((k, i) => hullAt([0, 3.5, 7][i], k));
    let s = '';
    for (let i = 0; i < 2; i++) s += loft(rings[i], rings[i + 1], n => tone(n, soft(W1)));
    s += shape(rings[2], W2, .6);                                          // main deck
    for (let k = -3; k <= 2; k++) for (const sg of [-1, 1]) {               // portholes along the hull
      const p = P(k * 3, sg * (W / 2 * .86 + .05), 4.6); s += ball(p, .38, soft('#56646a'), .2);
    }
    const deck1 = ccw(frame(f.P(-2.5, 0), ax, L * .62, W * .7).ring), deck2 = ccw(frame(f.P(-4.5, 0), ax, L * .4, W * .55).ring);
    s += block(deck1, 7, 11.4, { facade: 'office', wall: W1, top: W2, shop: 'none', floor: 4.4, bay: 2.6, glass: ['#5f6f75'], frame: '#c9c6bf' }).draw();
    s += block(deck2, 11.4, 15, { facade: 'glass', wall: W1, top: W2, shop: 'none', floor: 3.6, glass: ['#4f5e64', '#5a6a70'], frame: '#f4f2ec' }).draw();
    const m = P(-5.5, 0, 15);
    s += stick(m, [m[0], m[1], 21], .16, '#d9d7d0') + stick([...f.P(-5.5, -2.4), 19.5], [...f.P(-5.5, 2.4), 19.5], .09, '#d9d7d0');
    s += stick([...f.P(-4.3, -1.6), 20.4], [...f.P(-6.7, 1.6), 20.4], .07, '#cfcdc6') + ball([m[0], m[1], 21.2], .3, soft('#e4e2db'), .3);
    return s;
  });
}

// 書卷廣場: four asymmetric curved white sheets standing in a pinwheel on a round stepped base of grey stone
function scrollPlaza() {
  const x = 142, y = -13;
  return obj(polygon(x, y, 10, 16), 12, () => {
    let s = '';
    for (const [r, z0, z1, col] of [[9.5, 0, .35, '#a8a196'], [7.5, .35, .7, '#b4ada1'], [5.2, .7, 1.05, '#bfb8ac']])
      s += solid(polygon(x, y, r, 28), z0, z1, col, mix(col, '#ffffff', .15));
    const sheets = [[0, 2.3, 10.5], [Math.PI / 2, 2.0, 8.4], [Math.PI, 2.5, 11.6], [3 * Math.PI / 2, 1.9, 7.6]];
    const faces = [];
    for (const [a0, R, H] of sheets) {
      const n = 6, cx = x + Math.cos(a0) * 2.4, cy = y + Math.sin(a0) * 2.4;   // each sheet curls round its own axis
      for (let i = 0; i < n; i++) {
        const t0 = a0 + .4 + i / n * 1.35, t1 = a0 + .4 + (i + 1) / n * 1.35, lean = .3;
        const p = (t, z, k) => [cx + Math.cos(t) * (R + k), cy + Math.sin(t) * (R + k), z];
        const q = [p(t0, 1.05, 0), p(t1, 1.05, 0), p(t1, H * (1 - i / n * .25), lean * (i + 1) / n * 2), p(t0, H * (1 - i / n * .25) + .2, lean * i / n * 2)];
        faces.push({ q, at: avg(q) });
      }
    }
    faces.sort((a, b) => depthOf(a.at) - depthOf(b.at));
    for (const fc of faces) { const nn = vNewell(fc.q); s += shape(fc.q, tone(vis(nn) ? nn : nn.map(v => -v), soft('#f6f4ee')), .55); }
    return s;
  });
}

// 鍾靈化學館 (素材庫 photos): white concrete, a deep slab edge at every floor over recessed dark windows, upper floors set back
function chungLing() {
  const b = findBuilding(CHEM); if (!b) return null;
  const ring = ccw(b.ring), c = b.obb.c, F = 3.6;
  return obj(ring, 6 * F + 1, () => {
    let s = '';
    for (let k = 0; k < 6; k++) {
      const r = toward(c, ring, k < 4 ? 1 : .86 - (k - 4) * .06);
      s += block(r, k * F, (k + 1) * F, { facade: 'office', wall: '#eeede8', top: '#dcdbd5', shop: 'none', floor: F, bay: 2.8, glass: ['#55616a', '#5d6a72'], frame: '#e4e3de' }).draw();
      s += solid(toward(c, r, 1.035), (k + 1) * F - .45, (k + 1) * F, '#f3f2ee', '#e2e1dc');
    }
    return s;
  });
}

// 會文館 (素材庫 photos): white concrete with balconies under a low dark-grey hipped roof with deep eaves
function hweiWen() {
  const b = findBuilding(HWEIWEN); if (!b) return null;
  const ring = ccw(b.ring), F = 3.4, h = 4 * F;
  return obj(ring, h + 5, () => block(ring, 0, h, { facade: 'apartment', wall: '#eae9e3', top: '#d4cec2', shop: 'none', floor: F, bay: 3.2, glass: GLASS, frame: '#8a857c', balcony: 'some' }).draw() +
    roofOver(b.obb, h, { roof: 'hipped', pitch: 16, eaves: 1.3, roofColour: '#5f6468', roofTex: 'kawara' })());
}

function sidiBouSaid() {
  const b = findBuilding(SIDI); if (!b) return null;
  const ring = ccw(b.ring), c = b.obb.c;
  const { ax, L, W } = b.obb, nx = [-ax[1], ax[0]], pg = [c[0] + nx[0] * (W / 2 + 3), c[1] + nx[1] * (W / 2 + 3)];
  return obj(toward(c, ring, 1.6), 6, () => {
    let s = solid(toward(c, ring, 1.35), 0, .18, '#b08a63', '#c29c72');                            // timber deck
    s += block(ring, .18, 3.8, { facade: 'civic', wall: '#f6f4ef', top: '#ece9e1', shop: 'none', floor: 3.6, bay: 2.6, glass: ['#8a5a3a', '#9b6a45'], frame: '#7a4e2e' }).draw();
    s += solid(toward(c, ring, 1.06), 3.8, 4.2, '#f6f4ef', '#ece9e1');                                // white eave
    const P = (u, v) => [pg[0] + ax[0] * u + nx[0] * v, pg[1] + ax[1] * u + nx[1] * v];             // the pergola beside it
    for (const u of [-L / 2 + .5, 0, L / 2 - .5]) for (const v of [-2.2, 2.2]) { const q = P(u, v); s += stick([q[0], q[1], .18], [q[0], q[1], 3.9], .1, '#8a6748'); }
    for (const v of [-2.2, 2.2]) { const a = P(-L / 2, v), b2 = P(L / 2, v); s += stick([a[0], a[1], 3.95], [b2[0], b2[1], 3.95], .1, '#8a6748'); }
    s += shape(atZ([P(-L / 2, -2.6), P(L / 2, -2.6), P(L / 2, 2.6), P(-L / 2, 2.6)], 4.05), 'rgba(232,236,236,.55)', 0);   // translucent roof
    return s;
  });
}

LANDMARKS.push(
  { name: '海事博物館', ids: [MUSEUM], build: maritimeMuseum },
  { name: '書卷廣場', ids: [], build: scrollPlaza },
  { name: '文學館', ids: [LIT_HALL], build: plainHall(LIT_HALL, 6, 3.6, { facade: 'apartment', wall: '#d8b296', top: '#d6d1c6', bay: 3.2, glass: GLASS, frame: '#f4f2ec', trim: '#f4f2ec', balcony: 'some' }) },
  { name: '鍾靈化學館', ids: [CHEM], build: chungLing },
  { name: '會文館', ids: [HWEIWEN], build: hweiWen },
  { name: '藍白小鎮', ids: [SIDI], build: sidiBouSaid },
);
