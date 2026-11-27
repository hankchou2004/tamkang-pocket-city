/* The campus on a MapLibre map, every building drawn in the Pocket City manner, with the phone app's features.
   - Ground (roads, water, green, labels): OpenFreeMap vector tiles, restyled in the paper palette; the map has no edge.
     The campus zone (work/zones.json) is a tinted area with a double edge line.
   - Inside the plot: the buildings and trees as on the 3D page (hand-built landmarks through web3d/kit3d.js, the other
     outlines from scene.json with city.json's style rules, the trees, lamps, benches, people and cars).
   - Outside the plot: the buildings in the loaded tiles, drawn with the same generic building code, a slice per frame.
   - As web3d/main3d.js: the real sun for 淡水 now (shadows inside the plot), dusk and night (windows and lanterns light
     up, the map darkens), the weather now from Open-Meteo (rain, drizzle, fog), ?at= and ?wx= to fix them.
   - The app's interface: the title card with the weather, a tap on a building flies to it, the button back to the campus.
   Data in the page: SCENE (plot metres), CITY, CAMPUS, ZONES, LIVE_CFG, LANDMARKS. */
(() => {
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const SEASON = window.SEASON = { id: 'summer-clear-0', leaves: 'summer', night: 0 };   // the landmarks read the season
const META = SCENE.meta, ROT = META.rotation * Math.PI / 180, HALF = META.half;
const phone = innerWidth <= 760 || (matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) <= 760);
// plot metres <-> longitude/latitude (as tools/build.py: metres east/north of the plot centre, turned by the plot's rotation)
const KX = 111320 * Math.cos(META.lat * Math.PI / 180), KY = 110574;
const toLngLat = ([x, y]) => { const e = x * Math.cos(ROT) - y * Math.sin(ROT), n = x * Math.sin(ROT) + y * Math.cos(ROT); return [META.lon + e / KX, META.lat + n / KY]; };
const toPlot = ([lng, lat]) => { const e = (lng - META.lon) * KX, n = (lat - META.lat) * KY; return [e * Math.cos(ROT) + n * Math.sin(ROT), -e * Math.sin(ROT) + n * Math.cos(ROT)]; };
const enToPlot = (e, n) => [e * Math.cos(ROT) + n * Math.sin(ROT), -e * Math.sin(ROT) + n * Math.cos(ROT)];

/* ---------------- colours by day and night (the 2D kit's night colouring) ---------------- */
const nightHex = (c, k, wet = 0) => { let [r, g, b] = hex2rgb(c); if (wet) { r *= .93; g *= .94; b *= .96; }
  return rgb2hex([r * (1 - .5 * k) + .047 * k, g * (1 - .52 * k) + .063 * k, b * (1 - .4 * k) + .157 * k]); };

/* ---------------- the base map, in the paper palette ---------------- */
const PAPER = '#f6f3e9', GRASS = '#bcd59b', WOOD = '#a9c98a', WATER = '#94c0c2', ROAD = '#fffcf2', ROAD_EDGE = '#cbbfae', BLOCK = '#eee6d6', INK = '#263c35';
const PAINTS = [];   // [layer, property, day colour, is ground]: recoloured for dusk, night and rain
function restyle(map) {
  const set = (id, prop, c, ground = true) => { PAINTS.push([id, prop, c, ground]); map.setPaintProperty(id, prop, c); };
  for (const l of map.getStyle().layers) {
    const id = l.id, sl = l['source-layer'] || '';
    try {
      if (l.type === 'background') set(id, 'background-color', PAPER);
      else if (sl === 'water' && l.type === 'fill') set(id, 'fill-color', WATER);
      else if (sl === 'waterway' && l.type === 'line') set(id, 'line-color', WATER);
      else if ((sl === 'park' || sl === 'landcover' || sl === 'landuse') && l.type === 'fill') {
        const green = /wood|forest|grass|park|pitch|cemetery|garden/.test(id);
        set(id, 'fill-color', /wood|forest/.test(id) ? WOOD : green ? GRASS : '#ece5d4');
        // other land use (homes, schools, hospitals) stays paper, as on the 3D page, so the campus zone shows
        map.setPaintProperty(id, 'fill-opacity', /wood|forest/.test(id) ? .9 : green ? .8 : 0);
      }
      else if (sl === 'transportation' && l.type === 'line') set(id, 'line-color', /casing|outline/.test(id) ? ROAD_EDGE : /rail/.test(id) ? '#b9aea3' : ROAD);
      else if (sl === 'building' && l.type === 'fill') set(id, 'fill-color', BLOCK);
      else if (/shield/.test(id)) map.setLayoutProperty(id, 'visibility', 'none');   // route number plates: white boxes at night, of little use on a campus map
      else if (l.type === 'symbol') { map.setPaintProperty(id, 'text-color', INK); map.setPaintProperty(id, 'text-halo-color', '#fffcf2'); }
    } catch (_) {}
  }
}
// the campus zone: a tint on the ground (under the roads) and a double edge line
function addZones(map) {
  const layers = map.getStyle().layers, firstRoad = layers.find(l => l['source-layer'] === 'transportation');
  const firstGround = layers.find(l => l.type === 'fill' && ['park', 'landcover', 'landuse'].includes(l['source-layer']));   // the tint goes under the lawns
  for (const z of ZONES) {
    const r = z.ring.map(toLngLat); if (r.length < 3) continue;
    const ring = r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r : [...r, r[0]];
    map.addSource('zone-' + z.id, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } } });
    map.addLayer({ id: 'zone-' + z.id, type: 'fill', source: 'zone-' + z.id, paint: { 'fill-color': z.colour, 'fill-opacity': .9 } }, (firstGround || firstRoad || {}).id);
    map.addLayer({ id: 'zone-' + z.id + '-edge', type: 'line', source: 'zone-' + z.id, paint: { 'line-color': z.edge, 'line-width': 2.2, 'line-gap-width': 2.5, 'line-opacity': .9 } }, firstRoad && firstRoad.id);
    PAINTS.push(['zone-' + z.id, 'fill-color', z.colour, true], ['zone-' + z.id + '-edge', 'line-color', z.edge, false]);
  }
}
let lastNight = 0, lastWet = false;
function paintMap(night, wet) {
  lastNight = night; lastWet = wet;
  if (!styleReady) return;   // the style is still loading: applyLook() paints with these once it is in
  for (const [id, prop, c, ground] of PAINTS) try { map.setPaintProperty(id, prop, nightHex(c, night, ground && wet)); } catch (_) {}
  for (const l of map.getStyle().layers) if (l.type === 'symbol') try {
    map.setPaintProperty(l.id, 'text-color', night > .45 ? '#f4efe2' : INK); map.setPaintProperty(l.id, 'text-halo-color', night > .45 ? '#24332e' : '#fffcf2'); } catch (_) {}
}

