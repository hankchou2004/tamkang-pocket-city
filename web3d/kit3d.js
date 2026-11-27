/* kit3d: the Pocket City drawing kit's vocabulary, rebuilt for three.js.
   The hand-built landmarks (landmarks/*.js) were written against the 2D kit: block(), roofOver(), loft(), shape(),
   stick(), ball() … each returning SVG text. Here the same functions add solid geometry to a collector instead and
   return '' so the landmark code runs unchanged. Colours stay the kit's flat hex colours; the three-step light/mid/dark
   shading that the 2D kit painted per face (tone/soft) is done by the shader from each face's normal and the sun.
   Coordinates: plot metres, x/y on the ground, z up (as in the 2D kit). */

/* ---------- colours ---------- */
const hex2rgb = h => { if (typeof h !== 'string') return [0.8, 0.8, 0.8, 1];
  if (h.startsWith('rgba') || h.startsWith('rgb')) { const v = h.match(/[\d.]+/g).map(Number); return [v[0] / 255, v[1] / 255, v[2] / 255, v[3] ?? 1]; }
  let s = h.slice(1); if (s.length === 3) s = s.split('').map(c => c + c).join('');
  const n = parseInt(s.slice(0, 6), 16); return [(n >> 16) / 255, (n >> 8 & 255) / 255, (n & 255) / 255, 1]; };
const rgb2hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return rgb2hex([0, 1, 2].map(i => x[i] + (y[i] - x[i]) * t)); };
const soft = c => ({ l: c, m: mix(c, '#887997', .18), d: mix(c, '#705f81', .33), base: c });
const baseOf = m => (m && typeof m === 'object') ? (m.base || m.l) : m;
const tone = (n, m) => baseOf(m);            // shading happens in the shader
const toneI = tone;
const lineOf = (c, plant) => mix(c, '#51465a', plant ? .38 : .53);
// colours that are light sources: they are not darkened at night or in shade (same set as the 2D kit)
const LIT_SET = new Set(['#ffe6ec', '#fbd3dd', '#ffd98a', '#ffe7a8', '#fff3c4', '#fbefc8', '#f6c445', '#ffb85c', '#fff8e0', '#f2c94c', '#fde9b0', '#ffcf7a', '#ff8a3d', '#f26a2e', '#ffc069']);

/* ---------- small geometry helpers (same names as the 2D kit) ---------- */
const atZ = (r, z) => r.map(p => [p[0], p[1], z]);
const avg = ps => ps.reduce((s, p) => [s[0] + p[0] / ps.length, s[1] + p[1] / ps.length, (s[2] || 0) + (p[2] || 0) / ps.length], [0, 0, 0]);
const polygon = (x, y, r, n, angle = 0) => Array.from({ length: n }, (_, i) => [x + r * Math.cos(i * 2 * Math.PI / n + angle), y + r * Math.sin(i * 2 * Math.PI / n + angle)]);
function rect(x, y, w, d) { return [[x - w / 2, y - d / 2], [x + w / 2, y - d / 2], [x + w / 2, y + d / 2], [x - w / 2, y + d / 2]]; }
function ccw(r) { const a = r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0); return a < 0 ? r.slice().reverse() : r; }
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], (a[2] || 0) - (b[2] || 0)];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const vNewell = pts => { let x = 0, y = 0, z = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length];
    x += (a[1] - b[1]) * ((a[2] || 0) + (b[2] || 0)); y += ((a[2] || 0) - (b[2] || 0)) * (a[0] + b[0]); z += (a[0] - b[0]) * (a[1] + b[1]); }
  return norm3([x, y, z]); };
const vis = () => true;           // in 3D every side exists; the depth buffer hides the far ones
const depthOf = () => 0;
let UPX = 0.1;                    // "close enough for fine detail": landmarks draw their small parts
const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); };
const pickOf = (v, key) => Array.isArray(v) ? v[hashStr(String(key)) % v.length] : v;

/* ---------- the collector ----------
   flat:  triangles with a vertex colour (shaded by the toon shader)
   wall:  textured façade quads (u along the wall in bays, v up in storeys, a tile in the façade atlas)
   glass: see-through triangles (rgba colours)
   ink:   line segments (the kit's ink outlines), with their colour */