/* ---------------- drawing in the Pocket City manner (the same code paths as web3d/main3d.js) ---------------- */
const areaOf = r => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
const inPoly = (p, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
function groundPoly(poly, z, colour) {
  const [outer, ...holes] = poly; if (!outer || outer.length < 3) return;
  const V = r => r.map(p => new THREE.Vector2(p[0], p[1]));
  let tris; try { tris = THREE.ShapeUtils.triangulateShape(V(outer), holes.map(V)); } catch (e) { return; }
  const pts = outer.concat(...holes), rgba = hex2rgb(colour), G = GEO.flat;
  for (const t of tris) for (const i of t) { const p = pts[i]; G.p.push(p[0], p[1], z); G.n.push(0, 0, 1); G.c.push(rgba[0], rgba[1], rgba[2]); G.lit.push(0); }
}
// generic buildings: the style rules from city.json, as main3d.js reads them
function matches(c, b) {
  if (!c) return true; const any = (v, x) => (Array.isArray(v) ? v : [v]).includes(x);
  if (c.type && !any(c.type, b.type)) return false; if (c.use && !any(c.use, b.use)) return false;
  if (c.famous !== undefined && !!b.famous !== c.famous) return false; if (c.cut !== undefined && !!b.cut !== c.cut) return false;
  if (c.name && !new RegExp(c.name, 'i').test(b.n || '')) return false;
  const h = b.h ?? (b.lv ? b.lv * LEVEL : null);
  if (c.minH !== undefined && !(h >= c.minH)) return false; if (c.maxH !== undefined && !(h !== null && h <= c.maxH)) return false;
  if (c.minLevels !== undefined && !((b.lv ?? (h ? h / LEVEL : 0)) >= c.minLevels)) return false;
  if (c.maxLevels !== undefined && !((b.lv ?? (h ? h / LEVEL : 99)) <= c.maxLevels)) return false;
  const area = areaOf(b.ring); if (c.minArea !== undefined && !(area >= c.minArea)) return false; if (c.maxArea !== undefined && !(area <= c.maxArea)) return false;
  if (c.unknownHeight !== undefined && (b.h == null && b.lv == null) !== c.unknownHeight) return false;
  return true;
}
function styleFor(b) {
  let s = { facade: 'house', wall: ['#eee2ca'], roofColour: ['#c8c4b8'], roof: 'auto', pitch: 30, eaves: .45, levels: 3, floor: LEVEL, parapet: .5, ...(STYLES.default || {}) };
  for (const rule of STYLES.rules || []) if (matches(rule.if, b)) { s = { ...s, ...rule.set }; if (!rule.more) break; }
  return { ...s, ...((CITY.buildings || {})[b.id] || {}) };
}
const onCampus = b => inPoly(b.obb.c, CAMPUS), PALE = '#f2ede2';
// returns the wall height, for flying to the building
function genericBuilding(b) {
  let st = styleFor(b), body = pickOf(st.wall, b.id);
  if (!onCampus(b)) {   // outside the campus: paler walls, roofs and glass, so the campus buildings stand out
    body = mix(body, PALE, .55);
    st = { ...st, wall: body, flatRoof: mix(pickOf(st.flatRoof || st.roofColour, b.id), PALE, .55), roofColour: mix(pickOf(st.roofColour, b.id), PALE, .45),
      glass: (st.glass || ['#a9bcc1']).map(g => mix(g, body, .6)), frame: mix(st.frame || '#7d7f80', body, .6), trim: st.trim ? mix(st.trim, body, .6) : st.trim };
  }
  const ring = ccw(b.ring);
  const pitched = (st.roof === 'gabled' || st.roof === 'hipped') && b.obb && b.obb.fill >= (st.rectFill ?? .78) && b.obb.W <= (st.maxSpan ?? 22);
  let wall = b.h ? b.h : b.lv ? b.lv * st.floor + (pitched ? 0 : .6) : (st.levels || 3) * st.floor + (pitched ? 0 : .6);
  if (st.height) wall = st.height;
  const z0 = b.min || 0; wall = Math.max(wall, z0 + 2.4);
  walls3d(ring, z0, wall, st, body);
  for (const h of b.holes || []) walls3d(h.slice().reverse(), z0, wall, st, body);
  if (pitched) pitchedRoof3d(b.obb, wall, st, st.roof, pickOf(st.roofColour, b.id));
  else {
    const top = pickOf(st.flatRoof || st.roofColour, b.id);
    groundPoly([ring, ...(b.holes || [])], wall, top); inkLoop(atZ(ring, wall), lineOf(top));
    if (st.parapet && wall - z0 > 5) { const c = b.obb.c, inner = ring.map(p => [c[0] + (p[0] - c[0]) * .985, c[1] + (p[1] - c[1]) * .985]); inkLoop(atZ(inner, wall + .02), mix(top, '#51465a', .3)); }
  }
  return wall;
}
// the oriented box of an outline (the smallest rectangle on a hull edge): centre, long axis, length, width, how much the outline fills
function obbOf(ring) {
  const pts = ring.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = []; for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of pts.slice().reverse()) { while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  const hull = lo.slice(0, -1).concat(hi.slice(0, -1)); let best = null;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1e-6) continue;
    const ax = [(b[0] - a[0]) / l, (b[1] - a[1]) / l], nx = [-ax[1], ax[0]];
    let s0 = 1e9, s1 = -1e9, t0 = 1e9, t1 = -1e9;
    for (const p of hull) { const s = p[0] * ax[0] + p[1] * ax[1], t = p[0] * nx[0] + p[1] * nx[1]; s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
    const A = (s1 - s0) * (t1 - t0); if (best && A >= best.A) continue;
    const sm = (s0 + s1) / 2, tm = (t0 + t1) / 2, c = [ax[0] * sm + nx[0] * tm, ax[1] * sm + nx[1] * tm];
    best = s1 - s0 >= t1 - t0 ? { A, c, ax, L: s1 - s0, W: t1 - t0 } : { A, c, ax: nx, L: t1 - t0, W: s1 - s0 };
  }
  if (!best) { const c = avg(ring); return { c: [c[0], c[1]], ax: [1, 0], L: 1, W: 1, fill: 1 }; }
  return { c: best.c, ax: best.ax, L: best.L, W: best.W, fill: best.A ? areaOf(ring) / best.A : 1 };
}
// trees of the plot (scene.json; the map tiles have no single trees), coloured for the season
function treeRule(species) { const T = CITY.trees || {}; for (const r of T.rules || []) if (r.match && new RegExp(r.match, 'i').test(species)) return r; return null; }
function buildTrees(season) {
  const T = CITY.trees || {}, def = T.default || {};
  for (const [i, tr] of (SCENE.trees || []).entries()) {
    const [x, y, si, extra] = tr, species = extra || (si >= 0 ? SCENE.species[si] : '') || '';
    const rule = treeRule(species); let look = { ...def };
    if (rule && rule.mix) { const tot = rule.mix.reduce((s, m) => s + (m.share || 1), 0); let h = hashStr('t' + i) % 1000 / 1000 * tot; for (const m of rule.mix) { h -= m.share || 1; if (h <= 0) { look = { ...look, ...m }; break; } } }
    else if (rule) look = { ...look, ...rule };
    const vary = 1 + ((hashStr('h' + i) % 100) / 100 - .5) * (rule && rule.vary || .3), h = (look.height || 9) * vary, cols = look.colours || ['#7fa868'];
    let col = cols[hashStr('c' + i) % cols.length];
    if (season === 'spring' && look.blossom) col = look.blossom; else if (season === 'spring' && look.spring) col = look.spring;
    else if (season === 'monsoon' && !look.evergreen && look.autumn) col = mix(col, look.autumn, .4);
    stick([x, y, 0], [x, y, h * .55], .18 * vary, '#9b795d');
    if (look.style === 5) { for (let k = 0; k < 3; k++) { const r0 = h * (.32 - k * .08), z0 = h * (.25 + k * .22); peak(polygon(x, y, r0, 8), z0, [x, y, z0 + h * .38], col); } }
    else { const r = h * .3; ball([x, y, h * .66], r, soft(col)); ball([x + r * .45, y - r * .2, h * .56], r * .72, soft(mix(col, '#ffffff', .06))); ball([x - r * .4, y + r * .3, h * .58], r * .7, soft(mix(col, '#51465a', .06))); }
  }
}
// benches, bus stops and street lamps (with their pools of light at night)
const LAMP = CITY.lamp || {};
function solidBox(fp, z0, z1, col) { loft(atZ(fp, z0), atZ(fp, z1), col); shape(atZ(fp, z1), col, .5); }
function lampPost(x, y) { const h = LAMP.height || 6; stick([x, y, 0], [x, y, h], .08, LAMP.colour || '#6c716e'); ball([x, y, h + .1], .3, '#fff3c4'); lightPool(x, y, 5, '#ffcf7a', .45); }
function buildFurniture() {
  for (const f of SCENE.furniture || []) {
    if (f.k === 'bench') { shape(atZ(rect(f.x, f.y, 1.6, .5), .45), '#9b795d', .4); stick([f.x - .7, f.y, 0], [f.x - .7, f.y, .45], .05, '#6c716e'); stick([f.x + .7, f.y, 0], [f.x + .7, f.y, .45], .05, '#6c716e'); }
    else if (f.k === 'bus_stop') { solidBox(rect(f.x, f.y, 3, 1.4), 2.5, 2.7, '#c9ccc7'); stick([f.x - 1.3, f.y, 0], [f.x - 1.3, f.y, 2.5], .05, '#6c716e'); stick([f.x + 1.3, f.y, 0], [f.x + 1.3, f.y, 2.5], .05, '#6c716e'); }
  }
  if (LAMP.auto !== false) for (const c of SCENE.centerlines || []) { const p = c.p; let carry = 0, side = 1;
    for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      for (let s = 30 - carry; s < L; s += 30) { side = -side; const x = a[0] + ux * s - uy * 6 * side, y = a[1] + uy * s + ux * 6 * side;
        if (Math.abs(x) > HALF - 2 || Math.abs(y) > HALF - 2) continue; lampPost(x, y); } carry = (carry + L) % 30; } }
  if (typeof LANTERN_AT === 'function') for (const [x, y] of LANTERN_AT()) lightPool(x, y, 3.6, '#ffe7a8', .5);
}