const GEO = { flat: { p: [], n: [], c: [], lit: [] }, wall: { p: [], n: [], uv: [], tile: [], c: [] }, glass: { p: [], c: [] }, ink: { p: [], c: [] } };
function geoReset() { for (const k in GEO) for (const a in GEO[k]) GEO[k][a] = []; }

function pushTri(a, b, c, colour, nrm) {
  const rgba = hex2rgb(colour);
  if (rgba[3] < 0.99) { const G = GEO.glass; for (const p of [a, b, c]) { G.p.push(p[0], p[1], p[2] || 0); G.c.push(...rgba); } return; }
  const G = GEO.flat, lit = LIT_SET.has(String(colour).toLowerCase()) ? 1 : 0;
  for (const p of [a, b, c]) { G.p.push(p[0], p[1], p[2] || 0); G.n.push(...nrm); G.c.push(rgba[0], rgba[1], rgba[2]); G.lit.push(lit); }
}
// a flat polygon in 3D (convex or not): triangulated in its own plane
function polyFace(pts, colour, outward = null) {
  if (pts.length < 3) return;
  let n = vNewell(pts);
  if (!isFinite(n[0]) || (n[0] === 0 && n[1] === 0 && n[2] === 0)) return;
  if (outward && dot3(n, outward) < 0) { n = n.map(v => -v); }
  // project to the polygon's plane
  const ax = Math.abs(n[0]) > .9 ? [0, 1, 0] : [1, 0, 0], u = norm3(cross3(n, ax)), v = cross3(n, u);
  const p2 = pts.map(p => new THREE.Vector2(dot3(p.length > 2 ? p : [...p, 0], u), dot3(p.length > 2 ? p : [...p, 0], v)));
  let tris;
  if (pts.length === 3) tris = [[0, 1, 2]]; else { try { tris = THREE.ShapeUtils.triangulateShape(p2, []); } catch (e) { tris = []; } }
  for (const [i, j, k] of tris) {
    const A = pts[i], B = pts[j], C = pts[k], fn = vNewell([A, B, C]);
    // keep the winding facing the polygon normal so back-face culling is not needed (we render both sides anyway)
    pushTri(A, B, C, colour, dot3(fn, n) >= 0 ? n : n);
  }
  return n;
}
function inkLoop(pts, colour, closed = true) {
  const c = hex2rgb(colour), G = GEO.ink;
  for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) { const a = pts[i], b = pts[(i + 1) % pts.length];
    G.p.push(a[0], a[1], a[2] || 0, b[0], b[1], b[2] || 0); G.c.push(c[0], c[1], c[2], c[0], c[1], c[2]); }
}

/* ---------- the kit's drawing vocabulary ---------- */
// shape(points, colour, ink width): a filled polygon with an ink outline (w = 0: no outline)
const shape = (pts, c, w = .9) => { const col = baseOf(c); polyFace(pts, col); if (w && hex2rgb(col)[3] > .99) inkLoop(pts, lineOf(col)); return ''; };
const face = (pts, c) => { polyFace(pts, baseOf(c)); return ''; };
const line = (pts, w = .9) => { inkLoop(pts, '#5d5064', false); return ''; };
const edge = (a, b, c, width) => { inkLoop([a, b], baseOf(c), false); return ''; };
// loft between two rings: the side strips, coloured by colour(normal)
function loft(A, B, colour, flip = false) {
  const n = A.length, cen = avg(A.concat(B));
  for (let i = 0; i < n; i++) {
    const a0 = A[i], a1 = A[(i + 1) % n], b1 = B[(i + 1) % n], b0 = B[i];
    let nr = norm3(cross3(sub3(a1, a0), sub3(b0, a0)));
    if (!isFinite(nr[0])) continue;
    if (dot3(nr, sub3(avg([a0, a1, b1, b0]), cen)) < 0) nr = nr.map(v => -v);
    if (flip) nr = nr.map(v => -v);
    const col = baseOf(typeof colour === 'function' ? colour(nr) : colour);
    pushTri(a0, a1, b1, col, nr); pushTri(a0, b1, b0, col, nr);
  }
  return '';
}
// a stick (post, column, rail) between two points, radius r
function stick(a, b, r, col, w = .45) {
  const c = baseOf(col), d = sub3(b, a), L = Math.hypot(...d); if (L < 1e-4) return '';
  const k = norm3(d), t = Math.abs(k[2]) < .9 ? [0, 0, 1] : [1, 0, 0], u = norm3(cross3(k, t)), v = cross3(k, u), N = 6;
  const ring = (p) => Array.from({ length: N }, (_, i) => { const an = i / N * Math.PI * 2, cs = Math.cos(an) * r, sn = Math.sin(an) * r;
    return [p[0] + u[0] * cs + v[0] * sn, p[1] + u[1] * cs + v[1] * sn, (p[2] || 0) + u[2] * cs + v[2] * sn]; });
  loft(ring(a), ring(b), c);
  if (r > .05 && L > .4) { inkLoop([a, b].map(p => p), lineOf(c), false); }
  return '';
}
// a ball (lantern, shrub, finial), colour a soft() object or a colour
const SPHERE = (() => { const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position; const t = [];
  for (let i = 0; i < p.count; i += 3) t.push([[p.getX(i), p.getY(i), p.getZ(i)], [p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)], [p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)]]); return t; })();