/* ---------------- three.js: the toon material (main3d.js's, with the sun's shadows), the façade atlas ---------------- */
const U = {
  uTone: { value: new THREE.Vector3(-.47, -.63, .91).normalize() }, uView: { value: new THREE.Vector3(0, 0, 1) },
  uNight: { value: 0 }, uLitShare: { value: 0 }, uShadowOn: { value: 1 }, uWet: { value: 0 }, uAtlas: { value: null }, uAtlasN: { value: ATLAS.size / ATLAS.tile },
};
const VERT = THREE.ShaderLib.shadow.vertexShader
  .replace('void main() {', `attribute vec3 aCol; attribute float aLit; attribute float aTile; attribute vec2 aUv;
varying vec3 vCol; varying float vLit; varying float vTile; varying vec2 vUv; varying vec3 vWN;
void main() {
  #ifdef USE_INSTANCING_COLOR
  vCol = instanceColor;
  #else
  vCol = aCol;
  #endif
  vLit = aLit; vTile = aTile; vUv = aUv;`)
  .replace('#include <shadowmap_vertex>', '#include <shadowmap_vertex>\n  vWN = normalize(inverseTransformDirection(transformedNormal, viewMatrix));');
const FRAG = `
#include <common>
#include <packing>
#include <bsdfs>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
uniform vec3 uTone; uniform vec3 uView; uniform float uNight; uniform float uLitShare; uniform float uShadowOn;
uniform sampler2D uAtlas; uniform float uAtlasN;
varying vec3 vCol; varying float vLit; varying float vTile; varying vec2 vUv; varying vec3 vWN;
float ss(float a, float b, float x) { float k = clamp((x - a) / (b - a), 0., 1.); return k * k * (3. - 2. * k); }
vec3 tone3(vec3 base, float d) {
  vec3 m = mix(base, vec3(.5333, .4745, .5922), .18), dk = mix(base, vec3(.4392, .3725, .5059), .33);
  float S = .05, a = ss(.28 - S, .28 + S, d), b = ss(-.30 - S, -.30 + S, d);
  if (a >= 1.) return base; if (b <= 0.) return dk; if (a > 0.) return mix(m, base, a); if (b < 1.) return mix(dk, m, b); return m; }
vec3 nightCol(vec3 c, float k) { return vec3(c.r * (1. - .5 * k) + .047 * k, c.g * (1. - .52 * k) + .063 * k, c.b * (1. - .4 * k) + .157 * k); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 base = vCol;
  if (vTile >= 0.) {
    float col = mod(vTile, uAtlasN), row = floor(vTile / uAtlasN);
    vec2 f = fract(vUv), cell = floor(vUv);
    vec4 t = texture2D(uAtlas, (vec2(col, row) + vec2(.06) + f * .88) / uAtlasN);
    base = t.rgb;
    if (t.a < .4 && uNight > .05) { gl_FragColor = vec4(mix(nightCol(t.rgb, uNight), vec3(1., .851, .541), clamp(uNight * 2.5, 0., 1.)), 1.); return; }   // 宮燈教室: every window lit after dark
    if (t.a < .75 && uNight > .05 && hash2(cell + vec2(vTile * 7.13, vTile)) < uLitShare) { gl_FragColor = vec4(hash2(cell * 1.7) > .5 ? vec3(1., .851, .541) : vec3(1., .906, .659), 1.); return; }
  }
  if (vLit > 1.5 && uNight > .05) { gl_FragColor = vec4(mix(nightCol(base, uNight), vec3(1., .953, .769), clamp(uNight * 2.5, 0., 1.)), 1.); return; }   // lanterns glow after dark
  if (vLit > .5 && vLit < 1.5) { gl_FragColor = vec4(base, 1.); return; }
  vec3 n = normalize(vWN); if (dot(n, uView) < 0.) n = -n;
  float d = dot(n, uTone);
  float sh = uShadowOn > .5 ? getShadowMask() : 1.;
  d = mix(-1., d, sh);
  gl_FragColor = vec4(nightCol(tone3(base, d), uNight), 1.);
}`;
const toon = () => { const m = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights]), vertexShader: VERT, fragmentShader: FRAG, lights: true, side: THREE.DoubleSide });
  for (const k in U) m.uniforms[k] = U[k]; return m; };
const MAT = toon();
const atlasCanvas = document.createElement('canvas'); atlasCanvas.width = atlasCanvas.height = ATLAS.size;
const atlasTex = new THREE.CanvasTexture(atlasCanvas); atlasTex.colorSpace = THREE.NoColorSpace; atlasTex.flipY = false; atlasTex.generateMipmaps = false;
atlasTex.minFilter = THREE.LinearFilter; atlasTex.premultiplyAlpha = false; U.uAtlas.value = atlasTex;
let atlasDrawn = 0;
function drawAtlas() {   // the façade tiles (windows), as in web3d/main3d.js; only new tiles are painted. Alpha marks glass for night windows.
  const N = ATLAS.size / ATLAS.tile, g = atlasCanvas.getContext('2d', { willReadFrequently: true }), T = ATLAS.tile;
  for (let i = atlasDrawn; i < ATLAS.list.length; i++) {
    const t = ATLAS.list[i], x0 = (i % N) * T, y0 = Math.floor(i / N) * T;
    g.fillStyle = t.wall; g.fillRect(x0, y0, T, T);
    const win = (x, y, w, h, frame = t.frame) => { g.fillStyle = frame; g.fillRect(x0 + x - 1, y0 + y - 1, w + 2, h + 2); g.fillStyle = t.glass; g.fillRect(x0 + x, y0 + y, w, h); };
    switch (t.facade) {
      case 'office': win(4, 18, T - 8, 30); g.fillStyle = t.frame; for (let k = 1; k < 3; k++) g.fillRect(x0 + 4 + k * (T - 8) / 3, y0 + 18, 1.5, 30); if (t.trim) { g.fillStyle = t.trim; g.fillRect(x0, y0 + T - 6, T, 6); } break;
      case 'glass': g.fillStyle = t.glass; g.fillRect(x0 + 2, y0 + 2, T - 4, T - 4); g.fillStyle = t.frame; g.fillRect(x0, y0 + T - 5, T, 5); g.fillRect(x0 + T / 2 - 1, y0, 2, T); break;
      case 'apartment': win(14, 16, T - 28, 30); if (t.balcony) { g.fillStyle = mix(t.wall, '#51465a', .25); g.fillRect(x0 + 6, y0 + 44, T - 12, 4); } break;
      case 'civic': win(18, 10, T - 36, 42); if (t.trim) { g.fillStyle = t.trim; g.fillRect(x0, y0 + T - 4, T, 4); } break;
      case 'stucco': win(22, 16, T - 44, 32); if (t.shutters) { g.fillStyle = t.shutters; g.fillRect(x0 + 14, y0 + 16, 7, 32); g.fillRect(x0 + T - 21, y0 + 16, 7, 32); } if (t.trim) { g.fillStyle = t.trim; g.fillRect(x0, y0 + T - 4, T, 4); } break;
      case 'temple': g.fillStyle = t.glass; g.fillRect(x0 + 10, y0 + 16, T - 20, 34); g.fillStyle = mix(t.wall, '#51465a', .35); for (let k = 0; k < 6; k++) g.fillRect(x0 + 8 + k * 8, y0 + 14, 2, 40); g.fillRect(x0 + 6, y0 + 14, T - 12, 2); g.fillRect(x0 + 6, y0 + 52, T - 12, 2); g.fillRect(x0 + 6, y0 + 32, T - 12, 2); break;
      default: win(22, 20, T - 44, 26);
    }
    const img = g.getImageData(x0, y0, T, T), gl = hex2rgb(t.glass).map(v => Math.round(v * 255)), glassA = t.facade === 'temple' ? 64 : 128;
    for (let p = 0; p < img.data.length; p += 4) if (Math.abs(img.data[p] - gl[0]) < 3 && Math.abs(img.data[p + 1] - gl[1]) < 3 && Math.abs(img.data[p + 2] - gl[2]) < 3) img.data[p + 3] = glassA;
    g.putImageData(img, x0, y0);
  }
  if (ATLAS.list.length !== atlasDrawn) { atlasDrawn = ATLAS.list.length; atlasTex.needsUpdate = true; }
}
const INK_MAT = new THREE.ShaderMaterial({ uniforms: { uNight: U.uNight }, transparent: true, depthWrite: false,
  vertexShader: 'attribute vec3 aCol; varying vec3 vC; void main(){ vC = aCol; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); p.z -= 0.0004 * p.w; gl_Position = p; }',
  fragmentShader: 'uniform float uNight; varying vec3 vC; void main(){ vec3 c = vC; float k = uNight; c = vec3(c.r*(1.-.5*k)+.047*k, c.g*(1.-.52*k)+.063*k, c.b*(1.-.4*k)+.157*k); gl_FragColor = vec4(c, 1.); }' });