function ball(c, r, m, w = .9) {
  const col = baseOf(m);
  for (const tri of SPHERE) { const P = tri.map(q => [c[0] + q[0] * r, c[1] + q[1] * r, c[2] + q[2] * r]);
    const rgba = hex2rgb(col); if (rgba[3] < .99) { pushTri(...P, col, [0, 0, 1]); continue; }
    const G = GEO.flat, lit = LIT_SET.has(String(col).toLowerCase()) ? 1 : 0;
    for (const q of tri) { G.p.push(c[0] + q[0] * r, c[1] + q[1] * r, c[2] + q[2] * r); G.n.push(...norm3(q)); G.c.push(rgba[0], rgba[1], rgba[2]); G.lit.push(lit); } }
  return '';
}
function peak(r, base, tip, col) {
  for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; shape([[...a, base], [...b, base], tip], col, .65); }
  return '';
}
// light on the ground from a lamp: a soft disc that shows at night
const GLOWS = [];
function lightPool(x, y, r, col = '#ffcf7a', a = .5, z = .03) { GLOWS.push({ x, y, r, col, a, z }); return ''; }

/* ---------- part ordering: not needed with a depth buffer ---------- */
const planOrder = parts => parts.map(p => typeof p.svg === 'function' ? p.svg() : (p.svg || '')).join('');
const planSort = items => items.map(p => typeof p.svg === 'function' ? p.svg() : (p.svg || '')).join('');
const obj = (fp, h, draw) => ({ fp, h, draw });

/* ---------- walls with painted elevations, flat roofs, pitched roofs ---------- */
const LEVEL = (typeof SCENE !== 'undefined' && SCENE.meta && SCENE.meta.level) || 3.2;
const STYLES = (typeof CITY !== 'undefined' && CITY.styles) || {};
function makeStyle(o = {}) { return { facade: 'plain', wall: ['#eee2ca'], roofColour: ['#c8c4b8'], roof: 'flat', pitch: 30, eaves: .45, levels: 3, floor: LEVEL, shop: 'none', parapet: .5, ...(STYLES.default || {}), shop: 'none', ...o }; }