const GLASS_MAT = new THREE.ShaderMaterial({ uniforms: { uNight: U.uNight }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  vertexShader: 'attribute vec4 aCol; varying vec4 vC; void main(){ vC = aCol; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: 'uniform float uNight; varying vec4 vC; void main(){ vec3 c = vC.rgb; float k = uNight; c = vec3(c.r*(1.-.5*k)+.047*k, c.g*(1.-.52*k)+.063*k, c.b*(1.-.4*k)+.157*k); gl_FragColor = vec4(c, vC.a); }' });
const WORLD = new THREE.Scene(), SOLIDS = [];
let triangles = 0;
// whatever is in the collector becomes meshes in the world, then the collector is emptied
function flush() {
  drawAtlas();
  const F = (a, n) => new THREE.Float32BufferAttribute(a, n);
  const solid = (G, wall) => { if (!G.p.length) return; const g = new THREE.BufferGeometry(), n = G.p.length / 3;
    g.setAttribute('position', F(G.p, 3)); g.setAttribute('normal', F(G.n, 3)); g.setAttribute('aCol', F(G.c, 3));
    g.setAttribute('aLit', wall ? F(new Float32Array(n), 1) : F(G.lit, 1));
    g.setAttribute('aTile', wall ? F(G.tile, 1) : F(new Float32Array(n).fill(-1), 1)); g.setAttribute('aUv', wall ? F(G.uv, 2) : F(new Float32Array(n * 2), 2));
    const m = new THREE.Mesh(g, MAT); m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; WORLD.add(m); SOLIDS.push(m); triangles += n / 3; };
  solid(GEO.flat, false); solid(GEO.wall, true);
  if (GEO.ink.p.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', F(GEO.ink.p, 3)); g.setAttribute('aCol', F(GEO.ink.c, 3)); const l = new THREE.LineSegments(g, INK_MAT); l.frustumCulled = false; WORLD.add(l); }
  if (GEO.glass.p.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', F(GEO.glass.p, 3)); g.setAttribute('aCol', F(GEO.glass.c, 4)); const m = new THREE.Mesh(g, GLASS_MAT); m.frustumCulled = false; m.renderOrder = 2; WORLD.add(m); }
  geoReset();
  shadowsDirty = true;
}

/* ---------------- the sun, its shadows on the ground of the plot ---------------- */
const sunLight = new THREE.DirectionalLight(0xffffff, 1); sunLight.castShadow = true;
sunLight.shadow.mapSize.set(phone ? 2048 : 4096, phone ? 2048 : 4096);
Object.assign(sunLight.shadow.camera, { left: -HALF * 1.15, right: HALF * 1.15, top: HALF * 1.15, bottom: -HALF * 1.15, near: 1, far: 3000 });
sunLight.shadow.bias = -0.0004; sunLight.shadow.normalBias = .3;
WORLD.add(sunLight, sunLight.target);
// the map's ground is not three.js: a see-through plane over the plot takes the shadows
const shadowGround = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2.3, HALF * 2.3), new THREE.ShadowMaterial({ color: 0x3e3458, opacity: .3, depthWrite: false }));
shadowGround.position.z = .05; shadowGround.receiveShadow = true; shadowGround.frustumCulled = false; WORLD.add(shadowGround);
let shadowsDirty = true;

/* ---------------- glows, people and cars, rain ---------------- */
let glowMesh = null;
function buildGlows() {
  if (glowMesh) { WORLD.remove(glowMesh); glowMesh.geometry.dispose(); }
  const n = GLOWS.length; if (!n) return;
  const mat = new THREE.ShaderMaterial({ uniforms: { uNight: U.uNight }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform float uNight; varying vec2 vP; void main(){ float d = length(vP); gl_FragColor = vec4(vec3(1., .81, .48) * (1. - smoothstep(.2, 1., d)) * .55 * uNight, 1.); }' });
  glowMesh = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 24), mat, n); const m = new THREE.Matrix4();
  GLOWS.forEach((g, i) => { m.makeScale(g.r, g.r, 1); m.setPosition(g.x, g.y, g.z + .15); glowMesh.setMatrixAt(i, m); });
  glowMesh.frustumCulled = false; glowMesh.renderOrder = 3; WORLD.add(glowMesh);
}
const MOVERS = [];
let peds = null, heads = null, cars = null, umbs = null;
function routeLen(p) { let L = 0; for (let i = 0; i < p.length - 1; i++) L += Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]); return L; }
function at(p, s) { for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (s <= L || i === p.length - 2) { const t = L ? Math.min(1, s / L) : 0; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[1] - a[1], b[0] - a[0])]; } s -= L; } return [p[0][0], p[0][1], 0]; }
function buildMovers() {
  const R = (SCENE.routes || []).filter(r => r.p && r.p.length > 1).map(r => ({ ...r, L: routeLen(r.p) })).filter(r => r.L > 8);
  const pedR = R.filter(r => r.kind === 'ped'), carR = R.filter(r => r.kind === 'car');
  const P = CITY.people || {}, V = CITY.vehicles || {}, nPed = phone ? 160 : 320, nCar = phone ? 16 : 30;
  const rnd = (i, k) => (hashStr(i + ':' + k) % 10000) / 10000;
  for (let i = 0; i < nPed && pedR.length; i++) { const r = pedR[Math.floor(rnd(i, 1) * pedR.length)]; MOVERS.push({ kind: 'ped', r, s: rnd(i, 2) * r.L, v: (1.0 + rnd(i, 3) * .5) * (rnd(i, 4) > .5 ? 1 : -1), off: (rnd(i, 5) - .5) * 2.4, col: pickOf(P.clothes || ['#3d4a5e'], 'p' + i), umb: pickOf(P.umbrellas || ['#2f3540'], 'u' + i), i }); }
  for (let i = 0; i < nCar && carR.length; i++) { const r = carR[Math.floor(rnd(i, 6) * carR.length)]; const taxi = V.taxi && rnd(i, 7) < (V.taxi.share || 0);
    MOVERS.push({ kind: 'car', r, s: rnd(i, 8) * r.L, v: (6 + rnd(i, 9) * 4) * (rnd(i, 10) > .5 ? 1 : -1), off: 0, col: taxi ? V.taxi.colours[0] : pickOf(V.colours || ['#c9ccd0'], 'c' + i), i }); }
  const nP = MOVERS.filter(m => m.kind === 'ped').length, nC = MOVERS.filter(m => m.kind === 'car').length;
  const withAttrs = g => { const n = g.attributes.position.count; g.setAttribute('aCol', new THREE.Float32BufferAttribute(new Float32Array(n * 3).fill(1), 3)); g.setAttribute('aLit', new THREE.Float32BufferAttribute(new Float32Array(n), 1)); g.setAttribute('aTile', new THREE.Float32BufferAttribute(new Float32Array(n).fill(-1), 1)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2)); return g; };
  const body = withAttrs(new THREE.CylinderGeometry(.22, .26, 1.25, 6).rotateX(Math.PI / 2).translate(0, 0, .62));
  const head = withAttrs(new THREE.IcosahedronGeometry(.15, 1).translate(0, 0, 1.42));
  const carB = withAttrs(new THREE.BoxGeometry(4.2, 1.8, 1.0).translate(0, 0, .65)), cabin = withAttrs(new THREE.BoxGeometry(2.3, 1.6, .6).translate(-.2, 0, 1.45));
  const umb = withAttrs(new THREE.ConeGeometry(.6, .3, 8).rotateX(Math.PI / 2).translate(0, 0, 2.05));
  peds = new THREE.InstancedMesh(body, toon(), Math.max(1, nP)); heads = new THREE.InstancedMesh(head, toon(), Math.max(1, nP)); umbs = new THREE.InstancedMesh(umb, toon(), Math.max(1, nP));
  cars = new THREE.InstancedMesh(mergeGeos([carB, cabin]), toon(), Math.max(1, nC));
  let ip = 0, ic = 0; const c = new THREE.Color();
  for (const m of MOVERS) { if (m.kind === 'ped') { m.k = ip++; peds.setColorAt(m.k, c.set(m.col)); heads.setColorAt(m.k, c.set('#e9c9a6')); umbs.setColorAt(m.k, c.set(m.umb)); } else { m.k = ic++; cars.setColorAt(m.k, c.set(m.col)); } }
  for (const im of [peds, heads, umbs, cars]) { im.frustumCulled = false; im.receiveShadow = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; WORLD.add(im); }
}
function mergeGeos(gs) { const out = new THREE.BufferGeometry();
  for (const n of Object.keys(gs[0].attributes)) { const arrs = gs.map(g => (g.index ? g.toNonIndexed() : g).attributes[n].array); const f = new Float32Array(arrs.reduce((s, a) => s + a.length, 0)); let o = 0; for (const a of arrs) { f.set(a, o); o += a.length; } out.setAttribute(n, new THREE.BufferAttribute(f, gs[0].attributes[n].itemSize)); }
  return out; }
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), Vp = new THREE.Vector3(), Vs = new THREE.Vector3(1, 1, 1), Zax = new THREE.Vector3(0, 0, 1), HID = new THREE.Vector3(0, 0, 0);
function moveMovers(dt) {
  if (!peds) return;
  const crowd = STATE.crowd ?? 1, wet = !!STATE.wet;
  for (const m of MOVERS) {
    m.s += m.v * dt; if (m.s > m.r.L) { m.s = m.r.L; m.v = -m.v; } if (m.s < 0) { m.s = 0; m.v = -m.v; }
    const [x, y, a] = at(m.r.p, m.s), dir = m.v > 0 ? a : a + Math.PI, nx = -Math.sin(a), ny = Math.cos(a), off = m.kind === 'car' ? (m.v > 0 ? -1.8 : 1.8) : m.off;
    const shown = m.kind === 'car' || (m.i % 100) / 100 < crowd * .55;
    Q.setFromAxisAngle(Zax, dir); Vp.set(x + nx * off, y + ny * off, 0); M4.compose(Vp, Q, shown ? Vs : HID);
    if (m.kind === 'ped') { peds.setMatrixAt(m.k, M4); heads.setMatrixAt(m.k, M4); M4.compose(Vp, Q, shown && wet ? Vs : HID); umbs.setMatrixAt(m.k, M4); }
    else cars.setMatrixAt(m.k, M4);
  }
  for (const im of [peds, heads, umbs, cars]) im.instanceMatrix.needsUpdate = true;
}
let rain = null;
function buildRain() {
  const N = phone ? 2500 : 6000, pos = new Float32Array(N * 6), seed = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) seed[i] = Math.random();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x7d8fa3, transparent: true, opacity: .45, depthWrite: false })); rain.frustumCulled = false; rain.visible = false; rain.userData = { N, seed }; WORLD.add(rain);
}
function moveRain(t) {
  if (!rain || !rain.visible) return;
  const { N, seed } = rain.userData, p = rain.geometry.attributes.position.array, [cx, cy] = toPlot(map.getCenter().toArray());
  const mpp = 40075016.686 * Math.cos(META.lat * Math.PI / 180) / (512 * 2 ** map.getZoom());
  const span = Math.max(innerWidth, innerHeight) * mpp * 1.2, drizzle = STATE.wx === 'drizzle', len = drizzle ? .7 : 1.8, speed = drizzle ? 6 : 16, top = 70, n = drizzle ? Math.floor(N * .5) : N;
  for (let i = 0; i < N; i++) {
    const o = i * 6; if (i >= n) { p.fill(0, o, o + 6); continue; }
    const x = cx + (seed[i * 3] - .5) * span, y = cy + (seed[i * 3 + 1] - .5) * span, z = top - ((seed[i * 3 + 2] * top + t * speed) % top);
    p[o] = x; p[o + 1] = y; p[o + 2] = z; p[o + 3] = x + .4; p[o + 4] = y + .2; p[o + 5] = z - len;
  }
  rain.geometry.attributes.position.needsUpdate = true;
}

/* ---------------- the plot: landmarks, its buildings, trees, lamps as on the 3D page ---------------- */
const want = params.get('lm') || 'all';   // ?lm=圖書館 shows only the landmarks whose name has it
const replaced = new Set(), plotIds = new Set();   // OSM ids the plot draws itself: the tiles' copies are skipped
const osmNum = id => /^[wr]\d+$/.test(id || '') ? +id.slice(1) : null;
const PICKS = [];          // what a tap can fly to: { fps: outlines in plot metres, h }
let LM_COUNT = 0, treeMeshes = [], builtSeason = null;
function buildPlot() {
  geoReset();
  const groups = new Map();
  for (const lm of LANDMARKS) {
    if (want !== 'all' && !lm.name.includes(want)) continue;
    try {
      const r = lm.build(), parts = [].concat(r || []).filter(o => o && typeof o.draw === 'function'); for (const o of parts) o.draw();
      for (const id of lm.ids || []) replaced.add(id); LM_COUNT++;
      const key = lm.name.replace(/ w\d+$/, '').replace(/ (beds|lanterns)$/, '').replace(/^操場燈柱與圍網|^籃球架/, '操場與球場');
      const g = groups.get(key) || { fps: [], h: 0 }; groups.set(key, g);
      for (const p of parts) if (p.fp && p.fp.length > 2) { g.fps.push(p.fp); g.h = Math.max(g.h, p.h || p.z1 || 0); }
    } catch (e) { console.warn('landmark', lm.name, e); }
  }
  PICKS.push(...groups.values());
  for (const b of SCENE.buildings) {
    const isLm = replaced.has(b.id) || replaced.has(b.of);
    if (b.cut && !isLm) continue;      // cut at the plot's edge: the tiles' whole copy is drawn instead
    for (const id of [b.id, b.of]) { const n = osmNum(id); if (n) plotIds.add(n); }
    if (!isLm) try { const h = genericBuilding(b); PICKS.push({ fps: [b.ring], h }); } catch (e) { console.warn('building', b.id, e); }
  }
  buildFurniture();
  flush();
  buildGlows(); buildMovers(); buildRain();
}
function rebuildTrees(season) {
  for (const m of treeMeshes) { WORLD.remove(m); m.geometry.dispose(); const i = SOLIDS.indexOf(m); if (i >= 0) SOLIDS.splice(i, 1); }
  const before = WORLD.children.length;
  geoReset(); buildTrees(season); flush(); builtSeason = season;
  treeMeshes = WORLD.children.slice(before);
}

/* ---------------- the rest of the map: every building in the loaded tiles, drawn the same way ---------------- */
const done = new Set(), queue = [];
let tileBuildings = 0;
function collectTiles(src) {
  const best = new Map();
  for (const f of map.querySourceFeatures(src, { sourceLayer: 'building' })) {
    // the tiles number a building osm id × 10 + one digit
    if (f.id == null || done.has(f.id) || plotIds.has(Math.floor(f.id / 10))) continue;
    // a building on a tile edge comes in pieces, one from each tile: keep the biggest
    const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    const a = polys.reduce((s, p) => s + areaOf(p[0]), 0), cur = best.get(f.id);
    if (!cur || a > cur.a) best.set(f.id, { f, polys, a });
  }
  for (const [id, x] of best) { done.add(id); queue.push(x); }
}
function buildFeature({ f, polys }) {
  const P = f.properties || {}, h = P.render_height, min = P.render_min_height || 0;
  const known = !(h === 5 && !min);     // the tiles give 5 m when OpenStreetMap has no height: the style's levels decide, as on the 3D page
  polys.forEach((poly, k) => {
    const rings = poly.map(r => { const q = r.map(toPlot); const a = q[0], z = q[q.length - 1]; if (q.length > 1 && a[0] === z[0] && a[1] === z[1]) q.pop(); return q; }).filter(r => r.length > 2);
    if (!rings.length || areaOf(rings[0]) < 4) return;
    const b = { id: 't' + f.id + '-' + k, ring: rings[0], holes: rings.slice(1), h: known && h ? h : undefined, min, type: 'yes', obb: obbOf(rings[0]) };
    try { const wall = genericBuilding(b); PICKS.push({ fps: [b.ring], h: wall }); tileBuildings++; } catch (e) { console.warn('tile building', f.id, e); }
  });
}
let pumping = false;
function pump() {
  if (!queue.length) { pumping = false; return; }
  pumping = true; const t0 = performance.now();
  while (queue.length && performance.now() - t0 < 14) buildFeature(queue.shift());
  flush(); map.triggerRepaint();
  requestAnimationFrame(pump);
}