// façade atlas: one tile per (façade, wall, glass, frame, trim, balcony); a tile is one bay wide and one storey tall
const ATLAS = { size: 2048, tile: 64, list: [], index: new Map() };
function facadeTile(st, wallCol) {
  const glass = pickOf(st.glass || ['#a9bcc1'], wallCol), key = [st.facade, wallCol, glass, st.frame || '', st.trim || '', st.balcony || '', st.shutters ? pickOf(st.shutters, 1) : ''].join('|');
  if (ATLAS.index.has(key)) return ATLAS.index.get(key);
  const i = ATLAS.list.length; ATLAS.list.push({ key, facade: st.facade, wall: wallCol, glass, frame: st.frame || mix(wallCol, '#51465a', .45), trim: st.trim || null, balcony: st.balcony || null, shutters: st.shutters ? pickOf(st.shutters, 1) : null });
  ATLAS.index.set(key, i); return i;
}
// the walls of a ring from z0 to z1, painted with the style's façade
function walls3d(ring, z0, z1, st, body) {
  const r = ccw(ring), tile = facadeTile(st, body), bay = st.bay || 3.2, floor = st.floor || LEVEL, G = GEO.wall, c = hex2rgb(body);
  const textured = st.facade !== 'plain' || (z1 - z0) > 2.6;
  let along = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < .05) continue;
    const n = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len, 0];      // outward for a ccw ring
    const bays = Math.max(1, Math.round(len / bay)), u1 = bays, v0 = 0, v1 = (z1 - z0) / floor;
    const P = [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]], UV = [[0, v0], [u1, v0], [u1, v1], [0, v1]];
    for (const k of [0, 1, 2, 0, 2, 3]) { G.p.push(...P[k]); G.n.push(...n); G.uv.push(...UV[k]); G.tile.push(textured ? tile : -1); G.c.push(c[0], c[1], c[2]); }
    inkLoop(P, lineOf(body));
    along += len;
  }
}
function block(ring, z0, z1, o = {}) {
  const st = makeStyle(o), body = pickOf(st.wall, ring.join());
  return { fp: ring, z1, draw: () => { walls3d(ring, z0, z1, st, body); shape(atZ(ccw(ring), z1), pickOf(o.top || st.flatRoof || st.roofColour, ring.join()), .7); return ''; } };
}
// a gabled or hipped roof over the rectangle {c, ax, L, W} from wall height `wall`
function pitchedRoof3d({ c, ax, L, W }, wall, st, kind, colour) {
  const nx = [-ax[1], ax[0]], e = st.eaves ?? .45, P = (s, t, z) => [c[0] + ax[0] * s + nx[0] * t, c[1] + ax[1] * s + nx[1] * t, z];
  const hl = L / 2 + e, hw = W / 2 + e, rise = st.rise || (W / 2 + e) * Math.tan((st.pitch || 30) * Math.PI / 180), top = wall + rise;
  const gable = st.wall ? pickOf(st.wall, 'g') : '#efe5d1';
  if (kind === 'hipped' || kind === 'pyramidal') {
    const r = kind === 'pyramidal' ? 0 : Math.max(0, hl - hw);
    shape([P(-hl, -hw, wall), P(hl, -hw, wall), P(r, 0, top), P(-r, 0, top)], colour, .6);
    shape([P(hl, hw, wall), P(-hl, hw, wall), P(-r, 0, top), P(r, 0, top)], colour, .6);
    shape([P(hl, -hw, wall), P(hl, hw, wall), P(r, 0, top)], colour, .6);
    shape([P(-hl, hw, wall), P(-hl, -hw, wall), P(-r, 0, top)], colour, .6);
  } else {   // gabled: two slopes and two gable triangles
    shape([P(-hl, -hw, wall), P(hl, -hw, wall), P(hl, 0, top), P(-hl, 0, top)], colour, .6);
    shape([P(hl, hw, wall), P(-hl, hw, wall), P(-hl, 0, top), P(hl, 0, top)], colour, .6);
    shape([P(L / 2, -W / 2, wall), P(L / 2, W / 2, wall), P(L / 2, 0, top - e * Math.tan((st.pitch || 30) * Math.PI / 180))], gable, .6);
    shape([P(-L / 2, W / 2, wall), P(-L / 2, -W / 2, wall), P(-L / 2, 0, top - e * Math.tan((st.pitch || 30) * Math.PI / 180))], gable, .6);
  }
  // roof tile lines (kawara / tiles): thin ink strokes down each slope
  if (st.roofTex) { const lc = mix(colour, '#3d3a44', .25), step = .55;
    for (let s = -hl + step / 2; s < hl; s += step) for (const sg of [-1, 1]) {
      const r = (kind === 'hipped') ? Math.max(0, hl - hw) : hl; if (kind === 'hipped' && Math.abs(s) > r + hw * .98) continue;
      inkLoop([P(s, sg * hw, wall + .03), P(Math.max(-r, Math.min(r, s)), 0, top + .03)].map(p => p), lc, false); }
  }
  return '';
}
function roofOver({ c, ax, L, W }, wall, o = {}) {
  const st = makeStyle(o), kind = o.roof || 'gabled', colour = pickOf(st.roofColour, c.join());
  return () => pitchedRoof3d({ c, ax, L, W }, wall, st, kind, colour);
}

/* ---------- the scene's buildings ---------- */
const findBuilding = id => SCENE.buildings.find(b => b.id === id) || SCENE.buildings.find(b => b.of === id);