/* ---------------- sun, weather and time: 淡水 now (as main3d.js) ---------------- */
const CFG = LIVE_CFG;
let fixedAt = params.get('at'), fixedWx = params.get('wx');
const STATE = { wx: 'clear', crowd: 1, wet: false, level: 0, base: 'summer' };
let weather = null, temp = null, failed = false, paintedAt = null;
function sunPosition(date, lat, lon) {   // NOAA's approximate solar position: altitude and azimuth (from north, clockwise), degrees
  const rad = Math.PI / 180, d = date.getTime() / 86400000 - 10957.5;
  const g = (357.529 + 0.98560028 * d) * rad, L = (280.459 + 0.98564736 * d) * rad;
  const lam = L + (1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad, eps = (23.439 - 0.00000036 * d) * rad;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam)), ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24, ha = ((gmst * 15 + lon) * rad) - ra, la = lat * rad;
  const alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha));
  const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(ha));
  return { alt: alt / rad, az: ((az / rad) + 360) % 360 };
}
const now = () => fixedAt ? new Date(fixedAt + (/[zZ]|[+-]\d\d:?\d\d$/.test(fixedAt) ? '' : '+08:00')) : new Date();
const tz = CFG.place.timezone;
const monthOf = t => Number(new Intl.DateTimeFormat('en', { timeZone: tz, month: 'numeric' }).format(t));
const hourOf = t => Number(new Intl.DateTimeFormat('en', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(t));
const clock = t => new Intl.DateTimeFormat('zh-TW', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(t);
function applyState() {
  const t = now(), base = CFG.months[monthOf(t) - 1], { alt, az } = sunPosition(t, CFG.place.lat, CFG.place.lon);
  const level = CFG.levels.findIndex(l => alt >= l.minSun), wx = fixedWx || weather || CFG.fallback[base] || 'clear';
  Object.assign(STATE, { base, wx, level: level < 0 ? CFG.levels.length - 1 : level, alt });
  const W_ = CFG.weathers[wx] || CFG.weathers.clear, lv = CFG.levels[STATE.level];
  STATE.wet = !!(W_.set && W_.set.wet); STATE.crowd = (CFG.bases[base]?.crowd ?? 1) * (W_.crowd ?? 1) * (lv.crowd ?? 1);
  // the sun's direction in plot coordinates
  const ra = alt * Math.PI / 180, za = az * Math.PI / 180, [sx, sy] = enToPlot(Math.cos(ra) * Math.sin(za), Math.cos(ra) * Math.cos(za));
  const day = alt > 2;
  U.uNight.value = .88 * Math.max(0, Math.min(1, (4 - alt) / 12));
  U.uLitShare.value = .6 * Math.max(0, Math.min(1, (6 - alt) / 10));
  U.uShadowOn.value = day && wx !== 'rain' && wx !== 'fog' ? 1 : 0;
  shadowGround.visible = U.uShadowOn.value > .5;
  sunLight.position.set(sx * 1000, sy * 1000, Math.max(.05, Math.sin(ra)) * 1000); sunLight.target.position.set(0, 0, 0); sunLight.target.updateMatrixWorld();
  shadowsDirty = true;
  if (rain) rain.visible = wx === 'rain' || wx === 'drizzle';
  $('haze').style.opacity = wx === 'fog' ? 1 : 0;
  SEASON.night = U.uNight.value;
  // the map's colours change in 20 steps from day to night
  const key = (Math.round(U.uNight.value * 20) / 20) + '|' + STATE.wet; if (key !== paintedAt) { paintMap(Math.round(U.uNight.value * 20) / 20, STATE.wet); paintedAt = key; }
  if (builtSeason !== base) rebuildTrees(base);
  const parts = [`${clock(t)} · ${(hourOf(t) < 12 && lv.morning) || lv.label} · ${CFG.weathers[wx].label}`];
  if (temp != null && !fixedWx) parts.push(`${Math.round(temp)}°C`);
  $('wx').textContent = '淡水 ' + parts.join(' · ') + (failed && !fixedWx ? '（典型天氣）' : '');
  document.body.classList.toggle('night', U.uNight.value > .45);
  map.triggerRepaint();
}
async function fetchWeather() {
  if (!fixedWx) try {
    const p = CFG.place, url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=weather_code,temperature_2m&timezone=${encodeURIComponent(p.timezone)}`;
    const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status);
    const c = (await r.json()).current; weather = Object.keys(CFG.wmo).find(k => Array.isArray(CFG.wmo[k]) && CFG.wmo[k].includes(c.weather_code)) || 'clear'; temp = c.temperature_2m; failed = false;
  } catch (e) { failed = true; }
  applyState();
}

// the development page (dev/, a parent frame) sets the time and the weather live, without reloading:
// { type: 'tku-dev-env', manual: true, at: '2026-11-27T18:30', wx: 'rain' }; manual: false goes back to now and the live weather
addEventListener('message', e => {
  const d = e.data; if (window.parent === window || e.source !== window.parent || !d) return;
  if (d.type === 'tku-dev-map') { setLook(d.look); return; }   // the map's look: see LOOK_DEFAULT
  if (d.type !== 'tku-dev-env') return;
  if (d.manual) { fixedAt = typeof d.at === 'string' && !isNaN(new Date(d.at + '+08:00')) ? d.at : null; fixedWx = CFG.weathers[d.wx] ? d.wx : null; applyState(); }
  else { fixedAt = null; fixedWx = null; fetchWeather(); }
});

/* ---------------- the map's look: labels and roads ----------------
   LOOK_DEFAULT is what the page shows. The development page (dev/) sends { type: 'tku-dev-map', look } to try others live;
   a look chosen there is made the default by copying it here. */
const LOOK_DEFAULT = {
  labels: { place: true, road: true, poi: true, transit: true, water: true },   // place names, road names, shops and places, transit, water names
  lang: 'zh',              // 'both' (English and Chinese), 'zh', 'en'
  textScale: 1,            // text size, × the style's
  roadWidth: 1,            // road and path width, × the style's
  roadStyle: 'asphalt',    // 'paper' (white roads, tan edges), 'asphalt' (grey, white centre lines), 'plain' (no edges)
  paths: 'solid',          // footpaths: 'dashed', 'solid', 'hidden'
};
const ROAD_STYLES = {
  paper: { road: ROAD, edge: ROAD_EDGE, path: ROAD, edges: true, centre: false },
  asphalt: { road: '#b9b2b5', edge: '#958d92', path: '#e4dccd', edges: true, centre: true },
  plain: { road: '#e7e0d3', edge: ROAD_EDGE, path: '#dcd2c0', edges: false, centre: false },
};
let LOOK = JSON.parse(JSON.stringify(LOOK_DEFAULT)), styleReady = false;
const LABEL_KIND = id => /^label_/.test(id) ? 'place' : /^highway-name|^road_one_way/.test(id) ? 'road' : /^poi_r/.test(id) ? 'poi'
  : /^poi_transit|^airport/.test(id) ? 'transit' : /water_name|waterway_line_label/.test(id) ? 'water' : null;
const TEXT = {
  // Chinese where there is any; a place with only a Latin name (7-Eleven, La new) keeps it, so nothing loses its label
  zh: ['coalesce', ['get', 'name:nonlatin'], ['get', 'name'], ['get', 'name:latin'], ['get', 'name_en']],
  en: ['coalesce', ['get', 'name:latin'], ['get', 'name_en'], ['get', 'name']],
};
const BASE = new Map();   // the style's own text and width settings, before any change: layer id -> { tf, ts, lw, dash }
// a number, or a zoom curve ['interpolate', type, ['zoom'], z1, v1, z2, v2 …], times k
const times = (v, k) => typeof v === 'number' ? v * k
  : Array.isArray(v) && v[0] === 'interpolate' ? v.map((x, i) => i >= 4 && i % 2 === 0 ? (typeof x === 'number' ? x * k : ['*', x, k]) : x) : v;
function setBase(id, prop, c) { const p = PAINTS.find(q => q[0] === id && q[1] === prop); if (p) p[2] = c; }
const isRoad = l => l['source-layer'] === 'transportation' && l.type === 'line' && !/rail/.test(l.id);
const isPath = l => /path_pedestrian/.test(l.id);
// white dashes down the middle of the bigger roads (the 'asphalt' style), as on the 3D page
function addCentreLines(map) {
  const layers = map.getStyle().layers, src = (layers.find(l => l['source-layer'] === 'transportation') || {}).source;
  if (!src) return;
  const before = layers.find(l => /^bridge_/.test(l.id) || l.type === 'symbol');
  map.addLayer({ id: 'road-centre-line', type: 'line', source: src, 'source-layer': 'transportation',
    filter: ['all', ['==', ['geometry-type'], 'LineString'], ['in', ['get', 'class'], ['literal', ['trunk', 'primary', 'secondary', 'tertiary']]], ['!=', ['get', 'brunnel'], 'tunnel']],
    layout: { 'line-cap': 'butt', visibility: 'none' },
    paint: { 'line-color': '#f4efe2', 'line-dasharray': [2, 2.5], 'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 15, .5, 20, 2] } }, before && before.id);
  PAINTS.push(['road-centre-line', 'line-color', '#f4efe2', false]);
}
function applyLook() {
  if (!styleReady) return;
  const L = LOOK, rs = ROAD_STYLES[L.roadStyle] || ROAD_STYLES.paper;
  for (const l of map.getStyle().layers) {
    const id = l.id;
    if (!BASE.has(id)) BASE.set(id, l.type === 'symbol' ? { tf: map.getLayoutProperty(id, 'text-field'), ts: map.getLayoutProperty(id, 'text-size') }
      : l.type === 'line' ? { lw: map.getPaintProperty(id, 'line-width'), dash: map.getPaintProperty(id, 'line-dasharray') } : {});
    const B = BASE.get(id), kind = l.type === 'symbol' ? LABEL_KIND(id) : null;
    try {
      if (kind) {
        map.setLayoutProperty(id, 'visibility', L.labels[kind] === false ? 'none' : 'visible');
        if (B.tf) map.setLayoutProperty(id, 'text-field', L.lang === 'zh' ? TEXT.zh : L.lang === 'en' ? TEXT.en : B.tf);
        if (B.ts != null) map.setLayoutProperty(id, 'text-size', times(B.ts, L.textScale));
      }
      if (isRoad(l)) {
        if (B.lw != null) map.setPaintProperty(id, 'line-width', times(B.lw, L.roadWidth));
        const casing = /casing/.test(id);
        if (isPath(l)) {
          if (!casing) { setBase(id, 'line-color', rs.path); map.setPaintProperty(id, 'line-dasharray', L.paths === 'solid' ? null : B.dash); }
          map.setLayoutProperty(id, 'visibility', L.paths === 'hidden' ? 'none' : 'visible');
        } else if (casing) { setBase(id, 'line-color', rs.edge); map.setLayoutProperty(id, 'visibility', rs.edges ? 'visible' : 'none'); }
        else setBase(id, 'line-color', rs.road);
      }
      if (id === 'road-centre-line') { map.setLayoutProperty(id, 'visibility', rs.centre ? 'visible' : 'none'); map.setPaintProperty(id, 'line-width', times(B.lw, L.roadWidth)); }
    } catch (err) { console.warn('look', id, err); }
  }
  paintMap(lastNight, lastWet);   // the colours, for the time of day
}
function setLook(look) {
  const D = LOOK_DEFAULT, x = look || {};
  LOOK = { ...D, ...x, labels: { ...D.labels, ...(x.labels || {}) } };
  applyLook();
}

/* ---------------- the map ---------------- */
// the same view as the 3D page's whole-campus camera: centre of the plot, looking along its yaw (plot -> compass bearing)
const ISO = { yaw: -35, pitch: 40, ...((CITY.cameras || {}).iso || {}) };
const look = (() => { const t = ISO.yaw * Math.PI / 180, dx = -Math.cos(t), dy = -Math.sin(t);
  return Math.atan2(dx * Math.cos(ROT) - dy * Math.sin(ROT), dx * Math.sin(ROT) + dy * Math.cos(ROT)) * 180 / Math.PI; })();
const HOME = { center: toLngLat([ISO.x || 0, ISO.y || 0]), zoom: 15.9, pitch: 90 - 40, bearing: 0 };   // north up (the 3D page's own turn would be `look`)
const map = new maplibregl.Map({ container: 'map', style: 'https://tiles.openfreemap.org/styles/liberty', ...HOME, maxPitch: 70, antialias: true, attributionControl: { compact: true } });
window.__map = map;
window.__world = { WORLD, STATE, U, get triangles() { return triangles; }, get queue() { return queue.length; }, get tileBuildings() { return tileBuildings; }, get landmarks() { return LM_COUNT; }, pickAt: (x, y) => pickAt(x, y), ray: () => ray, get camera() { return camera; }, SOLIDS, PICKS };
// the style asks for a few icons its sprite does not have: an empty image each instead of a console warning
map.on('styleimagemissing', e => { if (!map.hasImage(e.id)) map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) }); });
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showZoom: false }), 'top-right');
const camera = new THREE.Camera(), inv = new THREE.Matrix4();
map.on('style.load', () => {
  restyle(map); addZones(map); addCentreLines(map); styleReady = true; applyLook();
  // the map's own 3D blocks give way to ours; its flat footprints stay as a hint until a tile's buildings are drawn
  const bl = map.getStyle().layers.filter(l => l['source-layer'] === 'building'), src = bl[0] && bl[0].source;
  for (const l of bl) if (l.type === 'fill-extrusion') map.setLayoutProperty(l.id, 'visibility', 'none');
  buildPlot();
  // the three.js layer: plot metres -> Mercator
  const base = maplibregl.MercatorCoordinate.fromLngLat([META.lon, META.lat], 0), k = base.meterInMercatorCoordinateUnits();
  const model = new THREE.Matrix4().makeTranslation(base.x, base.y, base.z)
    .multiply(new THREE.Matrix4().makeScale(k, -k, k))          // Mercator y grows to the south
    .multiply(new THREE.Matrix4().makeRotationZ(ROT));           // plot metres -> east/north
  let renderer = null, lastT = 0, simT = 0;
  map.addLayer({
    id: 'pocket-city', type: 'custom', renderingMode: '3d',
    onAdd(m, gl) {
      renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true });
      renderer.autoClear = false; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
    },
    render(gl, matrix) {
      const nowMs = performance.now(), dt = Math.min(.1, (nowMs - (lastT || nowMs)) / 1000); lastT = nowMs; simT += dt;
      moveMovers(dt); moveRain(simT);
      camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix).multiply(model); camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      // which way the camera looks, in plot coordinates (for the two-sided faces)
      const b = map.getBearing() * Math.PI / 180, p = map.getPitch() * Math.PI / 180, [vx, vy] = enToPlot(-Math.sin(b) * Math.sin(p), -Math.cos(b) * Math.sin(p));
      U.uView.value.set(vx, vy, Math.cos(p)).normalize();
      if (shadowsDirty) { renderer.shadowMap.needsUpdate = true; shadowsDirty = false; }
      renderer.resetState(); renderer.render(WORLD, camera);
    },
  });
  // people, cars and rain move: keep drawing (not when the page is hidden)
  const loop = () => { requestAnimationFrame(loop); if (!document.hidden) map.triggerRepaint(); }; loop();
  // new tiles: draw their buildings, a slice per frame so the map keeps moving
  map.on('idle', () => { if (src) collectTiles(src); if (!pumping && queue.length) pump(); });
  applyState(); fetchWeather(); setInterval(fetchWeather, 10 * 60 * 1000); setInterval(applyState, 60 * 1000);
  map.once('idle', () => { $('loading').hidden = true; });
});

/* ---------------- a tap on a building flies to it ---------------- */
const ray = new THREE.Raycaster(), HIT = new THREE.Vector3();
const buildingAt = (x, y) => { for (let i = PICKS.length - 1; i >= 0; i--) if (PICKS[i].fps.some(fp => inPoly([x, y], fp))) return PICKS[i]; return null; };
function pickAt(px, py) {
  const r = map.getCanvas().getBoundingClientRect(), nx = (px / r.width) * 2 - 1, ny = -(py / r.height) * 2 + 1;
  // un-project through the map's matrix: the ray in plot metres
  const a = new THREE.Vector3(nx, ny, -1).applyMatrix4(camera.projectionMatrixInverse), b = new THREE.Vector3(nx, ny, 1).applyMatrix4(camera.projectionMatrixInverse);
  ray.set(a, b.sub(a).normalize());
  for (const h of ray.intersectObjects(SOLIDS, false).slice(0, 8)) {
    HIT.copy(h.point).addScaledVector(ray.ray.direction, .6);   // a little way in, so a hit on a wall falls inside the outline
    const g = buildingAt(HIT.x, HIT.y); if (g) return g;
  }
  const o = ray.ray.origin, d = ray.ray.direction, t = d.z ? -o.z / d.z : -1;   // flat landmarks (the track, the plazas): where the tap meets the ground
  return t > 0 ? buildingAt(o.x + d.x * t, o.y + d.y * t) : null;
}
function flyTo(g) {
  const pts = g.fps.flat(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x = (Math.min(...xs) + Math.max(...xs)) / 2, y = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(12, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), (g.h || 0) * 1.2);
  // the zoom at which the building fills about 60% of the shorter side of the screen
  const r = map.getCanvas().getBoundingClientRect(), z = Math.log2(40075016.686 * Math.cos(META.lat * Math.PI / 180) * .6 * Math.min(r.width, r.height) / (512 * span));
  map.flyTo({ center: toLngLat([x, y]), zoom: Math.max(16.5, Math.min(20, z)), duration: 900 });
}
map.on('click', e => { const g = pickAt(e.point.x, e.point.y); if (g) flyTo(g); });
$('home').onclick = () => map.flyTo({ ...HOME, duration: 900 });
})();
